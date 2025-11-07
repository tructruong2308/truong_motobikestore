<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiMemory extends Model
{
    protected $table = 'ai_memories';
    protected $fillable = [
        'user_id','visitor_id','key','value','scope','weight','expires_at'
    ];
    protected $casts = [
        'value' => 'array',
        'expires_at' => 'datetime',
    ];
}
