<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name','email','phone','subject','message','status','read_at','done_at'
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'done_at' => 'datetime',
    ];
}
