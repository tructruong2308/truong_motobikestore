<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\CouponController;

/* ---------- PUBLIC ---------- */
Route::post('/register',        [AuthController::class, 'register']);
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/admin/login',     [AuthController::class, 'loginAdmin']);

Route::get('/products',         [ProductController::class, 'index']);
Route::get('/products/{id}',    [ProductController::class, 'show']);
Route::get('/categories',               [CategoryController::class, 'index']);
Route::get('/categories/{id}',          [CategoryController::class, 'show']);
Route::get('/categories/{id}/products', [ProductController::class, 'byCategory']);

Route::get('/products/{id}/reviews', [ReviewController::class, 'index']);

/* MoMo public callbacks */
Route::get ('/payments/momo/return', [PaymentController::class, 'momoReturn']);
Route::post('/payments/momo/ipn',    [PaymentController::class, 'momoIpn']);

// Coupons: kiểm tra áp dụng
    Route::post('/coupons/validate', [CouponController::class, 'validateCode']);
//danh
    Route::get('/coupons/claimable', [CouponController::class, 'claimable']);


/* ---------- CUSTOMER (Sanctum) ---------- */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get ('/me', fn() => response()->json(['data' => auth()->user()]));

    Route::put('/profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
     Route::post('/profile', [ProfileController::class, 'update']);

    // Reviews
    Route::get ('/products/{id}/reviews/can', [ReviewController::class, 'can']);
    Route::post('/products/{id}/reviews',     [ReviewController::class, 'store']);
    Route::put ('/reviews/{id}',              [ReviewController::class, 'update']);
     Route::post('/reviews/{id}/images',       [ReviewController::class, 'uploadImages']);

    // Checkout: chỉ 1 route, qua PaymentController
    Route::post('/checkout', [PaymentController::class, 'checkout']);

    // Orders của khách
    Route::get ('/orders',      [OrderController::class, 'index']);
    Route::get ('/orders/{id}', [OrderController::class, 'show']);

    
});

/* ---------- ADMIN (Sanctum + role) ---------- */
Route::middleware(['auth:sanctum','is_admin'])->prefix('admin')->group(function () {
    // Products
    Route::post  ('/products',              [ProductController::class, 'store']);
    Route::put   ('/products/{id}',         [ProductController::class, 'update']);
    Route::delete('/products/{id}',         [ProductController::class, 'destroy']);
    Route::patch ('/products/{id}/status',  [ProductController::class, 'toggleStatus']);
    Route::get   ('/products',              [ProductController::class, 'index']);
    Route::get   ('/products/new',          [ProductController::class, 'newest']);
    Route::get   ('/products/sale',         [ProductController::class, 'sale']);
    Route::get   ('/products/{id}',         [ProductController::class, 'show']);

    // Categories
    Route::post  ('/categories',            [CategoryController::class, 'store']);
    Route::put   ('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::get   ('/categories/{id}/products', [ProductController::class, 'byCategory']);

    // Users
    Route::get   ('/users',               [UserController::class, 'index']);
    Route::get   ('/users/{id}',          [UserController::class, 'show']);
    Route::post  ('/users',               [UserController::class, 'store']);
    Route::put   ('/users/{id}',          [UserController::class, 'update']);
    Route::delete('/users/{id}',          [UserController::class, 'destroy']);
    Route::post  ('/users/{id}/lock',     [UserController::class, 'lock']);
    Route::post  ('/users/{id}/unlock',   [UserController::class, 'unlock']);

    // Orders (admin)
    Route::patch ('/orders/{id}/status',   [OrderController::class, 'updateStatus']);
     Route::get   ('/orders',             [OrderController::class, 'adminIndex']); 
    Route::get   ('/orders/{id}',        [OrderController::class, 'adminShow']);

    // Coupons
    Route::get   ('/coupons',            [CouponController::class, 'index']);
    Route::post  ('/coupons',            [CouponController::class, 'store']);
    Route::put   ('/coupons/{id}',       [CouponController::class, 'update']);
    Route::delete('/coupons/{id}',       [CouponController::class, 'destroy']);
    Route::patch ('/coupons/{id}/toggle',[CouponController::class, 'toggle']);

});

/* 404 */
Route::fallback(fn () => response()->json(['message' => 'Endpoint not found'], 404));
