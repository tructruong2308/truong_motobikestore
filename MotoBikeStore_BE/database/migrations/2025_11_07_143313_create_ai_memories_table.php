<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_memories', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->nullable()->index();
            $t->string('visitor_id', 64)->nullable()->index();

            $t->string('key', 100);
            $t->text('value');                           // JSON/text
            $t->string('scope', 30)->default('preference'); // profile|preference|context
            $t->unsignedTinyInteger('weight')->default(50);
            $t->timestamp('expires_at')->nullable();

            $t->timestamps();

            $t->unique(['user_id','visitor_id','key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_memories');
    }
};
