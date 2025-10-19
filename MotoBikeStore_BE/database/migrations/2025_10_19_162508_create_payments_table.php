<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $t) {
                $t->bigIncrements('id');

                // liên kết đơn hàng
                $t->unsignedBigInteger('order_id')->index();
                // cổng thanh toán: momo, vnpay,...
                $t->string('provider', 20);
                // số tiền (VND)
                $t->unsignedBigInteger('amount')->default(0);

                // trạng thái: pending | paid | failed | canceled
                $t->string('status', 20)->default('pending');

                // mã request/giao dịch từ gateway
                $t->string('request_id', 64)->nullable()->index();
                $t->string('provider_txn_id', 64)->nullable()->index();

                // log raw response để debug
                $t->json('response_payload')->nullable();

                $t->timestamps();

                // (tuỳ bạn có bật FK không)
                // $t->foreign('order_id')->references('id')->on('ntt_order')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
