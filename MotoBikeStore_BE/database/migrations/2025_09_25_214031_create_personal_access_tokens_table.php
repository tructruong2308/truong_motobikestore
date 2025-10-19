<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                // Chuẩn gần giống migration của Sanctum
                $table->bigIncrements('id');
                $table->morphs('tokenable'); // tokenable_type, tokenable_id + index
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        } else {
            // Bảng đã có: bổ sung cột/chỉ mục còn thiếu
            Schema::table('personal_access_tokens', function (Blueprint $table) {
                if (!Schema::hasColumn('personal_access_tokens', 'tokenable_type')) {
                    $table->string('tokenable_type')->after('id');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'tokenable_id')) {
                    $table->unsignedBigInteger('tokenable_id')->after('tokenable_type');
                }
                // mormphs thường kèm index; nếu môi trường bạn chưa có, thêm vào:
                // (Laravel sẽ tự đặt tên index; nếu trùng thì có thể comment dòng này đi)
                // $table->index(['tokenable_type', 'tokenable_id']);

                if (!Schema::hasColumn('personal_access_tokens', 'name')) {
                    $table->string('name')->after('tokenable_id');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'token')) {
                    $table->string('token', 64)->unique()->after('name');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'abilities')) {
                    $table->text('abilities')->nullable()->after('token');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'last_used_at')) {
                    $table->timestamp('last_used_at')->nullable()->after('abilities');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'expires_at')) {
                    $table->timestamp('expires_at')->nullable()->after('last_used_at');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'created_at')) {
                    $table->timestamp('created_at')->nullable()->after('expires_at');
                }
                if (!Schema::hasColumn('personal_access_tokens', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable()->after('created_at');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
