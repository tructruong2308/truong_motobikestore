<?php

namespace App\Services;

use App\Models\Product;

class ProductLookup
{
    public function findRelevant(string $query, int $limit = 12): array
    {
        $q = trim($query);
        if ($q === '') return [];

        $terms = collect(preg_split('/\s+/u', mb_strtolower($q)))
            ->filter(fn($t) => mb_strlen($t) > 1)
            ->unique()
            ->values();

        $builder = Product::query()->with(['brand','category'])->active();

        // match name/slug
        $builder->where(function ($x) use ($terms) {
            foreach ($terms as $t) {
                $x->orWhere('name','like',"%{$t}%")
                  ->orWhere('slug','like',"%{$t}%");
            }
        });

        // match brand/category
        $builder->orWhereHas('brand', function ($b) use ($terms) {
            foreach ($terms as $t) $b->orWhere('name','like',"%{$t}%");
        });
        $builder->orWhereHas('category', function ($c) use ($terms) {
            foreach ($terms as $t) $c->orWhere('name','like',"%{$t}%");
        });

        // heuristic: “xe điện” -> gợi ý gần
        if ($terms->contains(fn($t)=>str_contains($t,'điện') || $t==='ev' || str_contains($t,'electric'))) {
            $builder->orWhere(function($x){
                $x->where('name','like','%ga%')->orWhere('slug','like','%ga%');
            });
        }

        $rows = $builder->limit($limit)->get([
            'id','name','slug','price_root','price_sale','qty','category_id','brand_id','status','thumbnail'
        ])->load(['brand','category']);

        return $rows->map(function (Product $p) {
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

    public function featured(int $limit = 8): array
    {
        $rows = Product::query()->active()->latest('id')->limit($limit)->get([
            'id','name','slug','price_root','price_sale','qty','category_id','brand_id','status','thumbnail'
        ])->load(['brand','category']);

        return $rows->map(function (Product $p) {
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
