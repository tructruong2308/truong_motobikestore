// src/realtime/RealtimeListener.jsx
import { useEffect } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useNotifications } from "../notifications/NotificationProvider";

window.Pusher = Pusher;

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "")
  .toString()
  .replace(/\/api\/?$/, "");

export default function RealtimeListener() {
  const { push } = useNotifications();

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const user = JSON.parse(localStorage.getItem("customer_user") || "null");
    if (!token || !user?.id) return;

    // Singleton Echo để tránh nhân đôi
    if (!window.__customerEcho) {
      window.__customerEcho = new Echo({
        broadcaster: "pusher",
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        authEndpoint: `${API_ROOT}/broadcasting/auth`,
        auth: {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
        disableStats: true,
      });
    }

    const echo = window.__customerEcho;

    // Bỏ listener cũ nếu có
    if (window.__customerChannel) {
      try {
        window.__customerChannel
          .stopListening(".order.status.updated")
          .stopListening(".OrderStatusUpdated");
      } catch {}
    }

    // Subscribe kênh private theo user
    const channelName = `users.${user.id}`;
    const channel = echo.private(channelName);
    window.__customerChannel = channel;

    const handlePayload = (payload) => {
      const o = payload?.order;
      if (!o?.id) return;

      const label =
        payload?.status_label ||
        ({0:"Chờ xác nhận",1:"Đã xác nhận",2:"Đang đóng gói",3:"Đang giao",4:"Đã giao",5:"Đã huỷ"}[
          Number(payload?.status)
        ] || "Cập nhật");

      push({
        title: "Cập nhật đơn hàng",
        message: `Đơn #${o.id} đã chuyển sang "${label}".`,
        data: { id: o.id },
      });

      window.dispatchEvent(new CustomEvent("order:status:updated", { detail: o }));
    };

    channel
      .listen(".order.status.updated", handlePayload)
      .listen(".OrderStatusUpdated", handlePayload);

    return () => {
      try {
        channel
          .stopListening(".order.status.updated")
          .stopListening(".OrderStatusUpdated");
        if (echo && channelName) echo.leave(channelName);
      } catch {}
    };
  }, [push]);

  return null;
}
