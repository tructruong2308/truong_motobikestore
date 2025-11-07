<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('thread_id');
            $t->enum('role', ['user','assistant','system'])->index();
            $t->longText('content');
            $t->json('content_parts')->nullable();
            $t->timestamps();

            $t->index('thread_id');
            $t->foreign('thread_id', 'cm_thread_fk')
              ->references('id')->on('chat_threads')
              ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $t) {
            try { $t->dropForeign('cm_thread_fk'); } catch (\Throwable $e) {}
        });
        Schema::dropIfExists('chat_messages');
    }
};
