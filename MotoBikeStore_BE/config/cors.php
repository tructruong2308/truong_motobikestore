<?php

return [
    // Chỉ áp dụng CORS cho các endpoint cần thiết
    'paths' => [
        'api/*',
        'broadcasting/auth',
        'sanctum/csrf-cookie', // nếu không dùng Sanctum có thể bỏ dòng này
    ],

    // Method cho phép
    'allowed_methods' => ['*'],

    // CHỈ cho phép origin FE của bạn (thêm domain khác nếu có)
    'allowed_origins' => [
        'https://truong-motobikestore.vercel.app',           // FE Vercel (prod)
        'https://truong-motobikestore-3.onrender.com',
    ],

    // Nếu muốn cho phép theo pattern subdomain, dùng cái này thay vì allowed_origins
    'allowed_origins_patterns' => [
        // '#^https://(.*\.)?yourdomain\.com$#',
    ],

    // Header cho phép
    'allowed_headers' => ['*'],

    // Header muốn “lộ” ra cho JS (thường để trống)
    'exposed_headers' => [],

    // Cache preflight (giây)
    'max_age' => 86400,

    // Dùng Bearer token => false; nếu dùng cookie (Sanctum) hãy đổi thành true và KHÔNG dùng '*'
    'supports_credentials' => false,
];
