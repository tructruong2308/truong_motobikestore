// src/lib/echo.js
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

// Lấy base URL của API (không có /api ở cuối)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '')

export function createEcho(token) {
  // token: Bearer token (Sanctum PAT) của khách
  return new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,       // <- set trên Vercel
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER, // <- ap1
    forceTLS: true,                                  // trang đang https ⇒ dùng wss
    // Cấu hình auth cho private/presence channel bằng Bearer token
    authEndpoint: `${API_BASE}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  })
}
