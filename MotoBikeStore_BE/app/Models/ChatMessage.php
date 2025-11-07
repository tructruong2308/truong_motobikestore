<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = ['thread_id','role','content','content_parts'];
    protected $casts = ['content_parts' => 'array'];
}
