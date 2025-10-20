<?php
// app/Models/Coupon.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code','type','value','min_order','max_discount',
        'usage_limit','per_user_limit','starts_at','ends_at','is_active',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'starts_at'       => 'datetime',
        'ends_at'         => 'datetime',
        'min_order'       => 'integer',
        'max_discount'    => 'integer',
        'usage_limit'     => 'integer',
        'per_user_limit'  => 'integer',
        'value'           => 'integer',
    ];

    /** Quan hệ đúng với thiết kế mới: mỗi lần áp mã là 1 redemption */
    public function redemptions()
    {
        return $this->hasMany(\App\Models\CouponRedemption::class);
    }

    /** Mã đang bật & trong khoảng thời gian (theo timezone app) */
    public function isActiveNow(): bool
    {
        if (!$this->is_active) return false;

        $now = now()->timezone(config('app.timezone', 'Asia/Ho_Chi_Minh'));
        $start = $this->starts_at ? $this->starts_at->timezone($now->tz) : null;
        $end   = $this->ends_at   ? $this->ends_at->timezone($now->tz)   : null;

        if ($start && $now->lt($start)) return false;
        if ($end   && $now->gt($end))   return false;
        return true;
    }

    /** Giữ nguyên call từ Controller: wrapper alias */
    public function isWithinTime(): bool
    {
        return $this->isActiveNow();
    }

    /** Lượt còn lại toàn hệ thống; null = không giới hạn */
    public function remainingGlobal(): ?int
    {
        if (is_null($this->usage_limit)) return null;
        $used = (int) $this->redemptions()->count();
        return max(0, $this->usage_limit - $used);
    }

    /** Lượt còn lại cho 1 user; null = không giới hạn */
    public function remainingForUser(?int $userId): ?int
    {
        if (is_null($this->per_user_limit) || !$userId) return null;
        $used = (int) $this->redemptions()->where('user_id', $userId)->count();
        return max(0, $this->per_user_limit - $used);
    }

    /** Tính số tiền giảm cho subtotal (có trần max_discount với type=percent) */
    public function computeDiscount(int $subtotal): int
    {
        $subtotal = max(0, (int) $subtotal);
        if ($subtotal === 0) return 0;

        if ($this->type === 'fixed') {
            return min($subtotal, max(0, (int) $this->value));
        }

        // percent
        $percent = max(0, (int) $this->value);
        $raw     = (int) floor($subtotal * ($percent / 100));
        $cap     = (int) ($this->max_discount ?? 0);

        return $cap > 0 ? min($raw, $cap) : $raw;
    }
}
