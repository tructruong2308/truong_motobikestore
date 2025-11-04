import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

const LS_ITEMS = "noti_items";
const LS_UNREAD = "noti_unread";

export function NotificationProvider({ children }) {
  // Khởi tạo từ localStorage để F5 vẫn còn
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_ITEMS) || "[]");
    } catch {
      return [];
    }
  });
  const [unread, setUnread] = useState(() => {
    try {
      return Number(localStorage.getItem(LS_UNREAD) || 0);
    } catch {
      return 0;
    }
  });

  // Đồng bộ localStorage
  useEffect(() => {
    localStorage.setItem(LS_ITEMS, JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem(LS_UNREAD, String(unread));
  }, [unread]);

  // Thêm 1 thông báo mới
  const push = (n) => {
    const item = {
      id: Date.now(),
      title: n.title || "Thông báo",
      message: n.message || "",
      data: n.data || null,
      time: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev].slice(0, 200)); // giới hạn 200 item
    setUnread((u) => u + 1);

    // Phát event cho Bell (để phát âm thanh)
    window.dispatchEvent(new CustomEvent("notify:new", { detail: item }));
  };

  const dismiss = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => {
    setItems([]);
    setUnread(0);
  };
  const markAllAsRead = () => setUnread(0);

  const value = useMemo(
    () => ({ items, unread, push, markAllAsRead, dismiss, clear }),
    [items, unread]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
