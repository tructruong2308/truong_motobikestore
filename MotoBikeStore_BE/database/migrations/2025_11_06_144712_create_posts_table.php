<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('posts', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->string('slug')->unique();
            $t->string('source')->nullable();       // nguồn tin (VD: vnexpress.net)
            $t->string('author')->nullable();       // tác giả
            $t->text('excerpt')->nullable();        // tóm tắt
            $t->longText('content')->nullable();    // nội dung chính
            $t->string('thumbnail_url')->nullable();// ảnh đại diện
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('posts');
    }
};
