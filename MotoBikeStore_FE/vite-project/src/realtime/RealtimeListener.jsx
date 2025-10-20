// src/realtime/RealtimeListener.jsx
import { useEffect } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useNotifications } from "../notifications/NotificationProvider";

// Cấu hình Reverb cục bộ
const API = "http://127.0.0.1:8000";
const REVERB_KEY = "local-key";
const REVERB_WS_HOST = "127.0.0.1";
const REVERB_WS_PORT = 6001;

export default function RealtimeListener() {
  const { push } = useNotifications();

  useEffect(() => {
    window.Pusher = Pusher;
    const token = localStorage.getItem("customer_token");
    const user = JSON.parse(localStorage.getItem("customer_user") || "null");
    if (!token || !user?.id) return;

    // Tạo Echo dùng Reverb
    const echo = new Echo({
      broadcaster: "reverb",
      key: REVERB_KEY,
      wsHost: REVERB_WS_HOST,
      wsPort: REVERB_WS_PORT,
      forceTLS: false,
      enabledTransports: ["ws"],
      authEndpoint: `${API}/broadcasting/auth`,
      auth: {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Kênh riêng tư: users.{id}
    const channel = echo.private(`users.${user.id}`);

    // Tên event tuỳ BE:
    // 1) Nếu trong Event PHP có broadcastAs(): 'order.status.updated'
    channel.listen(".order.status.updated", (payload) => {
      const o = payload?.order;
      if (!o?.id) return;
      const label =
        payload?.status_label ||
        ({
          0: "Chờ xác nhận",
          1: "Đã xác nhận",
          2: "Đang đóng gói",
          3: "Đang giao",
          4: "Đã giao",
          5: "Đã huỷ",
        }[Number(payload?.status)] || "Cập nhật");
      push({
        title: "Cập nhật đơn hàng",
        message: `Đơn #${o.id} đã chuyển sang "${label}".`,
        data: o,
      });

      // Bạn có thể tự phát sự kiện để Orders.jsx tự cập nhật UI nếu muốn:
      window.dispatchEvent(new CustomEvent("order:status:updated", { detail: o }));
    });

    // 2) Nếu không có broadcastAs(), Laravel mặc định dùng tên class:
    channel.listen(".OrderStatusUpdated", (payload) => {
      const o = payload?.order;
      if (!o?.id) return;
      const label =
        payload?.status_label ||
        ({
          0: "Chờ xác nhận",
          1: "Đã xác nhận",
          2: "Đang đóng gói",
          3: "Đang giao",
          4: "Đã giao",
          5: "Đã huỷ",
        }[Number(payload?.status)] || "Cập nhật");
      push({
        title: "Cập nhật đơn hàng",
        message: `Đơn #${o.id} đã chuyển sang "${label}".`,
        data: o,
      });
      window.dispatchEvent(new CustomEvent("order:status:updated", { detail: o }));
    });

    return () => {
      try {
        echo.leave(`private-users.${user.id}`);
        echo.disconnect();
      } catch {}
    };
  }, [push]);

  return null;
}
