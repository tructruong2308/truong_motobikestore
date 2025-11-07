<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ProductLookup
{
    /** Chuẩn hoá “vario160” -> “vario160” (bỏ mọi ký tự không a-z0-9) */
    private function norm(string $s): string
    {
        return preg_replace('/[^a-z0-9]+/u', '', mb_strtolower($s));
    }

    /** Tìm nhanh theo từ khoá tên/slug, hãng, danh mục (fuzzy “sh350”) */
    public function findRelevant(string $query, int $limit = 12): array
    {
        $q = trim($query);
        if ($q === '') return [];

        $norm = $this->norm($q);
        $terms = collect(preg_split('/\s+/u', mb_strtolower($q)))
            ->filter(fn($t) => $t !== '')
            ->unique()
            ->values();

        $builder = Product::query()->with(['brand','category'])->active();

        $builder->where(function ($x) use ($terms, $norm) {
            foreach ($terms as $t) {
                $x->orWhere('name','like',"%{$t}%")
                  ->orWhere('slug','like',"%{$t}%");
            }
            $x->orWhereRaw("
                LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name,' ',''),'-',''),'.',''),'/','')) LIKE ?
            ", ["%{$norm}%"])
            ->orWhereRaw("
                LOWER(REPLACE(REPLACE(REPLACE(REPLACE(slug,' ',''),'-',''),'.',''),'/','')) LIKE ?
            ", ["%{$norm}%"]);
        });

        $builder->orWhereHas('brand', function ($b) use ($terms, $norm) {
            foreach ($terms as $t) $b->orWhere('name','like',"%{$t}%");
            $b->orWhereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name,' ',''),'-',''),'.',''),'/','')) LIKE ?", ["%{$norm}%"]);
        });

        $builder->orWhereHas('category', function ($c) use ($terms, $norm) {
            foreach ($terms as $t) $c->orWhere('name','like',"%{$t}%");
            $c->orWhereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name,' ',''),'-',''),'.',''),'/','')) LIKE ?", ["%{$norm}%"]);
        });

        return $this->finish($builder->limit($limit)->get());
    }

    /** Lấy sp mới nhất (nếu không có từ khoá) */
    public function featured(int $limit = 8): array
    {
        return $this->finish(
            Product::query()->active()->latest('id')->limit($limit)->get()
        );
    }

    /** Lọc theo ngân sách (VND). Nới biên ±10% nếu trống. */
    public function byBudget(?int $min, ?int $max, int $limit = 12): array
    {
        $expr = "COALESCE(NULLIF(price_sale,0), price_root)";
        $q = Product::query()->with(['brand','category'])->active()
            ->when(isset($min), fn($x)=>$x->whereRaw("$expr >= ?", [$min]))
            ->when(isset($max), fn($x)=>$x->whereRaw("$expr <= ?", [$max]))
            ->orderByRaw("$expr asc")->limit($limit)->get();

        if ($q->isEmpty() && ($min || $max)) {
            $min2 = $min ? (int)round($min*0.9) : null;
            $max2 = $max ? (int)round($max*1.1) : null;
            $q = Product::query()->with(['brand','category'])->active()
                ->when(isset($min2), fn($x)=>$x->whereRaw("$expr >= ?", [$min2]))
                ->when(isset($max2), fn($x)=>$x->whereRaw("$expr <= ?", [$max2]))
                ->orderByRaw("$expr asc")->limit($limit)->get();
        }
        return $this->finish($q);
    }

    /**
     * Tìm nâng cao: từ 1 câu tự nhiên rút trích nhiều tiêu chí:
     * brandNames[], categoryHints[], budget[min,max], inStock, onSale, sort, ccRange[min,max]
     */
    public function searchAdvanced(array $filters, int $limit = 12): array
    {
        $expr = "COALESCE(NULLIF(price_sale,0), price_root)";
        $b = Product::query()->with(['brand','category'])->active();

        // Hãng
        if (!empty($filters['brandNames'])) {
            $brandNames = array_map('mb_strtolower', $filters['brandNames']);
            $b->whereHas('brand', function ($q) use ($brandNames) {
                foreach ($brandNames as $n) $q->orWhere(DB::raw('LOWER(name)'), 'like', "%{$n}%");
            });
        }

        // Danh mục/loại (hint: tay ga/côn tay/…)
        if (!empty($filters['categoryHints'])) {
            $hints = array_map('mb_strtolower', $filters['categoryHints']);
            $b->where(function ($q) use ($hints) {
                foreach ($hints as $h) {
                    $q->orWhereHas('category', fn($c)=>$c->where(DB::raw('LOWER(name)'), 'like', "%{$h}%"))
                      ->orWhere('name', 'like', "%{$h}%")
                      ->orWhere('slug', 'like', "%{$h}%");
                }
            });
        }

        // Fuzzy theo tên mẫu (nếu có)
        if (!empty($filters['keyword'])) {
            $norm = $this->norm($filters['keyword']);
            $terms = collect(preg_split('/\s+/u', mb_strtolower($filters['keyword'])))->filter()->values();
            $b->where(function ($x) use ($terms, $norm) {
                foreach ($terms as $t) {
                    $x->orWhere('name','like',"%{$t}%")
                      ->orWhere('slug','like',"%{$t}%");
                }
                $x->orWhereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name,' ',''),'-',''),'.',''),'/','')) LIKE ?", ["%{$norm}%"])
                  ->orWhereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(slug,' ',''),'-',''),'.',''),'/','')) LIKE ?", ["%{$norm}%"]);
            });
        }

        // Ngân sách
        if (isset($filters['min'])) $b->whereRaw("$expr >= ?", [$filters['min']]);
        if (isset($filters['max'])) $b->whereRaw("$expr <= ?", [$filters['max']]);

        // Đang sale
        if (!empty($filters['onSale'])) $b->where('price_sale', '>', 0);

        // Còn hàng
        if (!empty($filters['inStock'])) $b->where('qty', '>', 0);

        // CC range (nếu bạn có dữ liệu cc trong name: “150”, “160”, “125”)
        if (!empty($filters['ccMin']) || !empty($filters['ccMax'])) {
            $ccMin = (int)($filters['ccMin'] ?? 0);
            $ccMax = (int)($filters['ccMax'] ?? 2000);
            // Heuristic: tìm số trong tên
            $b->where(function ($q) use ($ccMin, $ccMax) {
                $q->whereRaw("CAST(REGEXP_SUBSTR(name, '[0-9]{2,4}') AS UNSIGNED) BETWEEN ? AND ?", [$ccMin, $ccMax])
                  ->orWhereRaw("CAST(REGEXP_SUBSTR(slug, '[0-9]{2,4}') AS UNSIGNED) BETWEEN ? AND ?", [$ccMin, $ccMax]);
            });
        }

        // Sắp xếp
        switch ($filters['sort'] ?? '') {
            case 'price-asc':  $b->orderByRaw("$expr asc"); break;
            case 'price-desc': $b->orderByRaw("$expr desc"); break;
            case 'name-asc':   $b->orderBy('name'); break;
            case 'name-desc':  $b->orderBy('name','desc'); break;
            default:           $b->latest('id'); break;
        }

        return $this->finish($b->limit($limit)->get());
    }

    /** So sánh 2 mẫu theo tên mơ hồ */
    public function compare2(string $a, string $b): array
    {
        $pa = $this->firstFuzzy($a);
        $pb = $this->firstFuzzy($b);

        return [
            'left'  => $pa,
            'right' => $pb,
            'diff'  => $this->diff($pa, $pb),
        ];
    }

    /** ——— Helpers ——— */

    private function firstFuzzy(string $q): ?array
    {
        $items = $this->findRelevant($q, 1);
        return $items[0] ?? null;
    }

    private function diff(?array $A, ?array $B): array
    {
        if (!$A || !$B) return [];
        return [
            'price_delta' => ($A['price'] ?? 0) - ($B['price'] ?? 0),
            'stock_delta' => ($A['qty']   ?? 0) - ($B['qty']   ?? 0),
            'same_brand'  => ($A['brand_name'] ?? null) === ($B['brand_name'] ?? null),
            'same_cat'    => ($A['category_name'] ?? null) === ($B['category_name'] ?? null),
        ];
    }

    private function finish($rows): array
    {
        return collect($rows)->map(function (Product $p) {
            $price = (float) ($p->price_sale > 0 ? $p->price_sale : ($p->price_root ?? 0));
            return [
                'id'            => $p->id,
                'name'          => $p->name,
                'slug'          => $p->slug,
                'price'         => $price,
                'qty'           => (int) ($p->qty ?? 0),
                'brand_name'    => $p->brand->name ?? null,
                'category_name' => $p->category->name ?? null,
                'thumbnail_url' => $p->thumbnail_url,
            ];
        })->all();
    }
}
