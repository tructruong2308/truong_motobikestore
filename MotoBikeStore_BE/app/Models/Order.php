<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $table = 'ntt_order';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'address',
        'note',
        'status',
        'updated_by',

        // ⚠️ Các cột có thật trong bảng của bạn
        'total',
        'payment_method',
        'paid_at',
    ];

    protected $casts = [
        'status'   => 'integer',
        'total'    => 'integer',
        'paid_at'  => 'datetime',
    ];

    // Trạng thái chuẩn hoá (dùng số nguyên)
    public const STATUS_PENDING    = 0;
    public const STATUS_PROCESSING = 1;
    public const STATUS_COMPLETED  = 2;
    public const STATUS_CANCELLED  = 3;

    protected $appends = ['status_label'];

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING    => 'Pending',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_COMPLETED  => 'Completed',
            self::STATUS_CANCELLED  => 'Cancelled',
            default => (string) $this->status,
        };
    }

    public function details()
    {
        return $this->hasMany(OrderDetail::class, 'order_id', 'id');
    }

    // (tuỳ chọn) tổng tiền tính động nếu không lưu cột total
    public function getTotalComputedAttribute(): float
    {
        if (array_key_exists('details_sum_amount', $this->attributes)) {
            return (float) $this->attributes['details_sum_amount'];
        }
        return (float) $this->details()->sum('amount');
    }

    public function payments()
    {
        return $this->hasMany(\App\Models\Payment::class);
    }
}
