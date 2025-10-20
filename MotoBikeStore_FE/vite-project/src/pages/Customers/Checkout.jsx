// src/pages/Customers/Checkout.jsx
import { useEffect, useMemo, useState } from "react";

const VND = new Intl.NumberFormat("vi-VN");
const API_BASE = "http://127.0.0.1:8000/api";

/* ====== Local helpers ====== */
const LS_ADDR = "customer_addresses";          // danh sách địa chỉ đã lưu
const LS_CHECKED = "checkout_selected_ids";    // id sản phẩm được chọn thanh toán

const loadAddresses = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_ADDR) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};
const saveAddresses = (list) => localStorage.setItem(LS_ADDR, JSON.stringify(list));

export default function Checkout({ cart = [], setCart }) {
  /* =================== STATE =================== */
  // danh sách id đã chọn từ trang Cart (nếu trống => thanh toán cả giỏ)
  const selectedIds = useMemo(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_CHECKED) || "[]");
      return new Set(arr.map(String));
    } catch { return new Set(); }
  }, []);

  // giỏ thực sự đem đi thanh toán
  const cartForCheckout = useMemo(
    () => (selectedIds.size ? cart.filter(x => selectedIds.has(String(x.id))) : cart),
    [cart, selectedIds]
  );

  // user & form
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    payment_method: "cod", // cod | momo
  });

  // địa chỉ đã lưu & chọn nhanh
  const [addresses, setAddresses] = useState(loadAddresses());
  const [addrIndex, setAddrIndex] = useState(-1); // -1 = nhập tay

  // vận chuyển & mã giảm giá
  const [ship, setShip] = useState("standard"); // standard|fast|express
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // {code, type, value, desc}

  // hệ thống
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* =================== INIT USER =================== */
  useEffect(() => {
    const uStr = localStorage.getItem("customer_user") || localStorage.getItem("user");
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
    const token = localStorage.getItem("customer_token") || localStorage.getItem("token");
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

  // đồng bộ giỏ (để header/tab khác biết)
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart || []));
    window.dispatchEvent(new Event("cart:refresh"));
  }, [cart]);

  /* =================== TÍNH TIỀN =================== */
  const subTotal = useMemo(
    () => cartForCheckout.reduce((s, i) => s + (i.qty || 1) * Number(i.price || 0), 0),
    [cartForCheckout]
  );

  const shippingFee = useMemo(() => {
    switch (ship) {
      case "fast": return 25000;
      case "express": return 50000;
      default: return 0;
    }
  }, [ship]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const code = appliedCoupon.code.toUpperCase();
    // Demo luật (FE): GIAM10 (10%), GIAM50K (-50k), FREESHIP (miễn phí ship)
    if (code === "GIAM10") return Math.floor(subTotal * 0.10);
    if (code === "GIAM50K") return Math.min(50000, subTotal);
    if (code === "FREESHIP") return 0; // giảm ở ship, không trừ subtotal
    return 0;
  }, [appliedCoupon, subTotal]);

  const shipAfterCoupon = useMemo(() => {
    if (!appliedCoupon) return shippingFee;
    return appliedCoupon.code?.toUpperCase() === "FREESHIP" ? 0 : shippingFee;
  }, [appliedCoupon, shippingFee]);

  const grandTotal = useMemo(
    () => Math.max(0, subTotal - discount) + shipAfterCoupon,
    [subTotal, discount, shipAfterCoupon]
  );

  // MoMo sandbox: 1.000 – 50.000.000
  const momoDisabled = grandTotal < 1000 || grandTotal > 50_000_000;
  const momoReason =
    grandTotal > 50_000_000
      ? "MoMo sandbox chỉ cho phép ≤ 50.000.000đ/giao dịch."
      : "Tổng thanh toán MoMo phải ≥ 1.000đ.";

  /* =================== ĐỊA CHỈ =================== */
  const pickSavedAddress = (i) => {
    setAddrIndex(i);
    if (i >= 0 && addresses[i]) {
      const a = addresses[i];
      setForm((f) => ({
        ...f,
        customer_name: a.name || f.customer_name,
        phone: a.phone || f.phone,
        email: a.email || f.email,
        address: a.address || f.address,
      }));
    }
  };

  const saveCurrentAsDefault = () => {
    const a = {
      name: form.customer_name?.trim(),
      phone: form.phone?.trim(),
      email: form.email?.trim(),
      address: form.address?.trim(),
      updated_at: Date.now(),
    };
    if (!a.name || !a.phone || !a.address) {
      alert("Vui lòng nhập Họ tên, SĐT và Địa chỉ trước khi lưu.");
      return;
    }
    const list = [a, ...addresses.filter(x =>
      x.name !== a.name || x.phone !== a.phone || x.address !== a.address
    )].slice(0, 5); // lưu tối đa 5 mẫu
    setAddresses(list);
    saveAddresses(list);
    setAddrIndex(0);
    alert("✅ Đã lưu địa chỉ mặc định.");
  };

  /* =================== COUPON =================== */
  const applyCoupon = () => {
    const code = (coupon || "").trim().toUpperCase();
    if (!code) return setAppliedCoupon(null);

    // Luật demo (FE). Nếu BE của bạn có endpoint /coupons/validate, bạn có thể gọi ở đây.
    if (["GIAM10", "GIAM50K", "FREESHIP"].includes(code)) {
      const map = {
        GIAM10: { desc: "Giảm 10% tổng hàng", type: "percent", value: 10 },
        GIAM50K: { desc: "Giảm 50.000đ", type: "fixed", value: 50000 },
        FREESHIP: { desc: "Miễn phí vận chuyển", type: "ship", value: 0 },
      };
      setAppliedCoupon({ code, ...map[code] });
      setMsg("✅ Đã áp dụng mã " + code);
    } else {
      setAppliedCoupon(null);
      setMsg("❌ Mã không hợp lệ.");
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCoupon("");
  };

  /* =================== SUBMIT =================== */
  const submit = async () => {
    setMsg("");

    if (!form.customer_name || !form.phone || !form.address) {
      setMsg("Vui lòng nhập đủ Họ tên, SĐT và Địa chỉ.");
      return;
    }
    if (!cartForCheckout.length) {
      setMsg("Không có sản phẩm nào để thanh toán.");
      return;
    }
    if (form.payment_method === "momo" && momoDisabled) {
      setMsg("❌ " + momoReason);
      return;
    }

    const items = cartForCheckout.map((i) => {
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
      // Thông tin khách
      name: form.customer_name,
      phone: form.phone,
      email: form.email || null,
      address: form.address,
      note: form.note || null,

      // Tổng tiền
      subtotal: Math.round(subTotal) || 0,
      discount: Math.round(discount) || 0,
      shipping_method: ship,
      shipping_fee: Math.round(shipAfterCoupon) || 0,
      total: Math.round(grandTotal) || 0,

      // Items
      items,
      order_details: items,

      // Nhân bản theo BE cũ
      customer_name: form.customer_name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      customer_address: form.address,
      customer_note: form.note || null,
      customer_total: Math.round(grandTotal) || 0,

      // Thanh toán
      payment_method: form.payment_method,

      // Coupon
      coupon_code: appliedCoupon?.code || null,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("customer_token") || localStorage.getItem("token");

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
        const details = data?.errors
          ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
          : null;
        throw new Error(data?.message || details || `HTTP ${res.status}`);
      }

      if (form.payment_method === "momo" && data?.payUrl) {
        localStorage.removeItem(LS_CHECKED);
        // Không xoá giỏ — chờ IPN xác nhận
        window.location.href = data.payUrl;
        return;
      }

      // COD: xoá đúng phần đã thanh toán
      const nextCart =
        selectedIds.size === 0
          ? []
          : cart.filter((x) => !selectedIds.has(String(x.id)));

      setCart(nextCart);
      localStorage.setItem("cart", JSON.stringify(nextCart));
      localStorage.removeItem(LS_CHECKED);
      window.dispatchEvent(new Event("cart:refresh"));

      setMsg("✅ Đặt hàng thành công!");
    } catch (e) {
      setMsg(`❌ Lỗi: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  /* =================== UI (Shopee-ish) =================== */
  const css = `
.co-shell{display:grid;grid-template-columns:1.5fr .9fr;gap:16px}
@media (max-width: 1024px){.co-shell{grid-template-columns:1fr}}
.card{border:1px solid rgba(148,163,184,.18);border-radius:14px;background:#0b1320}
.card-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(2,6,23,.35);border-top-left-radius:14px;border-top-right-radius:14px}
.card-bd{padding:14px}
.tag{display:inline-flex;gap:6px;align-items:center;padding:4px 10px;border:1px solid rgba(148,163,184,.25);border-radius:999px;background:rgba(2,6,23,.35);font-size:12px;color:#cbd5e1;font-weight:700}
.addr-grid{display:grid;gap:10px}
.item{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center}
.item .thumb{width:64px;height:64px;border-radius:12px;object-fit:cover;border:1px solid rgba(148,163,184,.18);background:#0f172a}
.item .name{font-weight:700;line-height:1.3}
.line{border-top:1px dashed rgba(148,163,184,.2);margin:12px 0}
.row{display:flex;gap:10px;flex-wrap:wrap}
.row.between{justify-content:space-between}
.price{font-weight:800}
.pm-row{display:grid;gap:8px;margin-top:8px}
.note{width:100%;min-height:100px}
.sum{display:grid;gap:8px}
.sum .r{display:flex;justify-content:space-between}
.sum .total{font-size:20px;font-weight:900;color:#34d399}
.bar{position:sticky;bottom:12px;display:flex;gap:12px;align-items:center;justify-content:flex-end;padding:14px;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:linear-gradient(180deg, rgba(2,6,23,.6), rgba(2,6,23,.45));backdrop-filter:blur(6px)}
.btn{height:40px;padding:0 16px;border-radius:10px;border:1px solid rgba(148,163,184,.25);background:#0f172a;color:#e2e8f0;font-weight:800;cursor:pointer}
.btn.primary{background:#14532d;border-color:#14532d}
.warn{color:#f59e0b}
.muted{color:#94a3b8}
.input{min-width:240px}
.coupon{display:flex;gap:8px;align-items:center}
  `;

  return (
    <div className="checkoutX">
      <style>{css}</style>
      <h1 style={{ margin: 0, marginBottom: 8 }}>Thanh toán</h1>

      <div className="co-shell">
        {/* ========== Cột trái ========== */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* Địa chỉ nhận hàng */}
          <div className="card">
            <div className="card-hd">
              <b>Địa chỉ nhận hàng</b>
              <span className="tag">Bắt buộc</span>
            </div>
            <div className="card-bd addr-grid">
              {/* Chọn nhanh địa chỉ đã lưu */}
              <div className="row between">
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={addrIndex}
                    onChange={(e) => pickSavedAddress(parseInt(e.target.value, 10))}
                    className="u-input"
                    style={{ maxWidth: 320 }}
                  >
                    <option value={-1}>— Nhập địa chỉ mới —</option>
                    {addresses.map((a, i) => (
                      <option key={i} value={i}>
                        {a.name} · {a.phone} · {a.address.slice(0, 40)}{a.address.length > 40 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                  <button className="btn" onClick={saveCurrentAsDefault}>Lưu làm mặc định</button>
                </div>
                {!!addresses.length && <span className="tag">{addresses.length} mẫu đã lưu</span>}
              </div>

              <div className="row">
                <input
                  className="u-input input"
                  placeholder="Họ tên"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                />
                <input
                  className="u-input input"
                  placeholder="Số điện thoại"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <input
                className="u-input"
                placeholder="Địa chỉ"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <div className="row">
                <input
                  className="u-input input"
                  placeholder="Email (tuỳ chọn)"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <span className="tag">Thông báo đơn hàng sẽ gửi qua email (nếu có)</span>
              </div>
            </div>
          </div>

          {/* Sản phẩm */}
          <div className="card">
            <div className="card-hd">
              <b>Sản phẩm</b>
              {selectedIds.size > 0 ? (
                <span className="tag">Chỉ thanh toán {cartForCheckout.length} mục đã chọn</span>
              ) : (
                <span className="tag">Không chọn mục nào — thanh toán toàn bộ giỏ</span>
              )}
            </div>
            <div className="card-bd" style={{ display: "grid", gap: 10 }}>
              {cartForCheckout.map((i) => {
                const qty = Number(i.qty || 1);
                const price = Number(i.price || 0);
                return (
                  <div className="item" key={i.id}>
                    <img
                      className="thumb"
                      src={i.thumbnail_url || "https://placehold.co/64x64?text=No+Img"}
                      onError={(e) =>
                        (e.currentTarget.src = "https://placehold.co/64x64?text=No+Img")
                      }
                    />
                    <div>
                      <div className="name">{i.name}</div>
                      <div className="muted">x {qty}</div>
                    </div>
                    <div className="price">{VND.format(qty * price)}₫</div>
                  </div>
                );
              })}
              {!cartForCheckout.length && (
                <div className="muted">Chưa có sản phẩm nào. Hãy quay lại giỏ hàng nhé.</div>
              )}
            </div>
          </div>
        </div>

        {/* ========== Cột phải ========== */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* Phương thức & vận chuyển */}
          <div className="card">
            <div className="card-hd"><b>Thanh toán & Vận chuyển</b></div>
            <div className="card-bd" style={{ display: "grid", gap: 14 }}>
              <div>
                <b>Phương thức thanh toán</b>
                <div className="pm-row">
                  <label>
                    <input
                      type="radio"
                      name="pm"
                      checked={form.payment_method === "cod"}
                      onChange={() => setForm({ ...form, payment_method: "cod" })}
                    />{" "}
                    Thanh toán khi nhận hàng (COD)
                  </label>
                  <label title={momoDisabled ? momoReason : ""} style={{ opacity: momoDisabled ? 0.7 : 1 }}>
                    <input
                      type="radio"
                      name="pm"
                      checked={form.payment_method === "momo"}
                      onChange={() => setForm({ ...form, payment_method: "momo" })}
                      disabled={momoDisabled}
                    />{" "}
                    Ví MoMo / QR online {momoDisabled && <span className="tag warn">{momoReason}</span>}
                  </label>
                </div>
              </div>

              <div className="line" />

              <div>
                <b>Chọn hình thức vận chuyển</b>
                <div className="pm-row">
                  <label>
                    <input type="radio" name="ship" value="standard" checked={ship === "standard"} onChange={(e) => setShip(e.target.value)} />{" "}
                    Tiêu chuẩn — {VND.format(0)}₫
                  </label>
                  <label>
                    <input type="radio" name="ship" value="fast" checked={ship === "fast"} onChange={(e) => setShip(e.target.value)} />{" "}
                    Nhanh — {VND.format(25000)}₫
                  </label>
                  <label>
                    <input type="radio" name="ship" value="express" checked={ship === "express"} onChange={(e) => setShip(e.target.value)} />{" "}
                    Hoả tốc — {VND.format(50000)}₫
                  </label>
                </div>
              </div>

              <div className="line" />

              <div>
                <b>Mã giảm giá</b>
                <div className="coupon">
                  <input
                    className="u-input"
                    placeholder="Nhập mã (GIAM10 / GIAM50K / FREESHIP)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn" onClick={applyCoupon}>Áp dụng</button>
                  {appliedCoupon && <button className="btn" onClick={clearCoupon}>Huỷ mã</button>}
                </div>
                {appliedCoupon && (
                  <div style={{ marginTop: 8 }}>
                    <span className="tag">Đã áp dụng: <b>{appliedCoupon.code}</b> — {appliedCoupon.desc}</span>
                  </div>
                )}
              </div>

              <div className="line" />

              <div>
                <b>Lời nhắn cho shop</b>
                <textarea
                  className="u-input note"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến…"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Hoá đơn */}
          <div className="card">
            <div className="card-hd"><b>Hoá đơn</b></div>
            <div className="card-bd sum">
              <div className="r"><span>Tạm tính</span><span>{VND.format(subTotal)}₫</span></div>
              <div className="r"><span>Giảm giá</span><span>-{VND.format(discount)}₫</span></div>
              <div className="r"><span>Phí vận chuyển</span><span>{VND.format(shipAfterCoupon)}₫</span></div>
              <div className="line" />
              <div className="r"><span>Tổng thanh toán</span><span className="total">{VND.format(grandTotal)}₫</span></div>
            </div>
          </div>

          {/* Thanh xác nhận */}
          <div className="bar">
            {msg && <div className="tag" style={{ background: "rgba(6,78,59,.25)" }}>{msg}</div>}
            <button
              className="btn primary"
              onClick={submit}
              disabled={loading || !cartForCheckout.length}
            >
              {loading ? "Đang xử lý…" : form.payment_method === "momo" ? "Thanh toán MoMo" : "Đặt hàng COD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
