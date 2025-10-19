// src/pages/Customers/Checkout.jsx
import { useEffect, useMemo, useState } from "react";

const VND = new Intl.NumberFormat("vi-VN");
const API_BASE = "http://127.0.0.1:8000/api";

export default function Checkout({ cart = [], setCart }) {
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    payment_method: "cod", // NEW: cod | momo
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ TỰ ĐIỀN THÔNG TIN KHÁCH HÀNG
  useEffect(() => {
    const uStr = localStorage.getItem("user");
    if (uStr) {
      const u = JSON.parse(uStr);
      setForm((f) => ({
        ...f,
        customer_name: u.name || f.customer_name,
        phone: u.phone || u.sdt || f.phone,
        email: u.email || f.email,
        address: u.address || f.address,
      }));
    }
    // (tuỳ chọn) gọi /api/me để lấy dữ liệu mới nhất
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE}/me`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          const p = d?.data || d;
          if (!p) return;
          setForm((f) => ({
            ...f,
            customer_name: p.name ?? f.customer_name,
            phone: p.phone ?? p.sdt ?? f.phone,
            email: p.email ?? f.email,
            address: p.address ?? f.address,
          }));
        })
        .catch(() => {});
    }
  }, []);

  // Đồng bộ giỏ -> localStorage (để tab khác/header biết)
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart || []));
    window.dispatchEvent(new Event("cart:refresh"));
  }, [cart]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + (i.qty || 1) * Number(i.price || 0), 0),
    [cart]
  );

  const submit = async () => {
    setMsg("");

    if (!form.customer_name || !form.phone || !form.address) {
      setMsg("Vui lòng nhập đủ Họ tên, SĐT và Địa chỉ.");
      return;
    }

    // Chuẩn hoá items (đúng y bạn viết)
    const items = cart.map((i) => {
      const q = Number(i.qty || 1);
      const p = Number(i.price || 0);
      return {
        id: i.id,
        product_id: i.id,
        name: i.name,
        thumbnail: i.thumbnail_url || null,
        qty: q,
        quantity: q,
        price: p,
        unit_price: p,
        total: q * p,
      };
    });

    const payload = {
      name: form.customer_name,
      phone: form.phone,
      email: form.email || null,
      address: form.address,
      note: form.note || null,
      total: Math.round(total) || 0,
      status: 1,
      items,
      order_details: items,

      customer_name: form.customer_name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      customer_address: form.address,
      customer_note: form.note || null,
      customer_total: Math.round(total) || 0,

      payment_method: form.payment_method, // NEW: gửi phương thức thanh toán
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/checkout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await res.json(); } catch {}

      if (res.status === 401) {
        setMsg("Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }

      if (!res.ok || data?.success === false) {
        const details =
          data?.errors
            ? Object.entries(data.errors)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join(" | ")
            : null;
        const apiMsg = data?.message || details || `HTTP ${res.status}`;
        throw new Error(apiMsg);
      }

      // NEW: nếu thanh toán online, BE sẽ trả payUrl để chuyển trang
      if (form.payment_method === "momo" && data?.payUrl) {
        // không clear giỏ ngay, chờ ipn/return xác nhận
        window.location.href = data.payUrl;
        return;
      }

      // COD
      setMsg("✅ Đặt hàng thành công!");
      setCart([]);                // clear state
      localStorage.removeItem("cart"); // clear localStorage
      window.dispatchEvent(new Event("cart:refresh")); // 🔔 thông báo cho Cart/Header
    } catch (e) {
      setMsg(`❌ Lỗi: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="u-grid" style={{ gap: 16 }}>
      <h1 style={{ margin: 0 }}>Thanh toán</h1>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.2fr .8fr" }}>
        {/* Form */}
        <div className="u-card u-border" style={{ padding: 16, display: "grid", gap: 10 }}>
          <input
            className="u-input"
            placeholder="Họ tên"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          />
          <input
            className="u-input"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="u-input"
            placeholder="Email (tuỳ chọn)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="u-input"
            placeholder="Địa chỉ"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <textarea
            className="u-input"
            placeholder="Ghi chú"
            rows={4}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          {/* NEW: Chọn phương thức thanh toán */}
          <div className="u-card u-border" style={{ padding: 12 }}>
            <b>Phương thức thanh toán</b>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <label>
                <input
                  type="radio"
                  name="pm"
                  checked={form.payment_method === "cod"}
                  onChange={() => setForm({ ...form, payment_method: "cod" })}
                />{" "}
                Thanh toán khi nhận hàng (COD)
              </label>
              <label>
                <input
                  type="radio"
                  name="pm"
                  checked={form.payment_method === "momo"}
                  onChange={() => setForm({ ...form, payment_method: "momo" })}
                />{" "}
                Ví MoMo / QR online
              </label>
            </div>
          </div>

          {msg && (
            <div
              className="u-card u-border"
              style={{ padding: 10, color: msg.startsWith("✅") ? "#6fe0b1" : "#ff9b9b" }}
            >
              {msg}
            </div>
          )}

          <button className="u-btn" onClick={submit} disabled={loading}>
            {loading ? "Đang gửi…" : "Đặt hàng"}
          </button>
        </div>

        {/* Summary */}
        <div className="u-card u-border" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Tóm tắt đơn</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {cart.map((i) => (
              <div
                key={i.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <img
                  src={i.thumbnail_url || "https://placehold.co/60x40?text=No+Img"}
                  style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 8 }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>{i.name}</div>
                  <div className="u-chip">
                    x{i.qty || 1} · {VND.format(i.price || 0)}₫
                  </div>
                </div>
                <div style={{ fontWeight: 800 }}>
                  {VND.format((i.qty || 1) * (i.price || 0))}₫
                </div>
              </div>
            ))}
          </div>
          <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
            <div>Tổng cộng</div>
            <div>{VND.format(total)}₫</div>
          </div>
        </div>
      </div>
    </div>
  );
}
