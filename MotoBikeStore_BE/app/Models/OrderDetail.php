<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    protected $table = 'ntt_orderdetail';

    protected $fillable = [
        'order_id',
        'product_id',
        'price_buy',
        'qty',
        'amount',
    ];

    public $timestamps = false;

    protected $casts = [
        'price_buy' => 'float',
        'qty'       => 'integer',
        'amount'    => 'float',
    ];

    // ✅ Trả kèm 2 thuộc tính ảo cho FE
    protected $appends = ['product_name', 'thumbnail_url'];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    public function product()
    {
        // withDefault để tránh null khi SP bị xoá
        return $this->belongsTo(Product::class, 'product_id', 'id')
                    ->withDefault([
                        'name'      => null,
                        'thumbnail' => null,
                    ]);
    }

    /* ---------------- Accessors cho FE ---------------- */

    // ✅ Tên SP ổn định: ưu tiên từ quan hệ, fallback field dự phòng (nếu có)
    public function getProductNameAttribute(): ?string
    {
        return $this->product->name
            ?? $this->attributes['product_name']
            ?? $this->attributes['name']
            ?? null;
    }

    // ✅ Ảnh SP ổn định: ưu tiên accessor của Product
    public function getThumbnailUrlAttribute(): ?string
    {
        // Nếu Product có accessor thumbnail_url ⇒ dùng luôn
        if (method_exists($this->product, 'getThumbnailUrlAttribute')) {
            return $this->product->thumbnail_url;
        }

        // Fallback từ chi tiết (nếu bạn từng lưu sẵn)
        return $this->attributes['thumbnail_url']
            ?? $this->attributes['image_url']
            ?? null;
    }
}
