<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Storage;
use OpenAI;
use App\Services\ProductLookup;

class ChatController extends Controller
{
    public function __construct(private ProductLookup $lookup) {}

    /* ===================== UPLOAD ẢNH ===================== */
    // POST /api/chat/upload  -> { url: "http://.../storage/chat_uploads/xyz.png" }
    public function uploadImage(Request $req)
    {
        $req->validate([
            'file' => 'required|image|max:4096', // 4MB
        ]);
        $path = $req->file('file')->store('chat_uploads', 'public');
        return response()->json(['url' => asset('storage/'.$path)]);
    }

    /* ===================== NON-STREAM ===================== */
    public function chat(Request $req)
    {
        // FE có thể gửi: [{role, content:"..."}, {role, contentParts:[{type:"text"| "image_url", ...}]}]
        $messages = $this->normalizeMessages($req->input('messages', []));
        $messages = $this->withCatalogContext(
            $messages,
            (bool)$req->input('use_db', true)
        );

        $client = OpenAI::client(config('services.openai.api_key'));
        $res = $client->chat()->create([
            'model'       => $req->input('model', 'gpt-4o-mini'),
            'messages'    => $messages,
            'temperature' => (float)$req->input('temperature', 0.3),
        ]);

        return response()->json([
            'reply' => $res->choices[0]->message->content ?? ''
        ]);
    }

    /* ===================== STREAM SSE ===================== */
    public function stream(Request $req)
    {
        $raw   = json_decode($req->query('messages', '[]'), true) ?: [];
        $useDb = filter_var($req->query('use_db', '1'), FILTER_VALIDATE_BOOL);

        $messages = $this->normalizeMessages($raw);
        $messages = $this->withCatalogContext($messages, $useDb);

        $client = OpenAI::client(config('services.openai.api_key'));
        $model  = $req->query('model', 'gpt-4o-mini');
        $temp   = (float)$req->query('temperature', 0.3);

        $callback = function () use ($client, $messages, $model, $temp) {
            @ob_end_clean();
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('X-Accel-Buffering: no');

            $stream = $client->chat()->createStreamed([
                'model'       => $model,
                'messages'    => $messages,
                'temperature' => $temp,
            ]);

            foreach ($stream as $resp) {
                $delta = $resp->choices[0]->delta->content ?? '';
                if ($delta !== '') {
                    echo "data: " . json_encode($delta, JSON_UNESCAPED_UNICODE) . "\n\n";
                    @ob_flush(); flush();
                }
            }
            echo "data: [DONE]\n\n";
            @ob_flush(); flush();
        };

        return new StreamedResponse($callback, 200, ['Content-Type' => 'text/event-stream']);
    }

    /* ========= CHUẨN HÓA MESSAGES: hỗ trợ text + image ========= */
    private function normalizeMessages(array $messages): array
    {
        // Hỗ trợ 2 dạng:
        // 1) { role, content: "text" }
        // 2) { role, contentParts: [ {type:"text", text:"..."}, {type:"image_url", image_url:{url:"..."}} ] }
        return array_map(function ($m) {
            if (!empty($m['contentParts']) && is_array($m['contentParts'])) {
                $parts = [];
                foreach ($m['contentParts'] as $p) {
                    $type = $p['type'] ?? '';
                    if ($type === 'text') {
                        $parts[] = ['type' => 'text', 'text' => (string)($p['text'] ?? '')];
                    } elseif ($type === 'image_url') {
                        // OpenAI PHP client 0.7: dùng 'input_image'
                        $url = is_array($p['image_url']) ? ($p['image_url']['url'] ?? '') : ($p['image_url'] ?? '');
                        if ($url) $parts[] = ['type' => 'input_image', 'image_url' => $url];
                    }
                }
                return ['role' => $m['role'] ?? 'user', 'content' => $parts];
            }
            // fallback string
            return ['role' => $m['role'] ?? 'user', 'content' => (string)($m['content'] ?? '')];
        }, $messages);
    }

    /* ========= BƠM CONTEXT SẢN PHẨM TỪ DB (có URL ảnh) ========= */
    private function withCatalogContext(array $messages, bool $useDb): array
    {
        if (!$useDb) return $messages;

        // Chỉ lấy text của user gần nhất (nếu message là parts thì bỏ qua để tránh rườm)
        $lastUser = collect($messages)->reverse()->firstWhere('role','user')['content'] ?? '';
        $userText = is_string($lastUser) ? $lastUser : '';

        $catalog = $userText && mb_strlen($userText) > 2
            ? $this->lookup->findRelevant($userText, 12)
            : $this->lookup->featured(8);

        if (empty($catalog)) return $messages;

        // 1) Nhúng text catalog + URL ảnh -> khuyến khích chèn Markdown ![](url)
        $lines = array_map(function ($p) {
            $stock = is_null($p['qty']) ? 'N/A' : ($p['qty'] > 0 ? 'còn hàng' : 'hết hàng');
            $img   = $p['thumbnail_url'] ?? '';
            return "- #{$p['id']} | {$p['name']} | slug: {$p['slug']} | giá: {$p['price']} | {$stock}"
                 . ($img ? " | img: {$img}" : "");
        }, $catalog);

        $system = [
            'role' => 'system',
            'content' =>
                "Bạn là trợ lý bán hàng. Khi giới thiệu sản phẩm, nếu dòng catalog có 'img:', hãy CHÈN ảnh bìa ngay sau tên bằng Markdown, ví dụ: ![](URL_ẢNH).\n".
                "Nếu sản phẩm không có trong danh sách thì nói 'không có dữ liệu'.\n\n".
                "CATALOG (rút gọn):\n".implode("\n", $lines)
        ];

        // 2) (Tùy chọn) Đính kèm tối đa 3 ảnh thật cho model xem (Vision)
        // Bật bằng query `attach_images=1`
        $attach = request()->boolean('attach_images', false);
        if ($attach) {
            $parts = [
                ['type' => 'text', 'text' =>
                    "Các ảnh sau là thumbnail của sản phẩm liên quan. Hãy dùng để mô tả/so sánh nếu phù hợp."
                ],
            ];
            foreach (array_slice($catalog, 0, 3) as $p) {
                if (!empty($p['thumbnail_url'])) {
                    $parts[] = ['type' => 'input_image', 'image_url' => $p['thumbnail_url']];
                    $parts[] = ['type' => 'text', 'text' => "{$p['name']} — giá {$p['price']}"];
                }
            }
            // system ở đầu, tiếp theo là 1 message 'user' chứa ảnh, rồi các messages còn lại
            return [$system, ['role' => 'user', 'content' => $parts], ...$messages];
        }

        // Mặc định: chỉ thêm system + text catalog
        return [$system, ...$messages];
    }
}
