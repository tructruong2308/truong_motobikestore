<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReview extends Model
{
    protected $table = 'product_reviews';

    protected $fillable = ['user_id','product_id','order_id','rating','title','comment'];

    public function user()    { return $this->belongsTo(User::class, 'user_id', 'id'); }
    public function product() { return $this->belongsTo(Product::class, 'product_id', 'id'); }
    public function order()   { return $this->belongsTo(Order::class,   'order_id', 'id'); }

    // ✅ Thêm quan hệ ảnh
    public function images()
    {
        return $this->hasMany(ProductReviewImage::class, 'review_id', 'id');
    }
}
