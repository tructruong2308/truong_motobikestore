// src/pages/Customers/Orders.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/72x72?text=Img";
const VND = new Intl.NumberFormat("vi-VN");

/* ======== Reverb (nếu bạn bật Laravel Reverb) ======== */
const REVERB_KEY = "local-key";
const REVERB_WS_HOST = "127.0.0.1";
const REVERB_WS_PORT = 6001;

/* Trạng thái -> nhãn + màu */
const STATUS = {
  0: { label: "Chờ xác nhận", cls: "warn" },
  1: { label: "Đã xác nhận", cls: "info" },
  2: { label: "Đang đóng gói", cls: "warn" },
  3: { label: "Đang giao", cls: "warn" },
  4: { label: "Đã giao", cls: "success" },
  5: { label: "Đã huỷ", cls: "muted" },
};
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "0", label: "Chờ xác nhận" },
  { key: "1", label: "Đã xác nhận" },
  { key: "2", label: "Đang đóng gói" },
  { key: "3", label: "Đang giao" },
  { key: "4", label: "Đã giao" },
  { key: "5", label: "Đã huỷ" },
];

/* ====== CSS (thêm overlay toàn màn hình + highlight khi điều hướng từ Bell) ====== */
const css = `
.ordersX{ --radius:14px; --line:#1f2937; --panel:#0b1320; --panel2:#0f172a; --text:#e5e7eb }

.ordersX .tabs{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px }
.ordersX .tab{ padding:10px 14px; border-radius:999px; border:1px solid var(--line);
  background:var(--panel2); color:var(--text); cursor:pointer; font-weight:700 }
.ordersX .tab.active{ outline:2px solid rgba(99,102,241,.35); background:rgba(99,102,241,.18); color:#a5b4fc }

.ordersX .toolbar{ display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px }
.ordersX .toolbar input, .ordersX .toolbar select{
  height:38px; padding:0 12px; border-radius:10px; border:1px solid var(--line);
  background:var(--panel2); color:var(--text)
}

.ordersX .card{ border:1px solid var(--line); border-radius:var(--radius); background:var(--panel2);
  overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,.18) }
.ordersX .head{ display:flex; justify-content:space-between; align-items:center; padding:12px 14px;
  border-bottom:1px solid var(--line); background:linear-gradient(180deg,rgba(2,6,23,.35),rgba(2,6,23,.08)) }
.ordersX .head-left{ display:flex; gap:10px; align-items:center; color:#cbd5e1; font-weight:700 }
.ordersX .head-left .code{ font-size:15px }
.ordersX .head-left .date{ opacity:.7; font-size:12px; font-weight:600 }

.ordersX .status{ font-weight:800; padding:6px 10px; border-radius:999px; border:1px solid; white-space:nowrap }
.ordersX .status.success{ color:#34d399; border-color:rgba(52,211,153,.35); background:rgba(52,211,153,.1) }
.ordersX .status.info{ color:#60a5fa; border-color:rgba(96,165,250,.35); background:rgba(96,165,250,.12) }
.ordersX .status.warn{ color:#f59e0b; border-color:rgba(245,158,11,.35); background:rgba(245,158,11,.1) }
.ordersX .status.muted{ color:#94a3b8; border-color:rgba(148,163,184,.35); background:rgba(148,163,184,.12) }

.ordersX .rows{ padding:10px 14px }
.ordersX .row{ display:grid; grid-template-columns: 72px 1fr auto; gap:12px; padding:12px 0; border-bottom:1px dashed rgba(148,163,184,.22) }
.ordersX .row:last-child{ border-bottom:0 }
.ordersX .thumb{ width:72px; height:72px; border-radius:10px; border:1px solid var(--line); background:var(--panel);
  object-fit:cover }
.ordersX .name{ font-weight:800; color:#e5e7eb; line-height:1.35 }
.ordersX .meta{ font-size:12px; opacity:.8 }
.ordersX .amount{ font-weight:800; color:#e2e8f0 }

.ordersX .foot{ padding:10px 14px; background:rgba(2,6,23,.25); border-top:1px solid var(--line) }
.ordersX .foot-top{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap }
.ordersX .payWrap{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; color:#cbd5e1 }
.ordersX .badge{ font-weight:800; padding:4px 10px; border-radius:999px; border:1px solid; white-space:nowrap }
.ordersX .badge.cod{ color:#f59e0b; border-color:rgba(245,158,11,.35); background:rgba(245,158,11,.1) }
.ordersX .badge.momo{ color:#ec4899; border-color:rgba(236,72,153,.35); background:rgba(236,72,153,.1) }
.ordersX .badge.paid{ color:#34d399; border-color:rgba(52,211,153,.35); background:rgba(52,211,153,.1) }
.ordersX .badge.unpaid{ color:#94a3b8; border-color:rgba(148,163,184,.35); background:rgba(148,163,184,.12) }

.ordersX .sum{ display:flex; align-items:center; gap:8px; font-weight:900 }
.ordersX .sum .label{ opacity:.8 }
.ordersX .sum .money{ font-size:18px; color:#34d399 }

.ordersX .actions{ margin-top:10px; display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap }
.ordersX .btn{ height:38px; padding:0 14px; border-radius:10px; border:1px solid var(--line);
  background:#0f172a; color:#e2e8f0; font-weight:800; cursor:pointer }
.ordersX .btn.primary{ background:#14532d; border-color:#14532d }
.ordersX .btn.danger{ background:#7c2d12; border-color:#7c2d12 }
.ordersX .btn:disabled{ opacity:.6; cursor:not-allowed }

.ordersX .empty{ text-align:center; padding:18px; opacity:.8; border:1px dashed var(--line); border-radius:14px; background:var(--panel2) }

/* Panel thông báo nhỏ */
.ordersX .noticeWrap{ border:1px dashed rgba(34,197,94,.45); background:rgba(34,197,94,.06);
  padding:10px; border-radius:14px; margin:0 0 12px 0 }
.ordersX .noticeHead{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; color:#d1fae5 }
.ordersX .noticeList{ display:grid; gap:8px }
.ordersX .noticeItem{ display:flex; justify-content:space-between; gap:12px; align-items:center; 
  background:rgba(15,23,42,.6); border:1px solid rgba(34,197,94,.25); border-radius:12px; padding:8px 10px; color:#bbf7d0; cursor:pointer }
.ordersX .noticeActions{ display:flex; gap:6px }
.ordersX .xbtn{ height:30px; padding:0 10px; border-radius:8px; border:1px solid rgba(34,197,94,.35); background:#0f172a; color:#d1fae5; cursor:pointer }

/* ===== Overlay toàn màn hình (kiểu Shopee) ===== */
@keyframes overlayIn { from{opacity:0} to{opacity:1} }
@keyframes cardIn { from{ transform:translateY(24px); opacity:0 } to{ transform:translateY(0); opacity:1 } }

.ordersX .overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(2,6,23,.65);
  display:flex; align-items:center; justify-content:center;
  animation: overlayIn .18s ease-out;
}
.ordersX .overlayCard{
  width:min(680px,92vw);
  border-radius:18px; padding:18px;
  background: linear-gradient(180deg, #0b1220, #0c1426);
  border:1px solid rgba(148,163,184,.25);
  box-shadow:0 30px 80px rgba(0,0,0,.45);
  animation: cardIn .22s ease-out;
}
.ordersX .overlayHead{ display:flex; align-items:center; gap:10px; margin-bottom:10px; color:#e5e7eb }
.ordersX .overlayHead .badge{
  font-size:12px; font-weight:900; padding:4px 10px; border-radius:999px; white-space:nowrap;
  background:rgba(99,102,241,.18); border:1px solid rgba(99,102,241,.38); color:#c7d2fe;
}
.ordersX .overlayMsg{ font-size:18px; font-weight:900; color:#cbd5e1; margin-bottom:6px }
.ordersX .overlaySub{ opacity:.85; color:#9fb0cf; margin-bottom:12px }
.ordersX .overlayActions{ display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap }
.ordersX .overlayBtn{ height:38px; padding:0 14px; border-radius:10px; border:1px solid var(--line);
  background:#0f172a; color:#e2e8f0; font-weight:900; cursor:pointer }
.ordersX .overlayBtn.primary{ background:#14532d; border-color:#14532d }

/* ===== Highlight khi điều hướng từ chuông ===== */
@keyframes flashPulse {
  0% { box-shadow: 0 0 0 0 rgba(96,165,250,.45); }
  100% { box-shadow: 0 0 0 14px rgba(96,165,250,0); }
}
.ordersX .card.highlight {
  outline: 2px solid #60a5fa;
  box-shadow: 0 0 0 6px rgba(96,165,250,.25);
  animation: flashPulse 1.2s ease-out 3;
}
`;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Bộ lọc
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [month, setMonth] = useState(""); // yyyy-mm
  const [pay, setPay] = useState("all");  // all|cod|momo

  // Echo
  const echoRef = useRef(null);
  window.Pusher = Pusher;

  // Notifications mini panel
  const [notices, setNotices] = useState(() => {
    try { return JSON.parse(localStorage.getItem("order_notices") || "[]"); } catch { return []; }
  });

  // ===== Overlay toàn cửa sổ =====
  const [overlay, setOverlay] = useState({ open: false, orderId: null, text: "", status: null, at: "" });

  // 🔵 highlightId để làm nổi & cuộn tới đúng đơn khi điều hướng/click
  const [highlightId, setHighlightId] = useState(null);

  // 👉 Hàm dùng chung: cuộn + highlight (bấm nhiều lần vẫn nháy)
  const focusOrder = (orderId) => {
    const idNum = Number(orderId);
    // reset để có thể kích hoạt lại animation nhiều lần
    setHighlightId(null);
    // đợi 1 nhịp để lớp .highlight bị gỡ, sau đó set lại
    setTimeout(() => {
      setHighlightId(idNum);
      const el = document.getElementById(`order-${idNum}`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // tắt highlight sau 6s
      setTimeout(() => setHighlightId((cur) => (Number(cur) === idNum ? null : cur)), 6000);
    }, 60);
  };

  // Tự ẩn overlay sau N ms
  useEffect(() => {
    if (!overlay.open) return;
    const t = setTimeout(() => setOverlay(o => ({ ...o, open: false })), 4000);
    return () => clearTimeout(t);
  }, [overlay.open]);

  function showToast(text) {
    try {
      const el = document.createElement("div");
      el.innerText = text;
      Object.assign(el.style, {
        position: "fixed", right: "16px", bottom: "16px", zIndex: 100000,
        background: "rgba(15,23,42,.96)", color: "#d1fae5", padding: "10px 14px",
        borderRadius: "10px", border: "1px solid rgba(34,197,94,.35)",
        boxShadow: "0 6px 20px rgba(0,0,0,.35)", fontWeight: 700, maxWidth: "70vw"
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    } catch {}
  }
  function tryNotify(body) {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification("Cập nhật đơn hàng", { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
          if (p === "granted") new Notification("Cập nhật đơn hàng", { body });
        });
      }
    } catch {}
  }
  const removeNotice = (id) => {
    setNotices(prev => {
      const next = prev.filter(n => n.id !== id);
      localStorage.setItem("order_notices", JSON.stringify(next));
      return next;
    });
  };
  const clearNotices = () => { setNotices([]); localStorage.removeItem("order_notices"); };

  /* ===== LOAD LẦN ĐẦU ===== */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const token = localStorage.getItem("customer_token");
        const res = await fetch(`${API}/api/orders?per_page=50`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) throw new Error(json?.message || "Không tải được danh sách đơn hàng");
        const payload = json?.data;
        const list = Array.isArray(payload) ? payload : (payload?.data || []);
        setOrders(list);
        if (!list.length) setMsg("Bạn chưa có đơn hàng nào.");
      } catch (e) {
        setMsg("❌ " + (e.message || "Có lỗi xảy ra"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ===== Sau khi vào trang /orders: đọc focus_order_id từ sessionStorage để highlight + scroll ===== */
  useEffect(() => {
    let id = null;
    try { id = sessionStorage.getItem("focus_order_id"); } catch {}
    if (!id) return;
    focusOrder(Number(id));
    try { sessionStorage.removeItem("focus_order_id"); } catch {}
  }, []);

  /* ===== REALTIME Reverb ===== */
  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const user = JSON.parse(localStorage.getItem("customer_user") || "null");
    if (!token || !user?.id) return;

    const echo = new Echo({
      broadcaster: "reverb",
      key: REVERB_KEY,
      wsHost: REVERB_WS_HOST,
      wsPort: REVERB_WS_PORT,
      forceTLS: false,
      enabledTransports: ["ws"],
      authEndpoint: `${API}/broadcasting/auth`,
      auth: { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
    });
    echoRef.current = echo;

    const channel = echo.private(`users.${user.id}`);

    const handlePayload = (payload) => {
      if (!payload?.order?.id) return;
      const id = payload.order.id;
      const sIdx = Number(payload.order.status);
      const sLabel = STATUS[sIdx]?.label || "Đã cập nhật trạng thái";

      // 1) Cập nhật danh sách
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: sIdx } : o)));

      // 2) Tạo text + hiển thị overlay toàn màn hình
      const text = `Đơn #${id}: ${sLabel}`;
      setOverlay({ open: true, orderId: id, text, status: sIdx, at: new Date().toISOString() });

      // 3) Panel mini + lưu localStorage
      const item = { id: `${id}-${Date.now()}`, orderId: id, text, at: new Date().toISOString() };
      setNotices(prev => {
        const next = [item, ...prev].slice(0, 20);
        localStorage.setItem("order_notices", JSON.stringify(next));
        return next;
      });

      // 4) Toast + Notification API
      showToast(text);
      tryNotify(text);
    };

    channel.listen(".order.status.updated", handlePayload);
    channel.listen(".OrderStatusUpdated", handlePayload); // fallback nếu không dùng broadcastAs

    return () => {
      try { echo.leave(`private-users.${user.id}`); echo.disconnect(); } catch {}
    };
  }, []);

  /* ===== Helpers ===== */
  const detailsOf = (o) => Array.isArray(o?.details) ? o.details : (o?.items || o?.order_details || []);
  const calcTotal = (o) =>
    o.total ?? detailsOf(o).reduce((s, d) => s + Number(d.amount ?? (d.qty || 0) * (d.price_buy || 0)), 0);

  /* ===== Actions ===== */
  const addManyToCart = (o) => {
    const ds = detailsOf(o);
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    let added = 0;
    ds.forEach((d) => {
      const id = d.product_id ?? d.id;
      const p = d.product || {};
      const name = p.name || d.name || `Sản phẩm #${id}`;
      const price = Number(d.price_buy || d.price || p.price_final || 0);
      const thumb = p.thumbnail_url || p.thumbnail || d.thumbnail_url || d.image_url || "";
      const exist = cart.findIndex((x) => String(x.id) === String(id));
      if (exist >= 0) cart[exist].qty = (cart[exist].qty || 1) + (Number(d.qty) || 1);
      else cart.push({ id, name, price, thumbnail_url: thumb, qty: Number(d.qty) || 1 });
      added++;
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:refresh"));
    alert(added ? "✅ Đã thêm sản phẩm của đơn vào giỏ!" : "Không có sản phẩm hợp lệ.");
  };

  const payMomoAgain = async (o) => {
    try {
      const token = localStorage.getItem("customer_token");
      const items = detailsOf(o).map((d) => ({
        product_id: d.product_id ?? d.id,
        qty: Number(d.qty || 1),
        unit_price: Number(d.price_buy || d.price || 0),
        name: d?.product?.name || d?.name || "",
      }));
      const body = {
        name: o.name || "", phone: o.phone || "", address: o.address || "", email: o.email || "",
        payment_method: "momo", items, total: calcTotal(o) || undefined,
      };
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data?.message || "Tạo thanh toán MoMo thất bại");
      if (data.payUrl) window.open(data.payUrl, "_blank"); else alert("✔ Đã tạo đơn mới, nhưng không nhận được payUrl.");
    } catch (e) {
      alert("❌ " + (e.message || "Không thể thanh toán MoMo"));
    }
  };

  const cancelOrder = async (o) => {
    if (!confirm("Bạn muốn hủy đơn này?")) return;
    try {
      const token = localStorage.getItem("customer_token");
      const res = await fetch(`${API}/api/orders/${o.id}/status`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 5 }),
      });
      if (!res.ok) throw new Error("Hủy đơn thất bại");
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 5 } : x)));
      alert("✅ Đã yêu cầu hủy đơn.");
    } catch (e) { alert("❌ " + (e.message || "Hủy đơn thất bại")); }
  };

  /* ===== FILTERED ===== */
  const filtered = useMemo(() => {
    let list = [...orders];
    if (tab !== "all") list = list.filter((o) => Number(o.status) === Number(tab));
    const kw = q.trim().toLowerCase();
    if (kw) {
      list = list.filter((o) => {
        const idHit = String(o.code || o.id || "").toLowerCase().includes(kw);
        const nameHit = detailsOf(o).some((d) => (d.product?.name || d.name || "").toLowerCase().includes(kw));
        return idHit || nameHit;
      });
    }
    if (month) {
      const [y, m] = month.split("-").map(Number);
      list = list.filter((o) => {
        const t = new Date(o.created_at || 0);
        return t.getFullYear() === y && t.getMonth() + 1 === m;
      });
    }
    if (pay !== "all") list = list.filter((o) => (o.payment_method || "cod") === pay);
    list.sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0) || (b.id || 0) - (a.id || 0));
    return list;
  }, [orders, tab, q, month, pay]);

  /* ===== RENDER ===== */
  return (
    <div className="ordersX">
      <style>{css}</style>
      <h2 style={{ margin: "0 0 12px 0", fontWeight: 900 }}>Đơn hàng của tôi</h2>

      {/* Overlay toàn màn hình khi có cập nhật */}
      {overlay.open && (
        <div className="overlay" onClick={() => setOverlay(o => ({ ...o, open: false }))}>
          <div className="overlayCard" onClick={(e) => e.stopPropagation()}>
            <div className="overlayHead">
              <span className="badge">CẬP NHẬT TRẠNG THÁI</span>
              <span style={{ fontSize:12, opacity:.8 }}>{new Date(overlay.at).toLocaleString()}</span>
            </div>
            <div className="overlayMsg">{overlay.text}</div>
            <div className="overlaySub">Nhấn “Xem đơn” để đi tới đơn hàng vừa được cập nhật.</div>
            <div className="overlayActions">
              <button
                className="overlayBtn"
                onClick={() => setOverlay(o => ({ ...o, open: false }))}
              >
                Đóng
              </button>
              <button
                className="overlayBtn primary"
                onClick={() => {
                  setOverlay(o => ({ ...o, open: false }));
                  if (overlay.orderId) focusOrder(overlay.orderId);
                }}
              >
                Xem đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel thông báo nhỏ (lịch sử) */}
      {!!notices.length && (
        <div className="noticeWrap">
          <div className="noticeHead">
            <div>🔔 <b>Thông báo mới</b> ({notices.length})</div>
            <div className="noticeActions">
              <button className="xbtn" onClick={clearNotices}>Đánh dấu đã đọc</button>
            </div>
          </div>
          <div className="noticeList">
            {notices.map(n => (
              <div
                className="noticeItem"
                key={n.id}
                onClick={() => n.orderId && focusOrder(n.orderId)}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{n.text}</div>
                  <div style={{ opacity: .75, fontSize: 12 }}>
                    {new Date(n.at).toLocaleString()}
                  </div>
                </div>
                <button
                  className="xbtn"
                  onClick={(e) => {
                    e.stopPropagation(); // không trigger focus khi bấm X
                    removeNotice(n.id);
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          placeholder="🔍 Tìm theo mã đơn hoặc tên sản phẩm…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 280 }}
        />
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="all">Mọi phương thức</option>
          <option value="cod">COD</option>
          <option value="momo">MoMo</option>
        </select>
      </div>

      {/* Nội dung */}
      {loading ? (
        <div className="empty">⏳ Đang tải đơn hàng…</div>
      ) : msg ? (
        <div className="empty">{msg}</div>
      ) : !filtered.length ? (
        <div className="empty">Không có đơn hàng phù hợp bộ lọc.</div>
      ) : (
        filtered.map((o) => {
          const ds = detailsOf(o);
          const total = calcTotal(o);
          const stDef = STATUS[o.status] || STATUS[0];
          const canCancel = Number(o.status) === 0 || Number(o.status) === 1;

          return (
            <div
              key={o.id}
              id={`order-${o.id}`}
              className={`card ${Number(highlightId) === Number(o.id) ? "highlight" : ""}`}
              style={{ marginBottom: 14 }}
            >
              <div className="head">
                <div className="head-left">
                  <span className="code">Mã đơn: <b>#{o.code || o.id}</b></span>
                  <span className="date">• {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</span>
                </div>
                <div className={`status ${stDef.cls}`}>{stDef.label}</div>
              </div>

              <div className="rows">
                {ds.map((d, i) => {
                  const p = d.product || {};
                  const name = p.name || d.product_name || d.name || `Sản phẩm #${d.product_id ?? d.id ?? ""}`;
                  const thumb = p.thumbnail_url || p.thumbnail || d.thumbnail_url || d.image_url || PLACEHOLDER;
                  const price = Number(d.price_buy || d.price || p.price_final || 0);
                  const qty = Number(d.qty || 0);
                  const amount = Number(d.amount ?? qty * price);

                  return (
                    <div className="row" key={i}>
                      <img className="thumb" src={thumb} alt={name} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
                      <div>
                        <div className="name">{name}</div>
                        <div className="meta">x {qty} · ₫{VND.format(price)}</div>
                      </div>
                      <div className="amount">₫{VND.format(amount)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="foot">
                <div className="foot-top">
                  <div className="payWrap">
                    <span className={`badge ${(o.payment_method || "cod") === "momo" ? "momo" : "cod"}`}>
                      {(o.payment_method || "cod").toUpperCase()}
                    </span>
                    {o.payment_status && (
                      <span className={`badge ${o.payment_status === "paid" ? "paid" : "unpaid"}`}>
                        {o.payment_status === "paid" ? "ĐÃ THANH TOÁN" : o.payment_status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="sum">
                    <span className="label">Tổng thanh toán:</span>
                    <span className="money">₫{VND.format(total || 0)}</span>
                  </div>
                </div>

                <div className="actions">
                  <button className="btn" onClick={() => addManyToCart(o)} disabled={!ds.length} title="Thêm toàn bộ sản phẩm của đơn vào giỏ">
                    Mua lại
                  </button>

                  {/* (tuỳ chọn) tạo đơn mới & thanh toán MoMo nếu chưa paid */}
                  {/* {(o.payment_method === "momo" && o.payment_status !== "paid") && (
                    <button className="btn primary" onClick={() => payMomoAgain(o)} disabled={!ds.length}>
                      Thanh toán MoMo
                    </button>
                  )} */}

                  <button className="btn danger" onClick={() => cancelOrder(o)} disabled={!canCancel} title="Hủy đơn (nếu API cho phép)">
                    Hủy đơn
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
