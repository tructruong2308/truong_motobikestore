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

        // Thanh toán
        'total',
        'payment_method',
        'paid_at',

        // (Khuyến nghị thêm để khớp Checkout.jsx)
        'subtotal',
        'discount',
        'shipping_method',
        'shipping_fee',

        // Coupon (tuỳ bạn có migration rồi thì bật)
        'coupon_code',
        'coupon_id',
    ];

    protected $casts = [
        'status'         => 'integer',
        'total'          => 'integer',
        'subtotal'       => 'integer',
        'discount'       => 'integer',
        'shipping_fee'   => 'integer',
        'paid_at'        => 'datetime',
    ];

    /**
     * Trạng thái đồng bộ với FE (Orders.jsx):
     * 0: Chờ xác nhận, 1: Đã xác nhận, 2: Đang đóng gói,
     * 3: Đang giao, 4: Đã giao, 5: Đã huỷ
     */
    public const STATUS_PENDING     = 0; // Chờ xác nhận
    public const STATUS_CONFIRMED   = 1; // Đã xác nhận
    public const STATUS_PACKING     = 2; // Đang đóng gói
    public const STATUS_SHIPPING    = 3; // Đang giao
    public const STATUS_DELIVERED   = 4; // Đã giao
    public const STATUS_CANCELLED   = 5; // Đã huỷ

    protected $appends = ['status_label'];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING   => 'Chờ xác nhận',
            self::STATUS_CONFIRMED => 'Đã xác nhận',
            self::STATUS_PACKING   => 'Đang đóng gói',
            self::STATUS_SHIPPING  => 'Đang giao',
            self::STATUS_DELIVERED => 'Đã giao',
            self::STATUS_CANCELLED => 'Đã huỷ',
            default => (string) $this->status,
        };
    }

    /** Chi tiết đơn */
    public function details()
    {
        return $this->hasMany(\App\Models\OrderDetail::class, 'order_id', 'id');
    }

    /** Tổng tiền tính động (nếu cần) */
    public function getTotalComputedAttribute(): int
    {
        if (array_key_exists('details_sum_amount', $this->attributes)) {
            return (int) $this->attributes['details_sum_amount'];
        }
        return (int) $this->details()->sum('amount');
    }

    /** Các lần thanh toán (MoMo, v.v.) */
    public function payments()
    {
        return $this->hasMany(\App\Models\Payment::class);
    }

    /** Lần áp mã (nếu dùng bảng coupon_redemptions như đã hướng dẫn) */
    public function couponRedemption()
    {
        return $this->hasOne(\App\Models\CouponRedemption::class, 'order_id', 'id');
    }

    /** Coupon tương ứng (qua redemption) */
    public function coupon()
    {
        // order -> coupon_redemptions(order_id) -> coupon(coupon_id)
        return $this->hasOneThrough(
            \App\Models\Coupon::class,
            \App\Models\CouponRedemption::class,
            'order_id',   // FK trên coupon_redemptions trỏ về orders
            'id',         // PK trên coupons
            'id',         // PK trên orders
            'coupon_id'   // FK trên coupon_redemptions trỏ về coupons
        );
    }
}
