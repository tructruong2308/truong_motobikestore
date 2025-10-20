<?php
// database/migrations/XXXX_XX_XX_000001_create_coupons_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('coupons', function (Blueprint $t) {
            $t->id();
            $t->string('code', 50)->unique();          // Mã giảm
            $t->enum('type', ['percent','fixed']);     // phần trăm | số tiền cố định
            $t->unsignedInteger('value');              // 10 => 10% | 50000 => 50k
            $t->unsignedBigInteger('min_order')->default(0); // tối thiểu đơn
            $t->unsignedInteger('max_discount')->nullable(); // trần giảm (nếu type=percent)
            $t->unsignedInteger('usage_limit')->nullable();  // tổng số lần toàn hệ thống (null = ∞)
            $t->unsignedInteger('per_user_limit')->nullable();// số lần tối đa mỗi user
            $t->timestamp('starts_at')->nullable();
            $t->timestamp('ends_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('coupons');
    }
};
