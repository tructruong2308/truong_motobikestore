// src/lib/echo.js
import Echo from "laravel-echo";
import Pusher from "pusher-js"; // Echo dùng Pusher protocol

window.Pusher = Pusher;

export function createEcho(token) {
  // token là Bearer (Sanctum Personal Access Token) của khách
  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY || "local-key",
    wsHost: import.meta.env.VITE_REVERB_HOST || "127.0.0.1",
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 6001),
    forceTLS: false,
    enabledTransports: ["ws"],

    // Auth private channel qua Sanctum bằng Bearer token
    authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",
    auth: {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
