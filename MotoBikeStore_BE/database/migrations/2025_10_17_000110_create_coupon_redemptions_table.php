<?php
// database/migrations/XXXX_XX_XX_000002_create_coupon_redemptions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('coupon_redemptions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('coupon_id')->constrained('coupons')->onDelete('cascade');
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('order_id')->nullable()->constrained('ntt_order')->nullOnDelete();
            $t->unsignedBigInteger('discount_value')->default(0);
            $t->timestamps();

            $t->unique(['coupon_id', 'order_id']); // 1 đơn chỉ ghi 1 lần
            $t->index(['coupon_id', 'user_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('coupon_redemptions');
    }
};
