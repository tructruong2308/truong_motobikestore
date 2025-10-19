<?php
// database/migrations/xxxx_xx_xx_xxxxxx_alter_ntt_user_make_address_nullable.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('ntt_user', function (Blueprint $table) {
            $table->string('address', 255)->nullable()->change();
            $table->string('roles', 50)->default('customer')->change();
            $table->tinyInteger('status')->default(1)->change();
        });
    }
    public function down(): void {
        Schema::table('ntt_user', function (Blueprint $table) {
            $table->string('address', 255)->nullable(false)->change();
            $table->string('roles', 50)->default(null)->change();
            $table->tinyInteger('status')->default(null)->change();
        });
    }
};
