import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/60x40?text=No+Img";
const VND = new Intl.NumberFormat("vi-VN");

const styles = `
.admin-screen .card{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; }
.admin-screen table{ width:100%; border-collapse:separate; border-spacing:0; }
.admin-screen thead th{ background:var(--panel-2); border-bottom:1px solid var(--line); padding:10px; text-align:left }
.admin-screen tbody td{ padding:10px; border-bottom:1px solid var(--line-soft) }
.admin-screen .btn{ margin-top:12px; padding:6px 12px; border-radius:10px; border:1px solid var(--line); background:#1f2937; color:var(--text) }
`;

export default function OrderDetail({ id, onBack }) {
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  const getAdminToken = () => {
    try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
  };
  const handle401 = () => {
    try {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    } catch {}
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    (async () => {
      try {
        const token = getAdminToken();
        const res = await fetch(`${API_BASE}/orders/${id}`, {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.status === 401) { handle401(); return; }
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setOrder(data);
      } catch {
        setErr("Không tải được chi tiết đơn hàng.");
      }
    })();
  }, [id]);

  if (err) return <p style={{ color: "#fecaca" }}>{err}</p>;
  if (!order) return <p style={{ color: "var(--muted)" }}>Đang tải chi tiết...</p>;

  // Lấy mảng chi tiết an toàn
  const details = Array.isArray(order.details)
    ? order.details
    : (order.items || order.order_details || []);

  // Helper lấy ảnh + tên sản phẩm ổn định
  const pickThumb = (d) => {
    const p = d.product || {};
    return (
      p.thumbnail_url ||
      p.thumbnail ||
      d.thumbnail_url ||
      d.image_url ||
      d.image ||
      PLACEHOLDER
    );
  };
  const pickName = (d) => {
    const p = d.product || {};
    return (
      p.name ||
      d.product_name ||
      d.name ||
      `Sản phẩm #${d.product_id ?? d.id ?? ""}`
    );
  };

  // NEW: danh sách tên sản phẩm đã mua (loại trùng)
  const productNames = Array.from(
    new Set(
      details
        .map((d) => (pickName(d) || "").trim())
        .filter(Boolean)
    )
  );

  // Tổng tiền fallback (nếu BE không trả order.total)
  const total = order.total ?? details.reduce(
    (s, d) => s + Number(d.amount ?? (d.qty || 0) * (d.price_buy || 0)),
    0
  );

  return (
    <section className="admin-screen">
      <style>{styles}</style>
      <div className="card">
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Đơn hàng #{order.id}</h2>

        <div style={{ marginBottom: 16 }}>
          <p><b>Khách hàng:</b> {order.name || "—"}</p>
          <p><b>Email:</b> {order.email || "—"}</p>
          <p><b>Điện thoại:</b> {order.phone || "—"}</p>
          <p><b>Địa chỉ:</b> {order.address || "—"}</p>
          {/* NEW: hiển thị tên các sản phẩm đã mua */}
          <p>
            <b>Sản phẩm đã mua:</b>{" "}
            {productNames.length ? productNames.join(", ") : "—"}
          </p>
        </div>

        <h3>Chi tiết sản phẩm</h3>
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th align="right">Giá</th>
              <th align="center">SL</th>
              <th align="right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d) => {
              const name = pickName(d);
              const thumb = pickThumb(d);
              const price = Number(d.price_buy || d.price || 0);
              const qty = Number(d.qty || 0);
              const amount = Number(d.amount ?? qty * price);

              return (
                <tr key={d.id ?? `${d.product_id}-${Math.random()}`}>
                  <td>
                    <img
                      src={thumb}
                      alt={name}
                      style={{
                        width: 46, height: 34, objectFit: "cover",
                        marginRight: 8, verticalAlign: "middle", borderRadius: 6
                      }}
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    />
                    <span style={{ fontWeight: 600 }}>{name}</span>
                  </td>
                  <td align="right">₫{VND.format(price)}</td>
                  <td align="center">{qty}</td>
                  <td align="right">₫{VND.format(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p style={{ marginTop: 16, fontWeight: "bold", fontSize: 16 }}>
          Tổng tiền: ₫{VND.format(total || 0)}
        </p>

        {onBack && <button className="btn" onClick={onBack}>← Quay lại</button>}
      </div>
    </section>
  );
}
