<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'title','slug','source','author','excerpt','content',
        'thumbnail_url','published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];
}
