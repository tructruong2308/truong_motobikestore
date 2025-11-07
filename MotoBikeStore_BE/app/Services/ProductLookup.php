<?php

namespace App\Services;

use App\Models\Product;

class ProductLookup
{
    /**
     * Tìm sản phẩm liên quan dựa trên nội dung câu hỏi.
     * - match theo name/slug (+ brand nếu bạn có cột brand trong bảng Brand)
     * - chỉ lấy sp active (status=1)
     * - trả về mảng gọn để bơm vào prompt
     */
    public function findRelevant(string $query, int $limit = 12): array
    {
        $q = trim($query);
        if ($q === '') return [];

        // Tách từ khóa đơn giản, bỏ từ quá ngắn
        $terms = collect(preg_split('/\s+/u', mb_strtolower($q)))
            ->filter(fn($t) => mb_strlen($t) > 1)
            ->unique()
            ->values();

        $builder = Product::query()->active(); // status = 1

        foreach ($terms as $t) {
            $builder->where(function ($x) use ($t) {
                $x->where('name', 'like', "%{$t}%")
                  ->orWhere('slug', 'like', "%{$t}%");
            });
        }

        // Lấy các trường cần thiết; appends của bạn (price_final, ...) vẫn hoạt động khi ->get()
        $rows = $builder->limit($limit)->get([
            'id','name','slug','price_root','price_sale','qty','category_id','brand_id','status','thumbnail'
        ])->load(['brand','category']); // để appends brand_name/category_name có dữ liệu

        return $rows->map(fn(Product $p) => $this->toCompactArray($p))->all();
    }

    /** Một ít sản phẩm gợi ý khi câu hỏi quá chung chung */
    public function featured(int $limit = 8): array
    {
        $rows = Product::query()->active()->latest('id')->limit($limit)->get([
            'id','name','slug','price_root','price_sale','qty','category_id','brand_id','status','thumbnail'
        ])->load(['brand','category']);

        return $rows->map(fn(Product $p) => $this->toCompactArray($p))->all();
    }

    private function toCompactArray(Product $p): array
    {
        // Dựa theo accessor của bạn: price_final = price_sale > 0 ? price_sale : price_root
        $price = (float) ($p->price_sale > 0 ? $p->price_sale : ($p->price_root ?? 0));
        $stock = is_null($p->qty) ? null : (int) $p->qty;
        return [
            'id'            => $p->id,
            'name'          => $p->name,
            'slug'          => $p->slug,
            'price'         => $price,
            'qty'           => $stock,
            'in_stock'      => !is_null($stock) ? $stock > 0 : null,
            'status'        => (int) $p->status,
            'brand_id'      => $p->brand_id,
            'category_id'   => $p->category_id,
            'brand_name'    => $p->brand_name,     // từ accessor của bạn
            'category_name' => $p->category_name,  // từ accessor của bạn
            'thumbnail_url' => $p->thumbnail_url,  // từ accessor của bạn
        ];
    }
}
