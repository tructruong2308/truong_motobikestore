// src/realtime/RealtimeListener.jsx
import { useEffect } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useNotifications } from "../notifications/NotificationProvider";

const API = "http://127.0.0.1:8000";
const REVERB_KEY = "local-key";
const REVERB_WS_HOST = "127.0.0.1";
const REVERB_WS_PORT = 6001;

export default function RealtimeListener() {
  const { push } = useNotifications();

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const user = JSON.parse(localStorage.getItem("customer_user") || "null");
    if (!token || !user?.id) return;

    window.Pusher = Pusher;

    // --- Singleton Echo (tránh tạo nhiều instance khi re-render/StrictMode)
    if (!window.__customerEcho) {
      window.__customerEcho = new Echo({
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
        // giảm noise
        disableStats: true,
      });
    }

    const echo = window.__customerEcho;

    // Nếu đã có kênh cũ thì hủy listener cũ trước khi lắng nghe lại
    if (window.__customerChannel) {
      try {
        window.__customerChannel
          .stopListening(".order.status.updated")
          .stopListening(".OrderStatusUpdated");
        // KHÔNG disconnect ở đây
      } catch {}
    }

    // Subcribe vào kênh private
    const channelName = `users.${user.id}`;
    const channel = echo.private(channelName);
    window.__customerChannel = channel; // giữ tham chiếu toàn cục để tránh nhân đôi

    const handlePayload = (payload) => {
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

      // đẩy vào hệ thống thông báo (Bell đọc & phát âm)
      push({
        title: "Cập nhật đơn hàng",
        message: `Đơn #${o.id} đã chuyển sang "${label}".`,
        data: { id: o.id }, // để Bell click -> /orders và focus
      });

      // cho Orders.jsx tự đồng bộ UI nếu đang mở
      window.dispatchEvent(new CustomEvent("order:status:updated", { detail: o }));
    };

    channel
      .listen(".order.status.updated", handlePayload)
      .listen(".OrderStatusUpdated", handlePayload);

    return () => {
      // Khi component unmount: chỉ cần bỏ listener (không disconnect socket)
      try {
        channel
          .stopListening(".order.status.updated")
          .stopListening(".OrderStatusUpdated");

        // RỜI KÊNH đúng cú pháp: KHÔNG thêm 'private-'
        if (echo && channelName) {
          echo.leave(channelName);
        }
      } catch {}
      // không echo.disconnect() ở đây – để singleton tiếp tục dùng trên các trang khác
    };
  }, [push]);

  return null;
}
