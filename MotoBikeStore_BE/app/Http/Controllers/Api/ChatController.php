<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;
use OpenAI;
use App\Services\ProductLookup;
use App\Models\AiMemory;

class ChatController extends Controller
{
    public function __construct(private ProductLookup $lookup) {}

    /* ===================== UPLOAD ẢNH ===================== */
    public function uploadImage(Request $req)
    {
        $req->validate(['file' => 'required|image|max:4096']);
        $path = $req->file('file')->store('chat_uploads', 'public');
        return response()->json(['url' => asset('storage/'.$path)]);
    }

    /* ===================== NON-STREAM ===================== */
    public function chat(Request $req)
    {
        $messages = $this->normalizeMessages($req->input('messages', []));
        $messages = $this->withCatalogContext($messages, (bool)$req->input('use_db', true));

        // auto-memory từ câu user gần nhất
        $this->autoRememberFromMessages($messages);

        $client = OpenAI::client(config('services.openai.api_key'));
        $res = $client->chat()->create([
            'model'       => $req->input('model', 'gpt-4o-mini'),
            'messages'    => $messages,
            'temperature' => (float)$req->input('temperature', 0.3),
        ]);

        return response()->json(['reply' => $res->choices[0]->message->content ?? '']);
    }

    /* ===================== STREAM (SSE plain text) ===================== */
    public function stream(Request $req)
    {
        $raw   = json_decode($req->query('messages', '[]'), true) ?: [];
        $useDb = filter_var($req->query('use_db', '1'), FILTER_VALIDATE_BOOL);

        $messages = $this->normalizeMessages($raw);
        $messages = $this->withCatalogContext($messages, $useDb);

        // auto-memory
        $this->autoRememberFromMessages($messages);

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
                    echo "data: {$delta}\n\n";   // <-- gửi plain text
                    @ob_flush(); flush();
                }
            }
            echo "data: [DONE]\n\n";
            @ob_flush(); flush();
        };

        return new StreamedResponse($callback, 200, ['Content-Type' => 'text/event-stream']);
    }

    /* ===================== MEMORY API ===================== */
    public function memoryIndex(Request $req)
    {
        [$userId, $visitorId] = $this->who($req);
        $q = AiMemory::query()
            ->when($userId, fn($x)=>$x->where('user_id',$userId))
            ->when(!$userId && $visitorId, fn($x)=>$x->where('visitor_id',$visitorId))
            ->where(function($x){ $x->whereNull('expires_at')->orWhere('expires_at','>',now()); })
            ->orderByDesc('weight')->orderByDesc('updated_at');

        return response()->json($q->get());
    }

    public function memoryUpsert(Request $req)
    {
        [$userId, $visitorId] = $this->who($req);
        $data = $req->validate([
            'key'   => 'required|string|max:100',
            'value' => 'required',
            'scope' => 'nullable|string|in:profile,preference,context',
            'weight'=> 'nullable|integer|min:1|max:100',
            'ttl'   => 'nullable|integer|min:60'
        ]);

        $mem = AiMemory::updateOrCreate(
            ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>$data['key']],
            [
                'value'      => is_string($data['value']) ? ['text'=>$data['value']] : $data['value'],
                'scope'      => $data['scope'] ?? 'preference',
                'weight'     => $data['weight'] ?? 50,
                'expires_at' => isset($data['ttl']) ? now()->addSeconds($data['ttl']) : null,
            ]
        );

        return response()->json($mem);
    }

    public function memoryDelete(Request $req, string $key)
    {
        [$userId, $visitorId] = $this->who($req);
        AiMemory::where('key',$key)
            ->when($userId, fn($x)=>$x->where('user_id',$userId))
            ->when(!$userId && $visitorId, fn($x)=>$x->where('visitor_id',$visitorId))
            ->delete();

        return response()->json(['ok'=>true]);
    }

    private function who(Request $req): array
    {
        $user = $req->user();
        $userId = $user?->id;
        $visitorId = $req->input('visitor_id') ?: $req->header('X-Visitor');
        if (!$userId && !$visitorId) {
            $visitorId = substr(hash('sha1', $req->ip().($req->userAgent()??'').config('app.key')),0,32);
        }
        return [$userId, $visitorId];
    }

    /* ===================== Normalize messages ===================== */
    private function normalizeMessages(array $messages): array
    {
        // hỗ trợ {role, content:"..."} và {role, contentParts:[{type:'text'|'image_url'}]}
        return array_map(function ($m) {
            if (!empty($m['contentParts']) && is_array($m['contentParts'])) {
                $parts = [];
                foreach ($m['contentParts'] as $p) {
                    $type = $p['type'] ?? '';
                    if ($type === 'text') {
                        $parts[] = ['type' => 'text', 'text' => (string)($p['text'] ?? '')];
                    } elseif ($type === 'image_url') {
                        $url = is_array($p['image_url']) ? ($p['image_url']['url'] ?? '') : ($p['image_url'] ?? '');
                        if ($url) $parts[] = ['type' => 'input_image', 'image_url' => $url];
                    }
                }
                return ['role' => $m['role'] ?? 'user', 'content' => $parts];
            }
            return ['role' => $m['role'] ?? 'user', 'content' => (string)($m['content'] ?? '')];
        }, $messages);
    }

    /* ===================== Catalog + Memory vào prompt ===================== */
    private function withCatalogContext(array $messages, bool $useDb): array
    {
        if (!$useDb) return $messages;

        // lấy memory
        [$userId, $visitorId] = $this->who(request());
        $mems = AiMemory::query()
            ->when($userId, fn($x)=>$x->where('user_id',$userId))
            ->when(!$userId && $visitorId, fn($x)=>$x->where('visitor_id',$visitorId))
            ->where(function($x){ $x->whereNull('expires_at')->orWhere('expires_at','>',now()); })
            ->orderByDesc('weight')->limit(20)->get();

        $memoryLines = $mems->map(function($m){
            $v = is_array($m->value) ? json_encode($m->value, JSON_UNESCAPED_UNICODE) : (string)$m->value;
            return "- {$m->key}: {$v}";
        })->implode("\n");

        // text user gần nhất để tìm
        $lastUser = collect($messages)->reverse()->firstWhere('role','user')['content'] ?? '';
        $userText = is_string($lastUser) ? $lastUser : '';

        $catalog = $userText && mb_strlen($userText) > 2
            ? $this->lookup->findRelevant($userText, 12)
            : $this->lookup->featured(8);

        if (empty($catalog)) {
            $system = [
                'role'=>'system',
                'content'=>
                    "Bạn là tư vấn viên. ".($memoryLines ? "MEMORY:\n{$memoryLines}\n\n" : "").
                    "Hiện chưa có catalog để tham chiếu; hãy hỏi thêm thông tin người dùng."
            ];
            return [$system, ...$messages];
        }

        $lines = array_map(function ($p) {
            $stock = is_null($p['qty']) ? 'N/A' : ($p['qty'] > 0 ? 'còn hàng' : 'hết hàng');
            $img   = $p['thumbnail_url'] ?? '';
            return "- #{$p['id']} | {$p['name']} | slug: {$p['slug']} | giá: {$p['price']} | {$stock}"
                 . ($img ? " | img: {$img}" : "");
        }, $catalog);

        $system = [
            'role' => 'system',
            'content' =>
                "Bạn là tư vấn viên bán xe máy. Luôn:\n".
                "• Dùng MEMORY (nếu có) để cá nhân hoá.\n".
                "• Trả lời ngắn gọn; nếu có 'img:' trong catalog, chèn ảnh ngay sau tên bằng Markdown: ![](URL).\n".
                "• Nếu không thấy đúng mẫu, đề xuất 2–3 mẫu gần nhất và hỏi gợi mở (tầm giá/kiểu xe/hãng).\n\n".
                ($memoryLines ? "MEMORY:\n{$memoryLines}\n\n" : "").
                "CATALOG (rút gọn):\n".implode("\n", $lines)
        ];

        // đính 1–2 ảnh thật cho model "nhìn" (khi attach_images=1)
        $attach = request()->boolean('attach_images', false);
        if ($attach) {
            $parts = [['type'=>'text','text'=>'Ảnh vài mẫu phù hợp:']];
            $count = 0;
            foreach ($catalog as $p) {
                if (!empty($p['thumbnail_url'])) {
                    $parts[] = ['type'=>'input_image','image_url'=>$p['thumbnail_url']];
                    $parts[] = ['type'=>'text','text'=>"{$p['name']} — giá {$p['price']}"];
                    if (++$count >= 2) break;
                }
            }
            return [$system, ['role'=>'user','content'=>$parts], ...$messages];
        }

        return [$system, ...$messages];
    }

    /* ===================== Auto-remember simple patterns ===================== */
    private function autoRememberFromMessages(array $messages): void
    {
        $last = collect($messages)->reverse()->firstWhere('role','user')['content'] ?? '';
        if (!is_string($last)) return;
        $text = mb_strtolower($last);
        [$userId, $visitorId] = $this->who(request());

        // tên
        if (preg_match('/tôi tên (?:là)?\s*([a-zà-ỹ\s]{2,30})/iu', $text, $m)) {
            AiMemory::updateOrCreate(
                ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'name'],
                ['value'=>['text'=>trim($m[1])],'scope'=>'profile','weight'=>90]
            );
        }
        // hãng
        if (preg_match('/(th[íi]ch|chuộng)\s+(honda|yamaha|suzuki|piaggio|sym|vinfast)/iu', $text, $m)) {
            AiMemory::updateOrCreate(
                ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'preferred_brand'],
                ['value'=>['brand'=>strtoupper($m[2])],'scope'=>'preference','weight'=>85]
            );
        }
        // ngân sách
        if (preg_match('/(\d{2,3})\s*-\s*(\d{2,3})\s*tr/iu', $text, $m)) {
            $min=(int)$m[1]*1_000_000; $max=(int)$m[2]*1_000_000;
            AiMemory::updateOrCreate(
                ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'budget_range'],
                ['value'=>['min'=>$min,'max'=>$max,'unit'=>'VND'],'scope'=>'preference','weight'=>88]
            );
        } elseif (preg_match('/(?:kho[ảa]ng|t[âa]m)\s*(\d{2,3})\s*tr/iu', $text, $m)) {
            $mid=(int)$m[1]*1_000_000;
            AiMemory::updateOrCreate(
                ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'budget_range'],
                ['value'=>['min'=>$mid*0.9,'max'=>$mid*1.1,'unit'=>'VND'],'scope'=>'preference','weight'=>70]
            );
        } elseif (preg_match('/dư[ớo]i\s*(\d{2,3})\s*tr/iu', $text, $m)) {
            $max=(int)$m[1]*1_000_000;
            AiMemory::updateOrCreate(
                ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'budget_range'],
                ['value'=>['min'=>0,'max'=>$max,'unit'=>'VND'],'scope'=>'preference','weight'=>70]
            );
        }
        // kiểu xe
        if (preg_match('/(tay ga|c[ôn] tay|xe s[oố]|\bx\s*s\b|adventure|cào cào)/iu', $text, $m)) {
            AiMemory::updateOrCreate(
                ['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'style'],
                ['value'=>['text'=>trim($m[1])],'scope'=>'preference','weight'=>75]
            );
        }
    }
}
