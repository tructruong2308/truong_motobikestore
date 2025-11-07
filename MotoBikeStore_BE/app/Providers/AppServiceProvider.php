<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register()
    {
        $this->app->singleton(\App\Services\ProductLookup::class, fn () => new \App\Services\ProductLookup());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Ép HTTPS ở môi trường production (hoặc khi bật biến FORCE_HTTPS)
        if (app()->environment('production') || env('FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }
    }
}
