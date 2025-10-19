<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Lấy kiểu dữ liệu hiện tại của cột status
        $colType = DB::selectOne("
            SELECT DATA_TYPE AS t
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'ntt_order'
              AND COLUMN_NAME = 'status'
        ");

        $type = $colType->t ?? null; // ví dụ: varchar, tinyint, int, ...

        // Nếu status là chuỗi -> map sang số
        if (in_array($type, ['varchar','char','text','longtext','mediumtext'])) {

            // Tạo cột status_new (tinyint) nếu chưa có
            Schema::table('ntt_order', function (Blueprint $t) {
                if (!Schema::hasColumn('ntt_order', 'status_new')) {
                    $t->unsignedTinyInteger('status_new')->default(0)->after('status');
                }
            });

            // Map dữ liệu
            DB::statement("
                UPDATE ntt_order
                SET status_new = CASE
                    WHEN status IN ('0','pending','PENDING','Pending') THEN 0
                    WHEN status IN ('1','processing','PROCESSING','Processing') THEN 1
                    WHEN status IN ('2','completed','COMPLETED','Completed','complete') THEN 2
                    WHEN status IN ('3','cancelled','CANCELLED','Cancelled','canceled') THEN 3
                    ELSE 0
                END
            ");

            // Xoá status cũ (string) rồi rename
            Schema::table('ntt_order', function (Blueprint $t) {
                $t->dropColumn('status');
            });
            Schema::table('ntt_order', function (Blueprint $t) {
                $t->renameColumn('status_new', 'status');
            });
        }

        // Đảm bảo các cột thanh toán tồn tại
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
    }

    public function down(): void
    {
        // Tuỳ nhu cầu: thường không rollback vì đã mất status dạng text.
        // Nếu muốn, chỉ nên drop các cột thêm mới khi chắc chắn an toàn:
        // Schema::table('ntt_order', function (Blueprint $t) {
        //     if (Schema::hasColumn('ntt_order','payment_method')) $t->dropColumn('payment_method');
        //     if (Schema::hasColumn('ntt_order','total')) $t->dropColumn('total');
        //     if (Schema::hasColumn('ntt_order','paid_at')) $t->dropColumn('paid_at');
        // });
    }
};
