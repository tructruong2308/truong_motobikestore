<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'ntt_user'; // ✅ bảng thật trong DB

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'phone',
        'roles',
        'status',
        'address',
        'avatar',
        'created_by',
        'updated_by',
        'deleted_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    // luôn append avatar_url khi toArray()/toJson()
    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute()
    {
        if (!$this->avatar) return null;

        // Nếu đã là URL tuyệt đối thì trả luôn
        if (Str::startsWith($this->avatar, ['http://','https://','/storage'])) {
            return $this->avatar;
        }
        // Ngược lại ghép vào public disk
        return asset('storage/'.$this->avatar);
    }
}
