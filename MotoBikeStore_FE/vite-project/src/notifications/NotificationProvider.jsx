// src/notifications/NotificationProvider.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  // Thêm 1 thông báo mới (không bật toast; chỉ tăng badge + phát event để Bell phát âm thanh)
  const push = (n) => {
    const item = {
      id: Date.now(),
      title: n.title || "Thông báo",
      message: n.message || "",
      data: n.data || null,
      time: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setUnread((u) => u + 1);

    // Phát event cho Bell (để phát âm thanh)
    window.dispatchEvent(new CustomEvent("notify:new", { detail: item }));
  };

  const markAllAsRead = () => setUnread(0);

  const value = useMemo(
    () => ({ items, unread, push, markAllAsRead }),
    [items, unread]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
