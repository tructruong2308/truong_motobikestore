<?php
// database/migrations/xxxx_xx_xx_xxxxxx_alter_ntt_user_make_address_nullable.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // CẢNH BÁO: cần doctrine/dbal để dùng ->change()
        // composer require doctrine/dbal

        if (Schema::hasTable('ntt_user')) {
            Schema::table('ntt_user', function (Blueprint $table) {
                if (Schema::hasColumn('ntt_user', 'address')) {
                    // address -> cho phép null
                    $table->string('address', 255)->nullable()->change();
                }
                if (Schema::hasColumn('ntt_user', 'roles')) {
                    // roles -> default 'customer'
                    $table->string('roles', 50)->default('customer')->change();
                }
                if (Schema::hasColumn('ntt_user', 'status')) {
                    // status -> default 1
                    $table->tinyInteger('status')->default(1)->change();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('ntt_user')) {
            Schema::table('ntt_user', function (Blueprint $table) {
                if (Schema::hasColumn('ntt_user', 'address')) {
                    // quay lại bắt buộc nhập (NOT NULL)
                    $table->string('address', 255)->nullable(false)->change();
                }
                if (Schema::hasColumn('ntt_user', 'roles')) {
                    // giữ kiểu dữ liệu, bỏ default (không đặt default NULL trên NOT NULL)
                    $table->string('roles', 50)->change();
                }
                if (Schema::hasColumn('ntt_user', 'status')) {
                    // giữ kiểu dữ liệu, bỏ default
                    $table->tinyInteger('status')->change();
                }
            });

            // BỎ default bằng SQL (MySQL 8+):
            // Nếu DB của bạn là MySQL 5.7, cú pháp này vẫn dùng được.
            try {
                DB::statement("ALTER TABLE ntt_user ALTER roles DROP DEFAULT");
            } catch (\Throwable $e) {
                // bỏ qua nếu DB không hỗ trợ
            }
            try {
                DB::statement("ALTER TABLE ntt_user ALTER status DROP DEFAULT");
            } catch (\Throwable $e) {
                // bỏ qua nếu DB không hỗ trợ
            }
        }
    }
};
