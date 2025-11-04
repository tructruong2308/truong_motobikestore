<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('coupons', function (Blueprint $t) {
            $t->boolean('is_visible')->default(true)->after('is_active');
            $t->json('channels')->nullable()->after('is_visible');      // ["web","app"]
            $t->string('audience')->default('all')->after('channels');   // all|new_user_only|returning
            $t->string('badge_text')->nullable()->after('audience');     // "HOT","Flash",...
        });
    }

    public function down(): void {
        Schema::table('coupons', function (Blueprint $t) {
            $t->dropColumn(['is_visible','channels','audience','badge_text']);
        });
    }
};
