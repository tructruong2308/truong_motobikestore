// src/components/Bell.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNotifications } from "../notifications/NotificationProvider";
import { useNavigate } from "react-router-dom";

export default function Bell() {
  const { unread, items, markAllAsRead, remove, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const navigate = useNavigate();

  // Mở khoá play audio sau tương tác đầu tiên
  useEffect(() => {
    const unlock = () => {
      const el = audioRef.current;
      if (!el) return;
      el.volume = 0;
      el.play().then(() => { el.pause(); el.currentTime = 0; el.volume = 1; setAudioReady(true); }).catch(() => {});
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

  // Có notify mới thì phát âm
  useEffect(() => {
    const onNotify = () => {
      if (audioRef.current && audioReady) {
        try { audioRef.current.currentTime = 0; audioRef.current.play(); } catch {}
      }
    };
    window.addEventListener("notify:new", onNotify);
    return () => window.removeEventListener("notify:new", onNotify);
  }, [audioReady]);

  // 👉 Khi click 1 thông báo: lưu orderId → điều hướng → đóng popover
  const goToOrder = (n) => {
    const orderId = n?.data?.id ?? n?.data?.order_id ?? null;
    if (orderId) {
      try {
        sessionStorage.setItem("focus_order_id", String(orderId));
      } catch {}
    }
    navigate("/orders");
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Đặt file ở public/sounds/notify.mp3 */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notify.mp3" type="audio/mpeg" />
      </audio>

      <button
        onClick={() => { setOpen(v => !v); if (!open) markAllAsRead(); }}
        title="Thông báo"
        style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #233", background:"#0f172a", color:"#e5e7eb", position:"relative", cursor:"pointer" }}
      >
        🔔
        {unread > 0 && (
          <span style={{ position:"absolute", top:-6, right:-6, background:"#ef4444", color:"#fff", borderRadius: 999, padding:"2px 6px", fontSize: 12, fontWeight: 800 }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:"absolute", right:0, marginTop:8, width:360, maxHeight:420, overflow:"auto",
          background:"#0b1220", border:"1px solid #233", borderRadius:12, boxShadow:"0 8px 30px rgba(0,0,0,.35)", zIndex:1000 }}>
          <div style={{ padding:"10px 12px", borderBottom:"1px solid #233", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
            <div style={{ fontWeight:800 }}>Thông báo</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={markAllAsRead} style={{ height:30, padding:"0 10px", borderRadius:8, border:"1px solid #334155", background:"#0f172a", color:"#cbd5e1", cursor:"pointer" }}>
                Đã đọc
              </button>
              <button onClick={clear} style={{ height:30, padding:"0 10px", borderRadius:8, border:"1px solid #7c2d12", background:"#7c2d12", color:"#fff", cursor:"pointer" }}>
                Xoá hết
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ padding:12, opacity:.7 }}>Chưa có thông báo</div>
          ) : items.map(n => (
            <div
              key={n.id}
              onClick={() => goToOrder(n)}
              style={{
                padding:12, borderBottom:"1px dashed #233",
                display:"grid", gridTemplateColumns:"1fr auto", gap:8,
                cursor: "pointer"
              }}
            >
              <div>
                <div style={{ fontWeight:700 }}>{n.title}</div>
                {n.message && <div style={{ opacity:.85, fontSize:13 }}>{n.message}</div>}
                <div style={{ opacity:.6, fontSize:12, marginTop:4 }}>{new Date(n.time).toLocaleString()}</div>
              </div>
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                  title="Xoá"
                  style={{ border:"1px solid #334155", background:"#0f172a", color:"#e5e7eb", height:28, padding:"0 8px", borderRadius:8, cursor:"pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
