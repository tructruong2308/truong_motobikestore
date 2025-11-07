<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;
use OpenAI;
use App\Services\ProductLookup;

class ChatController extends Controller
{
    public function __construct(private ProductLookup $lookup) {}

    // Non-stream (tùy chọn)
    public function chat(Request $req)
    {
        $messages = $this->withCatalogContext(
            $req->input('messages', []),
            (bool)$req->input('use_db', true)
        );

        $client = OpenAI::client(config('services.openai.api_key'));
        $res = $client->chat()->create([
            'model' => $req->input('model', 'gpt-4o-mini'),
            'messages' => $messages,
            'temperature' => (float)($req->input('temperature', 0.3)),
        ]);

        return response()->json([
            'reply' => $res->choices[0]->message->content ?? ''
        ]);
    }

    // Streaming SSE
    public function stream(Request $req)
    {
        $messages = json_decode($req->query('messages', '[]'), true) ?: [];
        $useDb    = filter_var($req->query('use_db', '1'), FILTER_VALIDATE_BOOL);

        $messages = $this->withCatalogContext($messages, $useDb);

        $client = OpenAI::client(config('services.openai.api_key'));
        $model  = $req->query('model', 'gpt-4o-mini');
        $temp   = (float)($req->query('temperature', 0.3));

        $callback = function () use ($client, $messages, $model, $temp) {
            @ob_end_clean();
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('X-Accel-Buffering: no');

            $stream = $client->chat()->createStreamed([
                'model' => $model,
                'messages' => $messages,
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

        return new StreamedResponse($callback, 200, [
            'Content-Type' => 'text/event-stream',
        ]);
    }

    /** Trộn "catalog context" từ DB vào đầu messages */
    private function withCatalogContext(array $messages, bool $useDb): array
    {
        if (!$useDb) return $messages;

        $lastUser = collect($messages)->reverse()->firstWhere('role','user')['content'] ?? '';
        $catalog = $lastUser && mb_strlen($lastUser) > 2
            ? $this->lookup->findRelevant($lastUser, 12)
            : $this->lookup->featured(8);

        if (empty($catalog)) return $messages;

        $lines = array_map(function ($p) {
            $stock = is_null($p['qty']) ? 'N/A' : ($p['qty'] > 0 ? 'còn hàng' : 'hết hàng');
            return "- #{$p['id']} | {$p['name']} | slug: {$p['slug']} | giá: {$p['price']} | {$stock} | hãng: ".($p['brand_name'] ?? 'N/A');
        }, $catalog);

        $system = [
            'role' => 'system',
            'content' =>
                "Bạn là trợ lý bán hàng. Dựa vào CATALOG bên dưới để trả lời câu hỏi liên quan.\n".
                "Nếu người dùng hỏi sản phẩm không có trong danh sách, nói rõ 'không có dữ liệu'.\n".
                "Ưu tiên nêu: tên, giá (price_sale nếu có, nếu không dùng price_root), tình trạng còn hàng, và gợi ý gần giống khi phù hợp.\n\n".
                "CATALOG (rút gọn):\n".implode("\n", $lines)
        ];

        return [$system, ...$messages];
    }
}
