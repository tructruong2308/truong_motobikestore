<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'ntt_category';
    protected $primaryKey = 'id';
    public $timestamps = false; // bảng có cột timestamps nhưng cho phép NULL → giữ false là ổn

    protected $fillable = [
        'name',
        'slug',
        'image',
        'parent_id',
        'sort_order',
        'description',
        'created_by',
        'updated_by',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        $img = $this->image;
        if (!$img) return null;

        // 1) Nếu là URL tuyệt đối thì trả nguyên
        if (preg_match('#^https?://#i', $img)) return $img;

        // 2) Nếu đã chứa 'assets/images/' -> coi là nằm trong public/
        if (strpos($img, 'assets/images/') === 0) {
            return url($img);
        }

        // 3) Nếu là file có trong public/assets/images
        $publicPath = public_path('assets/images/' . ltrim($img, '/'));
        if (is_file($publicPath)) {
            return url('assets/images/' . ltrim($img, '/'));
        }

        // 4) Nếu là path kiểu 'categories/xxx.png' (storage đã link)
        $storagePublicPath = public_path('storage/' . ltrim($img, '/'));
        if (is_file($storagePublicPath)) {
            return asset('storage/' . ltrim($img, '/'));
        }

        // 5) Fallback: ghép vào public/assets/images
        return url('assets/images/' . ltrim($img, '/'));
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}
