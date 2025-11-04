<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | Hãy trỏ về biến BROADCAST_CONNECTION (hoặc dùng 'reverb' nếu không có).
    |
    */
    'default' => env('BROADCAST_CONNECTION', env('BROADCAST_DRIVER', 'pusher')),

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    */
    'connections' => [

        // === Reverb (Laravel self-hosted WebSocket) ===
        'reverb' => [
            'driver' => 'reverb',
            'key'    => env('REVERB_APP_KEY', 'local-key'),
            'secret' => env('REVERB_APP_SECRET', 'local-secret'),
            'app_id' => env('REVERB_APP_ID', 'app-1'),
            'options' => [
                'host'   => env('REVERB_SERVER_HOST', '127.0.0.1'),
                'port'   => env('REVERB_SERVER_PORT', 6001),
                'scheme' => env('REVERB_SCHEME', 'http'),
                // Nếu chạy HTTP local thì để false. Nếu reverse proxy TLS, set true:
                'useTLS' => false,
            ],
        ],

        // === Pusher (nếu sau này bạn muốn dùng Pusher Cloud) ===
        'pusher' => [
            'driver' => 'pusher',
            'key'    => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'cluster' => env('PUSHER_APP_CLUSTER', 'ap1'),
                'useTLS'  => true,
                // Khi dùng Pusher cloud thì để host/port theo mặc định.
                // Khi tự host (websockets BeyondCode cũ) mới cần override host/port.
                'host'   => env('PUSHER_HOST', 'api-'.env('PUSHER_APP_CLUSTER', 'ap1').'.pusher.com'),
                'port'   => env('PUSHER_PORT', 443),
                'scheme' => env('PUSHER_SCHEME', 'https'),
            ],
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],
    ],
];
