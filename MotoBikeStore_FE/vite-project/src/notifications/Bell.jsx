import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../notifications/NotificationProvider";
import { useNavigate, useLocation } from "react-router-dom";

export default function Bell() {
  const { unread, items, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mở khoá audio theo policy trình duyệt
  useEffect(() => {
    const unlock = () => {
      const el = audioRef.current;
      if (!el) return;
      el.volume = 0;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = 1;
          setAudioReady(true);
        })
        .catch(() => {});
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // Có notify mới -> phát âm
  useEffect(() => {
    const onNotify = () => {
      if (audioRef.current && audioReady) {
        try {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        } catch {}
      }
    };
    window.addEventListener("notify:new", onNotify);
    return () => window.removeEventListener("notify:new", onNotify);
  }, [audioReady]);

  // Click 1 thông báo -> focus đơn / điều hướng
  const openOrderFromNotice = (n) => {
    const id = n?.data?.id || n?.orderId || n?.id;
    if (!id) return;

    try {
      sessionStorage.setItem("focus_order_id", String(id));
    } catch {}

    setOpen(false);

    if (location.pathname === "/orders") {
      window.dispatchEvent(
        new CustomEvent("focus:order", { detail: { id: Number(id) } })
      );
    } else {
      navigate(`/orders?focus=${id}#o${id}`);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* file âm thanh: public/sounds/notify.mp3 */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notify.mp3" type="audio/mpeg" />
      </audio>

      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllAsRead();
        }}
        title="Thông báo"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid #233",
          background: "#0f172a",
          color: "#e5e7eb",
          position: "relative",
          cursor: "pointer",
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "#ef4444",
              color: "#fff",
              borderRadius: 999,
              padding: "2px 6px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 360,
            maxHeight: 440,
            overflow: "auto",
            background: "#0b1220",
            border: "1px solid #233",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,.35)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #233",
              fontWeight: 800,
            }}
          >
            Thông báo
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 12, opacity: 0.7 }}>Chưa có thông báo</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => openOrderFromNotice(n)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  padding: 12,
                  borderBottom: "1px dashed #233",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                {n.message && (
                  <div style={{ opacity: 0.85, fontSize: 13 }}>{n.message}</div>
                )}
                <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
                  {new Date(n.time).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
