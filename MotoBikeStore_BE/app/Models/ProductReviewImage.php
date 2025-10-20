<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReviewImage extends Model
{
    protected $fillable = ['review_id','image'];
    protected $appends = ['url'];

    public function review() {
        return $this->belongsTo(ProductReview::class, 'review_id');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . ltrim($this->image, '/'));
    }
}
