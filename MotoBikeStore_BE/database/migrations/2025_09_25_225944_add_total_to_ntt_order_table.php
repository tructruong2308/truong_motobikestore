<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Chỉ thêm cột khi CHƯA có
        if (!Schema::hasColumn('ntt_order', 'total')) {
            Schema::table('ntt_order', function (Blueprint $t) {
                // Nếu bảng không có cột 'note' thì bỏ 'after("note")' để tránh lỗi
                $hasNote = Schema::hasColumn('ntt_order', 'note');

                if ($hasNote) {
                    $t->unsignedBigInteger('total')->default(0)->after('note');
                } else {
                    $t->unsignedBigInteger('total')->default(0);
                }
            });
        }
    }

    public function down(): void
    {
        // Chỉ drop khi ĐANG có
        if (Schema::hasColumn('ntt_order', 'total')) {
            Schema::table('ntt_order', function (Blueprint $t) {
                $t->dropColumn('total');
            });
        }
    }
};
