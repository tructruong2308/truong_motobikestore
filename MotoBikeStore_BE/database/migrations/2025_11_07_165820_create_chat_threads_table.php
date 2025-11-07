<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chat_threads', function (Blueprint $t) {
            $t->id(); // BIGINT UNSIGNED
            $t->unsignedBigInteger('user_id')->nullable()->index();
            $t->string('title', 200)->nullable();
            $t->string('model', 100)->nullable();
            $t->timestamps();
        });

        // FK -> ntt_user(id) (bảng users của bạn tên ntt_user)
        Schema::table('chat_threads', function (Blueprint $t) {
            $t->foreign('user_id', 'ct_user_fk')
              ->references('id')->on('ntt_user')
              ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('chat_threads', function (Blueprint $t) {
            try { $t->dropForeign('ct_user_fk'); } catch (\Throwable $e) {}
        });
        Schema::dropIfExists('chat_threads');
    }
};
