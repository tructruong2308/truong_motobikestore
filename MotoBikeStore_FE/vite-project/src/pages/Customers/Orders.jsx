// src/pages/Customers/Orders.jsx
import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/64x64?text=Img";
const VND = new Intl.NumberFormat("vi-VN");

// Trạng thái -> nhãn + màu
const STATUS = {
  0: { label: "Chờ xử lý", cls: "warn" },
  1: { label: "Đang xử lý", cls: "warn" },
  2: { label: "Đang giao", cls: "warn" },
  3: { label: "Hoàn thành", cls: "" },
  4: { label: "Đã hủy", cls: "muted" },
};
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "0", label: "Chờ xử lý" },
  { key: "1", label: "Đang xử lý" },
  { key: "2", label: "Đang giao" },
  { key: "3", label: "Hoàn thành" },
  { key: "4", label: "Đã hủy" },
];

const css = `
.ordersX .tabs{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px }
.ordersX .tab{ padding:8px 12px; border-radius:999px; border:1px solid var(--line);
  background:var(--panel); color:var(--text); cursor:pointer; font-weight:600 }
.ordersX .tab.active{ background:rgba(104,117,245,.14); color:#8ea2ff; border-color:rgba(104,117,245,.4) }
.ordersX .toolbar{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px }
.ordersX .toolbar input, .ordersX .toolbar select{
  height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line);
  background:var(--panel); color:var(--text)
}
.ordersX .card{ border:1px solid var(--line); border-radius:14px; background:var(--panel); overflow:hidden }
.ordersX .head{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px;
  border-bottom:1px solid var(--line); background:var(--panel-2) }
.ordersX .store{ font-weight:700; color:#e2e8f0 }
.ordersX .status{ font-weight:800; color:#34d399; background:rgba(52,211,153,.16); border:1px solid rgba(52,211,153,.35);
  padding:2px 8px; border-radius:999px }
.ordersX .status.warn{ color:#f59e0b; background:rgba(245,158,11,.14); border-color:rgba(245,158,11,.35) }
.ordersX .status.muted{ color:#94a3b8; background:rgba(148,163,184,.16); border-color:rgba(148,163,184,.35) }
.ordersX .rows{ padding:6px 12px }
.ordersX .row{ display:flex; gap:12px; padding:10px 0; border-bottom:1px dashed var(--line) }
.ordersX .row:last-child{ border-bottom:0 }
.ordersX .thumb{ width:64px; height:64px; border-radius:10px; border:1px solid var(--line); background:var(--panel-2); object-fit:cover }
.ordersX .name{ font-weight:700; color:#e5e7eb; text-decoration:none }
.ordersX .meta{ font-size:12px; opacity:.8 }
.ordersX .foot{ display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 12px; border-top:1px solid var(--line); flex-wrap:wrap }
.ordersX .total{ font-weight:800 }
.ordersX .btns{ display:flex; gap:8px; flex-wrap:wrap }
.ordersX .btn{ height:36px; padding:0 14px; border-radius:10px; border:1px solid var(--line);
  background:#0f172a; color:#e2e8f0; font-weight:700; cursor:pointer }
.ordersX .btn.primary{ background:#14532d; border-color:#14532d }
.ordersX .btn.warn{ background:#7c2d12; border-color:#7c2d12 }
.ordersX .btn:disabled{ opacity:.6; cursor:not-allowed }
.ordersX .empty{ text-align:center; padding:18px; opacity:.8 }
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

  // ===== LOAD =====
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
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "Không tải được danh sách đơn hàng");
        }
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

  // Helpers
  const detailsOf = (o) => Array.isArray(o?.details) ? o.details : (o?.items || o?.order_details || []);
  const calcTotal = (o) =>
    o.total ?? detailsOf(o).reduce((s, d) => s + Number(d.amount ?? (d.qty || 0) * (d.price_buy || 0)), 0);

  // ===== ACTIONS =====
  const addManyToCart = (o) => {
    const ds = detailsOf(o);
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    let added = 0;

    ds.forEach((d) => {
      const id = d.product_id ?? d.id;
      const p = d.product || {};
      const name = p.name || d.name || `Sản phẩm #${id}`;
      const price = Number(d.price_buy || d.price || p.price_final || 0);
      const thumb =
        p.thumbnail_url || p.thumbnail || d.thumbnail_url || d.image_url || "";

      const exist = cart.findIndex((x) => String(x.id) === String(id));
      if (exist >= 0) {
        cart[exist].qty = (cart[exist].qty || 1) + (Number(d.qty) || 1);
      } else {
        cart.push({ id, name, price, thumbnail_url: thumb, qty: Number(d.qty) || 1 });
      }
      added++;
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:refresh"));
    alert(added ? "✅ Đã thêm sản phẩm của đơn vào giỏ!" : "Không có sản phẩm hợp lệ.");
  };

  // Gọi checkout để tạo lại đơn và thanh toán MoMo
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
        name: o.name || "",
        phone: o.phone || "",
        address: o.address || "",
        email: o.email || "",
        payment_method: "momo",
        items,
      };

      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data?.message || "Tạo thanh toán MoMo thất bại");
      }
      if (data.payUrl) {
        window.open(data.payUrl, "_blank");
      } else {
        alert("✔ Đã tạo đơn mới, nhưng không nhận được payUrl.");
      }
    } catch (e) {
      alert("❌ " + (e.message || "Không thể thanh toán MoMo"));
    }
  };

  // Hủy đơn (nếu BE cho phép khách cập nhật)
  const cancelOrder = async (o) => {
    if (!confirm("Bạn muốn hủy đơn này?")) return;
    try {
      const token = localStorage.getItem("customer_token");
      const res = await fetch(`${API}/api/orders/${o.id}/status`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 4 }),
      });
      // Nếu API của bạn hiện chỉ cho admin route, ta báo lỗi thân thiện
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        alert("⚠ Không đủ quyền hủy đơn trên API hiện tại.");
        return;
      }
      if (!res.ok) throw new Error("Hủy đơn thất bại");
      // Optimistic UI
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 4 } : x)));
      alert("✅ Đã yêu cầu hủy đơn.");
    } catch (e) {
      alert("❌ " + (e.message || "Hủy đơn thất bại"));
    }
  };

  // ===== FILTERED =====
  const filtered = useMemo(() => {
    let list = [...orders];

    if (tab !== "all") list = list.filter((o) => Number(o.status) === Number(tab));

    const kw = q.trim().toLowerCase();
    if (kw) {
      list = list.filter((o) => {
        const idHit = String(o.code || o.id || "").toLowerCase().includes(kw);
        const nameHit = detailsOf(o).some((d) => {
          const p = d.product || {};
          return (p.name || d.name || "").toLowerCase().includes(kw);
        });
        return idHit || nameHit;
      });
    }

    if (month) {
      const [y, m] = month.split("-").map((x) => Number(x));
      list = list.filter((o) => {
        const t = new Date(o.created_at || 0);
        return t.getFullYear() === y && t.getMonth() + 1 === m;
      });
    }

    if (pay !== "all") list = list.filter((o) => (o.payment_method || "cod") === pay);

    list.sort(
      (a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0) || (b.id || 0) - (a.id || 0)
    );
    return list;
  }, [orders, tab, q, month, pay]);

  // ===== RENDER =====
  return (
    <div className="ordersX">
      <style>{css}</style>
      <h2 style={{ margin: "0 0 12px 0" }}>Đơn hàng của tôi</h2>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
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
          style={{ minWidth: 260 }}
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
        <div className="card" style={{ padding: 12 }}>⏳ Đang tải đơn hàng…</div>
      ) : msg ? (
        <div className="card" style={{ padding: 12 }}>{msg}</div>
      ) : !filtered.length ? (
        <div className="card empty">Không có đơn hàng phù hợp bộ lọc.</div>
      ) : (
        filtered.map((o) => {
          const ds = detailsOf(o);
          const total = calcTotal(o);
          const stDef = STATUS[o.status] || STATUS[0];
          const canPayMomo = Number(o.status) === 0 && (o.payment_method || "cod") === "momo";
          const canCancel = Number(o.status) === 0 || Number(o.status) === 1;
          const canReorder = Number(o.status) !== 2; // ví dụ cho phép hầu hết

          return (
            <div key={o.id} className="card" style={{ marginBottom: 12 }}>
              <div className="head">
                <div className="store">
                  Mã đơn: <b>#{o.code || o.id}</b>
                </div>
                <div className={`status ${stDef.cls}`}>{stDef.label}</div>
              </div>

              <div className="rows">
                {ds.map((d, i) => {
                  const p = d.product || {};
                  const name =
                    p.name || d.product_name || d.name || `Sản phẩm #${d.product_id ?? d.id ?? ""}`;
                  const thumb =
                    p.thumbnail_url || p.thumbnail || d.thumbnail_url || d.image_url || PLACEHOLDER;
                  const price = Number(d.price_buy || d.price || p.price_final || 0);
                  const qty = Number(d.qty || 0);
                  const amount = Number(d.amount ?? qty * price);

                  return (
                    <div className="row" key={i}>
                      <img
                        className="thumb"
                        src={thumb}
                        alt={name}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="name">{name}</div>
                        <div className="meta">x {qty} · ₫{VND.format(price)}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>₫{VND.format(amount)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="foot">
                <div>
                  <div>
                    <b>Thanh toán:</b> {o.payment_method || "-"}
                  </div>
                  <div>
                    <b>Ngày tạo:</b>{" "}
                    {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}
                  </div>
                </div>

                <div className="btns">
                  <button
                    className="btn"
                    onClick={() => addManyToCart(o)}
                    disabled={!canReorder || !ds.length}
                    title="Thêm toàn bộ sản phẩm của đơn vào giỏ"
                  >
                    Mua lại
                  </button>

                  <button
                    className="btn primary"
                    onClick={() => payMomoAgain(o)}
                    disabled={!ds.length}
                    title="Tạo đơn mới và thanh toán MoMo"
                  >
                    Thanh toán MoMo
                  </button>

                  <button
                    className="btn warn"
                    onClick={() => cancelOrder(o)}
                    disabled={!canCancel}
                    title="Hủy đơn (nếu API cho phép)"
                  >
                    Hủy đơn
                  </button>

                  <div className="total" style={{ marginLeft: 8 }}>
                    Tổng: <span style={{ color: "#34d399" }}>₫{VND.format(total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
