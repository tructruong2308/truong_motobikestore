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
        $this->autoRememberFromMessages($messages);

        $client = OpenAI::client(config('services.openai.api_key'));
        $res = $client->chat()->create([
            'model'       => $req->input('model', 'gpt-4o-mini'),
            'messages'    => $messages,
            'temperature' => (float)$req->input('temperature', 0.3),
        ]);

        return response()->json(['reply' => $res->choices[0]->message->content ?? '']);
    }

    /* ===================== STREAM (SSE) ===================== */
    public function stream(Request $req)
    {
        $raw   = json_decode($req->query('messages', '[]'), true) ?: [];
        $useDb = filter_var($req->query('use_db', '1'), FILTER_VALIDATE_BOOL);

        $messages = $this->normalizeMessages($raw);
        $messages = $this->withCatalogContext($messages, $useDb);
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
                    echo "data: {$delta}\n\n";
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
            ->where(fn($x)=>$x->whereNull('expires_at')->orWhere('expires_at','>',now()))
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

    /* ===================== Helpers: Parse ý định ===================== */
    private function parseBudget(string $text): array
    {
        $s = mb_strtolower($text);
        if (preg_match('/(\d{1,3})\s*[-–]\s*(\d{1,3})\s*(tr|triệu)/iu', $s, $m)) return [(int)$m[1]*1_000_000, (int)$m[2]*1_000_000];
        if (preg_match('/(?:kho[ảa]ng|t[âa]m)\s*(\d{1,3})\s*(tr|triệu)/iu', $s, $m)) { $mid=(int)$m[1]*1_000_000; return [(int)round($mid*0.9),(int)round($mid*1.1)]; }
        if (preg_match('/dư[ớo]i\s*(\d{1,3})\s*(tr|triệu)/iu', $s, $m)) return [0, (int)$m[1]*1_000_000];
        if (preg_match('/\b(\d{1,3})\s*(tr|triệu)\b/iu', $s, $m)) { $mid=(int)$m[1]*1_000_000; return [(int)round($mid*0.95),(int)round($mid*1.05)]; }
        return [null, null];
    }

    private function parseBrands(string $text): array
    {
        $s = mb_strtolower($text);
        $brands = ['honda','yamaha','suzuki','piaggio','sym','vinfast','kymco'];
        return array_values(array_filter($brands, fn($b)=>str_contains($s, $b)));
    }

    private function parseCategoryHints(string $text): array
    {
        $s = mb_strtolower($text);
        $hints = [];
        if (preg_match('/tay\s*ga|scooter/iu',$s)) $hints[]='tay ga';
        if (preg_match('/c[ôo]n\s*tay|manual|clutch/iu',$s)) $hints[]='côn tay';
        if (preg_match('/xe\s*số|số\s*thường/iu',$s)) $hints[]='xe số';
        if (preg_match('/adventure|đa dụng|phượt/iu',$s)) $hints[]='adventure';
        if (preg_match('/cào\s*cào|offroad/iu',$s)) $hints[]='cào cào';
        return $hints;
    }

    private function parseFlags(string $text): array
    {
        $s = mb_strtolower($text);
        return [
            'onSale'  => (bool)preg_match('/gi[ảa]m|sale|khuy[êe]n m[ãa]i|ưu [đd]ãi/iu',$s),
            'inStock' => (bool)preg_match('/c[òo]n\s*h[àa]ng|c[òo]n\s*([0-9]+)?\s*xe/iu',$s),
        ];
    }

    private function parseCC(string $text): array
    {
        $s = mb_strtolower($text);
        if (preg_match('/(\d{2,4})\s*cc/iu',$s,$m)) { $mid=(int)$m[1]; return [$mid-10, $mid+10]; }
        return [null,null];
    }

    private function parseCompare(string $text): ?array
    {
        $s = mb_strtolower($text);
        if (preg_match('/so s[áa]nh\s+(.+)\s+(?:v[ơo]i|vs|v.s\.?)\s+(.+)/iu', $s, $m)) {
            return [trim($m[1]), trim($m[2])];
        }
        return null;
    }

    /* ===================== Normalize content ===================== */
    private function normalizeMessages(array $messages): array
    {
        return array_map(function ($m) {
            if (!empty($m['contentParts']) && is_array($m['contentParts'])) {
                $parts = [];
                foreach ($m['contentParts'] as $p) {
                    $type = $p['type'] ?? '';
                    if ($type === 'text') {
                        $parts[] = ['type' => 'text', 'text' => (string)($p['text'] ?? '')];
                    } elseif ($type === 'image_url') {
                        // ✅ ĐÚNG CHUẨN v0.7
                        $url = is_array($p['image_url']) ? ($p['image_url']['url'] ?? '') : ($p['image_url'] ?? '');
                        if ($url) {
                            $parts[] = ['type' => 'image_url', 'image_url' => ['url' => $url]];
                        }
                    }
                }
                return ['role' => $m['role'] ?? 'user', 'content' => $parts];
            }
            return ['role' => $m['role'] ?? 'user', 'content' => (string)($m['content'] ?? '')];
        }, $messages);
    }

    /* ===================== Catalog + Memory ===================== */
    private function withCatalogContext(array $messages, bool $useDb): array
    {
        // Tin nhắn user gần nhất
        $lastUser = collect($messages)->reverse()->firstWhere('role','user')['content'] ?? '';
        $userText = is_string($lastUser) ? $lastUser : '';

        // 1) Parse ý định
        [$minB, $maxB] = $this->parseBudget($userText);
        [$ccMin, $ccMax] = $this->parseCC($userText);
        $brands = $this->parseBrands($userText);
        $cats   = $this->parseCategoryHints($userText);
        $flags  = $this->parseFlags($userText);
        $compare= $this->parseCompare($userText);

        // 2) Memory
        [$userId, $visitorId] = $this->who(request());
        $mems = AiMemory::query()
            ->when($userId, fn($x)=>$x->where('user_id',$userId))
            ->when(!$userId && $visitorId, fn($x)=>$x->where('visitor_id',$visitorId))
            ->where(fn($x)=>$x->whereNull('expires_at')->orWhere('expires_at','>',now()))
            ->orderByDesc('weight')->limit(20)->get();

        $memoryLines = $mems->map(function($m){
            $v = is_array($m->value) ? json_encode($m->value, JSON_UNESCAPED_UNICODE) : (string)$m->value;
            return "- {$m->key}: {$v}";
        })->implode("\n");

        // 3) Chuẩn bị CATALOG
        $catalog = [];
        if ($useDb) {
            if ($compare && $compare[0] && $compare[1]) {
                // so sánh 2 mẫu
                $cmp = $this->lookup->compare2($compare[0], $compare[1]);
                $rows = array_filter([$cmp['left'], $cmp['right']]);
                $catalog = array_values($rows);
            } else {
                $filters = [
                    'keyword'     => $userText,
                    'brandNames'  => $brands,
                    'categoryHints'=>$cats,
                    'min'         => $minB,
                    'max'         => $maxB,
                    'onSale'      => $flags['onSale'] ?? false,
                    'inStock'     => $flags['inStock'] ?? false,
                    'ccMin'       => $ccMin,
                    'ccMax'       => $ccMax,
                    'sort'        => 'price-asc'
                ];

                $hasStrongFilter = $filters['min']!==null || $filters['max']!==null
                    || !empty($filters['brandNames']) || !empty($filters['categoryHints'])
                    || !empty($flags['onSale']) || !empty($flags['inStock']) || $ccMin!==null;

                if ($hasStrongFilter) {
                    $catalog = $this->lookup->searchAdvanced($filters, 12);
                } else {
                    $catalog = $userText && mb_strlen($userText) > 1
                        ? $this->lookup->findRelevant($userText, 12)
                        : $this->lookup->featured(8);
                }

                // fallback bắt buộc
                if (empty($catalog)) {
                    $any = \App\Models\Product::query()->latest('id')->limit(8)->get();
                    $catalog = $any->map(function ($p) {
                        $price = (float) ($p->price_sale > 0 ? $p->price_sale : ($p->price_root ?? 0));
                        return [
                            'id'=>$p->id,'name'=>$p->name,'slug'=>$p->slug,'price'=>$price,
                            'qty'=>(int)($p->qty ?? 0),
                            'brand_name'=>optional($p->brand)->name,
                            'category_name'=>optional($p->category)->name,
                            'thumbnail_url'=>$p->thumbnail_url,
                        ];
                    })->all();
                }
            }
        }

        // 4) Build system
        $lines = array_map(function ($p) {
            $stock = is_null($p['qty']) ? 'N/A' : ($p['qty'] > 0 ? 'còn hàng' : 'hết hàng');
            $img   = $p['thumbnail_url'] ?? '';
            return "- #{$p['id']} | {$p['name']} | slug: {$p['slug']} | giá: {$p['price']} | {$stock}"
                 . ($img ? " | img: {$img}" : "");
        }, $catalog ?? []);

        $budgetHint = ($minB!==null || $maxB!==null)
            ? "Người dùng có ngân sách ".($minB?number_format($minB):'…')." - ".($maxB?number_format($maxB):'…')." VND.\n" : "";
        $brandHint  = !empty($brands) ? ("Ưu tiên hãng: ".implode(', ',$brands).".\n") : "";
        $catHint    = !empty($cats)   ? ("Ưu tiên loại: ".implode(', ',$cats).".\n")   : "";
        $flagHint   = (($flags['onSale']??false) ? "Chỉ mẫu đang khuyến mãi.\n" : "")
                    . (($flags['inStock']??false) ? "Chỉ mẫu còn hàng.\n" : "");

        $compareHint = $compare ? "Nhiệm vụ: so sánh 2 mẫu gần nhất theo dữ liệu CATALOG (giá, tồn kho, hãng, loại). Hiển thị bảng so sánh ngắn.\n" : "";

        $system = [
            'role' => 'system',
            'content' =>
                "Bạn là tư vấn viên và **CHỈ** sử dụng thông tin trong CATALOG để trả lời.\n".
                $budgetHint.$brandHint.$catHint.$flagHint.$compareHint.
                "Quy tắc trình bày:\n".
                "- Mỗi mẫu: tên + giá + ảnh Markdown (![](URL)) + trạng thái còn hàng.\n".
                "- Nếu không có mẫu chính xác, đưa 3–6 mẫu gần nhất rồi hỏi gợi mở.\n\n".
                ($memoryLines ? "MEMORY:\n{$memoryLines}\n\n" : "").
                "CATALOG:\n".(!empty($lines) ? implode("\n",$lines) : "(trống)")
        ];

        // 5) Cho model “nhìn” tối đa 2 ảnh thật (nếu FE bật attach_images=1)
        if (!empty($catalog) && request()->boolean('attach_images', false)) {
            $parts = [['type'=>'text','text'=>'Ảnh vài mẫu phù hợp:']];
            $count = 0;
            foreach ($catalog as $p) {
                if (!empty($p['thumbnail_url'])) {
                    // ✅ dùng image_url chuẩn
                    $parts[] = ['type' => 'image_url', 'image_url' => ['url' => $p['thumbnail_url']]];
                    $parts[] = ['type' => 'text', 'text' => "{$p['name']} — giá {$p['price']}"];
                    if (++$count >= 2) break;
                }
            }
            return [$system, ['role'=>'user','content'=>$parts], ...$messages];
        }

        return [$system, ...$messages];
    }

    /* ===================== Auto-remember vài mẫu câu ===================== */
    private function autoRememberFromMessages(array $messages): void
    {
        $last = collect($messages)->reverse()->firstWhere('role','user')['content'] ?? '';
        if (!is_string($last)) return;
        $text = mb_strtolower($last);
        [$userId, $visitorId] = $this->who(request());

        if (preg_match('/tôi tên (?:là)?\s*([a-zà-ỹ\s]{2,30})/iu', $text, $m)) {
            AiMemory::updateOrCreate(['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'name'],
                ['value'=>['text'=>trim($m[1])],'scope'=>'profile','weight'=>90]);
        }
        if (preg_match('/(th[íi]ch|chuộng)\s+(honda|yamaha|suzuki|piaggio|sym|vinfast)/iu', $text, $m)) {
            AiMemory::updateOrCreate(['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'preferred_brand'],
                ['value'=>['brand'=>strtoupper($m[2])],'scope'=>'preference','weight'=>85]);
        }
        if (preg_match('/(\d{2,3})\s*-\s*(\d{2,3})\s*tr/iu', $text, $m)) {
            $min=(int)$m[1]*1_000_000; $max=(int)$m[2]*1_000_000;
            AiMemory::updateOrCreate(['user_id'=>$userId,'visitor_id'=>$visitorId,'key'=>'budget_range'],
                ['value'=>['min'=>$min,'max'=>$max,'unit'=>'VND'],'scope'=>'preference','weight'=>88]);
        }
    }
}
