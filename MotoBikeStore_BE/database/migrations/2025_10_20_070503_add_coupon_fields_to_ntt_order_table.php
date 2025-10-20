<?php
// database/migrations/XXXX_XX_XX_000003_alter_ntt_order_add_coupon_cols.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('ntt_order', function (Blueprint $t) {
            if (!Schema::hasColumn('ntt_order', 'coupon_code')) {
                $t->string('coupon_code', 50)->nullable()->after('note');
            }
            if (!Schema::hasColumn('ntt_order', 'discount')) {
                $t->unsignedBigInteger('discount')->default(0)->after('coupon_code');
            }
            if (!Schema::hasColumn('ntt_order', 'subtotal')) {
                $t->unsignedBigInteger('subtotal')->default(0)->after('discount');
            }
            if (!Schema::hasColumn('ntt_order', 'shipping_fee')) {
                $t->unsignedBigInteger('shipping_fee')->default(0)->after('subtotal');
            }
        });
    }
    public function down(): void {
        Schema::table('ntt_order', function (Blueprint $t) {
            if (Schema::hasColumn('ntt_order','coupon_code'))  $t->dropColumn('coupon_code');
            if (Schema::hasColumn('ntt_order','discount'))     $t->dropColumn('discount');
            if (Schema::hasColumn('ntt_order','subtotal'))     $t->dropColumn('subtotal');
            if (Schema::hasColumn('ntt_order','shipping_fee')) $t->dropColumn('shipping_fee');
        });
    }
};
