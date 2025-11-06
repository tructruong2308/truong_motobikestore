<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('contacts', function (Blueprint $t) {
            if (!Schema::hasColumn('contacts', 'subject')) {
                $t->string('subject')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('contacts', 'status')) {
                $t->enum('status', ['new','read','done'])->default('new')->after('message');
            }
            if (!Schema::hasColumn('contacts', 'read_at')) {
                $t->timestamp('read_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('contacts', 'done_at')) {
                $t->timestamp('done_at')->nullable()->after('read_at');
            }
            if (!Schema::hasColumn('contacts', 'deleted_at')) {
                $t->softDeletes();
            }
        });
    }

    public function down(): void {
        Schema::table('contacts', function (Blueprint $t) {
            if (Schema::hasColumn('contacts', 'deleted_at')) $t->dropSoftDeletes();
            foreach (['done_at','read_at','status','subject'] as $c) {
                if (Schema::hasColumn('contacts',$c)) $t->dropColumn($c);
            }
        });
    }
};
