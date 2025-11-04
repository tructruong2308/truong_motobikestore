<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class; // <-- trỏ đúng model

    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);
        return [
            'name'          => $name,
            'slug'          => Str::slug($name.'-'.$this->faker->unique()->numberBetween(1, 999999)),
            'price'         => $this->faker->numberBetween(50_000, 50_000_000),
            'stock'         => $this->faker->numberBetween(0, 500),
            'thumbnail_url' => $this->faker->imageUrl(640, 640, 'tech', true),
            'description'   => $this->faker->paragraph(),
            'status'        => 1,
        ];
    }
}
