<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('product_review_images', function (Blueprint $t) {
            $t->id();
            $t->foreignId('review_id')->constrained('product_reviews')->onDelete('cascade');
            $t->string('image', 255); // đường dẫn file trong storage/app/public
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('product_review_images');
    }
};
