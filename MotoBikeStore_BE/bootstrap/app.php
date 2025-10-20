<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// 👇 thêm use cho middleware tự viết
use App\Http\Middleware\IsAdmin;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // (Tuỳ chọn) bật CORS toàn cục – nếu bạn đã cấu hình config/cors.php thì có thể bỏ dòng này
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // ✅ ĐĂNG KÝ ALIAS CHO MIDDLEWARE TUỲ CHỈNH
        $middleware->alias([
            'is_admin' => IsAdmin::class,   // <— quan trọng
        ]);

        // ✅ Nhóm 'api' tối thiểu cần SubstituteBindings
        // (đừng thêm auth:sanctum ở đây, vì bạn đã gắn 'auth:sanctum' trực tiếp trên route nào cần)
        $middleware->group('api', [
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // Không định nghĩa lại 'web' group để giữ nguyên stack mặc định (session, cookies…)
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
