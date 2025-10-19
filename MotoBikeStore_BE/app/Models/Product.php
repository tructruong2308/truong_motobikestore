<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'ntt_product';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'price_root',
        'price_sale',
        'thumbnail',
        'qty',
        'detail',
        'description',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'price_root' => 'float',
        'price_sale' => 'float',
        'qty'        => 'integer',
        'status'     => 'integer',
    ];

    // ✅ GIỮ NGUYÊN các appends bạn đang dùng
    protected $appends = [
        'thumbnail_url',
        'brand_name',
        'category_name',
        'price_final',
    ];

    /* ========================= Quan hệ ========================= */
    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /* ========================= Accessors ========================= */
    public function getBrandNameAttribute()
    {
        return optional($this->brand)->name;
    }

    public function getCategoryNameAttribute()
    {
        return optional($this->category)->name;
    }

    public function getPriceFinalAttribute()
    {
        $sale = (float) ($this->price_sale ?? 0);
        $root = (float) ($this->price_root ?? 0);
        return $sale > 0 ? $sale : $root;
    }

    // ✅ Accessor ảnh: an toàn, ít I/O, FE onError sẽ tự fallback
    public function getThumbnailUrlAttribute()
    {
        $placeholder = asset('assets/images/no-image.png');

        $raw = trim((string) ($this->thumbnail ?? ''));
        if ($raw === '') return $placeholder;

        // Đã là URL tuyệt đối
        if (preg_match('~^https?://~i', $raw)) return $raw;

        // Đường dẫn đã prefix sẵn
        if (str_starts_with($raw, 'storage/')
            || str_starts_with($raw, 'uploads/')
            || str_starts_with($raw, 'assets/')) {
            return asset(ltrim($raw, '/'));
        }

        // Mặc định coi như lưu trong disk 'public' (storage/app/public/...)
        return asset('storage/' . ltrim($raw, '/'));
    }

    /* ========================= Scopes ========================= */
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeInStock($query)
    {
        return $query->where('qty', '>', 0);
    }

    public function scopeSearch($query, ?string $keyword)
    {
        if (!$keyword) return $query;
        $kw = trim($keyword);
        return $query->where(function ($q) use ($kw) {
            $q->where('name', 'like', "%{$kw}%")
              ->orWhere('slug', 'like', "%{$kw}%");
        });
    }
}
