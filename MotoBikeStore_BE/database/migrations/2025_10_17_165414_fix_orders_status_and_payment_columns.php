<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::table('ntt_order', function (Blueprint $t) {
            // Tạo cột mới để map (tránh conflict type)
            if (!Schema::hasColumn('ntt_order', 'status_new')) {
                $t->unsignedTinyInteger('status_new')->default(0)->after('status');
            }
        });

        // Map dữ liệu status text -> số
        // 0=pending, 1=completed, 2=cancelled
        DB::statement("
            UPDATE ntt_order
            SET status_new = CASE
                WHEN status IN ('0','pending','PENDING','Pending') THEN 0
                WHEN status IN ('1','completed','COMPLETED','Completed','complete') THEN 1
                WHEN status IN ('2','cancelled','CANCELLED','Cancelled','canceled') THEN 2
                ELSE 0
            END
        ");

        // Bổ sung các cột thanh toán nếu thiếu
        Schema::table('ntt_order', function (Blueprint $t) {
            if (!Schema::hasColumn('ntt_order', 'payment_method')) {
                $t->string('payment_method', 20)->default('cod')->after('status');
            }
            if (!Schema::hasColumn('ntt_order', 'total')) {
                $t->unsignedBigInteger('total')->default(0)->after('note');
            }
            if (!Schema::hasColumn('ntt_order', 'paid_at')) {
                $t->timestamp('paid_at')->nullable()->after('status');
            }
        });

        // Xoá cột cũ & rename
        Schema::table('ntt_order', function (Blueprint $t) {
            // Xoá cột status cũ (string)
            if (Schema::hasColumn('ntt_order', 'status')) {
                $t->dropColumn('status');
            }
        });

        Schema::table('ntt_order', function (Blueprint $t) {
            // Đổi tên status_new -> status
            $t->renameColumn('status_new', 'status');
        });
    }

    public function down(): void {
        // Không rollback chi tiết (tuỳ nhu cầu)
    }
};
