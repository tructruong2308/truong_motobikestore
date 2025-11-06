// src/pages/Customers/Checkout.jsx
import { useEffect, useMemo, useState } from "react";

const VND = new Intl.NumberFormat("vi-VN");
const API_BASE = import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000/api";

/* ====== Local helpers ====== */
const LS_ADDR    = "customer_addresses";
const LS_CHECKED = "checkout_selected_ids";
const LS_COUPON  = "checkout_applied_coupon";

// ép tiền về số nguyên an toàn
const toInt = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (v == null) return 0;
  const s = String(v).replace(/[^\d-]/g, "");
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

const loadAddresses = () => {
  try { const arr = JSON.parse(localStorage.getItem(LS_ADDR) || "[]"); return Array.isArray(arr) ? arr : []; }
  catch { return []; }
};
const saveAddresses   = (list) => localStorage.setItem(LS_ADDR, JSON.stringify(list));
const saveAppliedCoupon = (obj) => localStorage.setItem(LS_COUPON, JSON.stringify(obj || null));
const loadAppliedCoupon = () => { try { return JSON.parse(localStorage.getItem(LS_COUPON) || "null"); } catch { return null; } };
const clearSavedCoupon  = () => localStorage.removeItem(LS_COUPON);

/* ====== Voucher Drawer (inline component) ====== */
function VoucherDrawer({ open, onClose, subtotal, onPickCode }) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [best, setBest] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      setErr(""); setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/coupons/claimable?subtotal=${toInt(subtotal)}`, {
          headers: { Accept: "application/json" }
        });
        const data = await res.json().catch(()=> ({}));
        setList(Array.isArray(data?.coupons) ? data.coupons : []);
        setBest(data?.best || null);
      } catch {
        setErr("Không tải được danh sách voucher.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, subtotal]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      {/* Panel LIGHT */}
      <div style={{
        width: "100%", maxWidth: 420, height: "100%", background: "#ffffff", color: "#0f172a",
        borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column"
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc"
        }}>
          <b>Chọn mã giảm giá</b>
          <button className="btn" onClick={onClose}>Đóng</button>
        </div>

        <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
          {loading && <div className="tag">Đang tải voucher…</div>}
          {err && <div className="tag warn">{err}</div>}

          {best?.estimate_discount > 0 && (
            <button className="btn primary" style={{ width: "100%", marginBottom: 12 }}
              onClick={() => onPickCode(best.code)}>
              Áp dụng tốt nhất: {best.code} (−{VND.format(Math.round(best.estimate_discount))}₫)
            </button>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {/* Đủ điều kiện */}
            {list.filter(x => x.eligible).map(v => (
              <div key={v.code} className="card" style={{ borderColor: "#86efac" }}>
                <div className="card-bd" style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {v.code} {v.badge && <span className="tag" style={{ marginLeft: 8 }}>{v.badge}</span>}
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {v.label} • ĐH tối thiểu {VND.format(v.min_order)}₫
                      </div>
                    </div>
                    <button className="btn" onClick={() => onPickCode(v.code)}>Áp dụng</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Chưa đủ điều kiện */}
            {list.some(x => !x.eligible) && <div className="muted" style={{ marginTop: 8 }}>Chưa đủ điều kiện</div>}
            {list.filter(x => !x.eligible).map(v => (
              <div key={v.code} className="card">
                <div className="card-bd" style={{ display: "grid", gap: 6, opacity: .9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{v.code}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {v.label} • Thiếu {VND.format(Math.ceil(v.lack))}₫
                      </div>
                    </div>
                    <button className="btn" disabled>Chưa đạt</button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && list.length === 0 && (<div className="muted">Hiện chưa có mã phù hợp để hiển thị.</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout({ cart = [], setCart }) {
  /* =================== STATE =================== */
  const selectedIds = useMemo(() => {
    try { const arr = JSON.parse(localStorage.getItem(LS_CHECKED) || "[]"); return new Set(arr.map(String)); }
    catch { return new Set(); }
  }, []);

  const cartForCheckout = useMemo(
    () => (selectedIds.size ? cart.filter(x => selectedIds.has(String(x.id))) : cart),
    [cart, selectedIds]
  );

  // user & form
  const [form, setForm] = useState({
    customer_name: "", phone: "", email: "", address: "", note: "", payment_method: "cod",
  });

  // địa chỉ & ship & coupon
  const [addresses, setAddresses] = useState(loadAddresses());
  const [addrIndex, setAddrIndex] = useState(-1);
  const [ship, setShip] = useState("standard");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // {code, discount_from_be, be, desc}

  // drawer + gợi ý tốt nhất
  const [openVoucher, setOpenVoucher] = useState(false);
  const [bestHint, setBestHint] = useState(null); // {code, off}

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

  // đồng bộ giỏ
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart || []));
    window.dispatchEvent(new Event("cart:refresh"));
  }, [cart]);

  /* =================== TÍNH TIỀN =================== */
  const subTotal = useMemo(
    () => cartForCheckout.reduce((s, i) => s + (toInt(i.qty) || 1) * toInt(i.price), 0),
    [cartForCheckout]
  );

  const shippingFee = useMemo(() => (ship === "fast" ? 25000 : ship === "express" ? 50000 : 0), [ship]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const d = toInt(appliedCoupon.discount_from_be);
    return Math.min(d, subTotal);
  }, [appliedCoupon, subTotal]);

  const shipAfterCoupon = shippingFee; // chưa hỗ trợ freeship
  const grandTotal = useMemo(
    () => Math.max(0, subTotal - discount) + shipAfterCoupon,
    [subTotal, discount, shipAfterCoupon]
  );

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
    )].slice(0, 5);
    setAddresses(list);
    saveAddresses(list);
    setAddrIndex(0);
    alert("✅ Đã lưu địa chỉ mặc định.");
  };

  /* =================== COUPON =================== */
  const validateCoupon = async (code, currentSubtotal) => {
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) throw new Error("EMPTY");
    const token = localStorage.getItem("customer_token") || localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code: cleanCode, subtotal: toInt(currentSubtotal) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.valid) {
      const reason = data?.reason || "Mã không hợp lệ";
      const err = new Error(reason);
      err.code = "INVALID";
      throw err;
    }
    return {
      code: cleanCode,
      desc: "Áp dụng từ máy chủ",
      discount_from_be: toInt(data.discount || 0),
      be: data.data,
    };
  };

  const applyCoupon = async () => {
    const code = (coupon || "").trim().toUpperCase();
    if (!code) { setAppliedCoupon(null); clearSavedCoupon(); setMsg(""); return; }
    try {
      setMsg("Đang kiểm tra mã…");
      const result = await validateCoupon(code, subTotal);
      setAppliedCoupon(result);
      saveAppliedCoupon(result);
      setMsg(`✅ Đã áp dụng ${result.code}: -${VND.format(result.discount_from_be)}₫`);
    } catch (e) {
      setAppliedCoupon(null);
      clearSavedCoupon();
      setMsg("❌ " + (e?.message || "Mã không hợp lệ"));
    }
  };

  const applyCouponFromDrawer = async (code) => {
    setOpenVoucher(false);
    setCoupon(code);
    try {
      setMsg("Đang kiểm tra mã…");
      const result = await validateCoupon(code, subTotal);
      setAppliedCoupon(result);
      saveAppliedCoupon(result);
      setMsg(`✅ Đã áp dụng ${result.code}: -${VND.format(result.discount_from_be)}₫`);
    } catch (e) {
      setAppliedCoupon(null);
      clearSavedCoupon();
      setMsg("❌ " + (e?.message || "Mã không hợp lệ"));
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCoupon("");
    clearSavedCoupon();
    setMsg("Đã huỷ mã giảm giá.");
  };

  // F5 tự áp lại mã
  useEffect(() => {
    const saved = loadAppliedCoupon();
    if (!saved?.code) return;
    setCoupon(saved.code);
    validateCoupon(saved.code, subTotal)
      .then((r) => { setAppliedCoupon(r); saveAppliedCoupon(r); })
      .catch(() => { setAppliedCoupon(null); clearSavedCoupon(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // subtotal thay đổi → re-validate
  useEffect(() => {
    if (!appliedCoupon?.code) return;
    validateCoupon(appliedCoupon.code, subTotal)
      .then((r) => { setAppliedCoupon(r); saveAppliedCoupon(r); })
      .catch(() => { setAppliedCoupon(null); clearSavedCoupon(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTotal]);

  // Gợi ý mã tốt nhất (ngoài Drawer)
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        if (subTotal <= 0) { setBestHint(null); return; }
        const res = await fetch(`${API_BASE}/coupons/claimable?subtotal=${toInt(subTotal)}`, {
          headers: { Accept: "application/json" }
        });
        const data = await res.json().catch(()=> ({}));
        if (stop) return;
        if (data?.best?.estimate_discount > 0) {
          setBestHint({ code: data.best.code, off: Math.round(data.best.estimate_discount) });
        } else setBestHint(null);
      } catch { setBestHint(null); }
    })();
    return () => { stop = true; };
  }, [subTotal]);

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
      const q = toInt(i.qty || 1);
      const p = toInt(i.price || 0);
      return { id: i.id, product_id: i.id, name: i.name, thumbnail: i.thumbnail_url || null,
        qty: q, quantity: q, price: p, unit_price: p, total: q * p };
    });

    const payload = {
      name: form.customer_name, phone: form.phone, email: form.email || null, address: form.address, note: form.note || null,
      subtotal: toInt(subTotal), discount: toInt(discount), shipping_method: ship,
      shipping_fee: toInt(shipAfterCoupon), total: toInt(grandTotal),
      items, order_details: items,
      customer_name: form.customer_name, customer_phone: form.phone, customer_email: form.email || null,
      customer_address: form.address, customer_note: form.note || null, customer_total: toInt(grandTotal),
      payment_method: form.payment_method,
      coupon_code: appliedCoupon?.code || null,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("customer_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/checkout`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await res.json(); } catch {}

      if (res.status === 401) { setMsg("Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại."); return; }
      if (!res.ok || data?.success === false) {
        const details = data?.errors ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ") : null;
        throw new Error(data?.message || details || `HTTP ${res.status}`);
      }

      if (form.payment_method === "momo" && data?.payUrl) {
        localStorage.removeItem(LS_CHECKED);
        window.location.href = data.payUrl;
        return;
      }

      const nextCart = selectedIds.size === 0 ? [] : cart.filter((x) => !selectedIds.has(String(x.id)));
      setCart(nextCart);
      localStorage.setItem("cart", JSON.stringify(nextCart));
      localStorage.removeItem(LS_CHECKED);
      window.dispatchEvent(new Event("cart:refresh"));

      // clear coupon sau khi đặt thành công
      clearCoupon();

      setMsg("✅ Đặt hàng thành công!");
    } catch (e) {
      setMsg(`❌ Lỗi: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  /* =================== UI =================== */
  const css = `
:root{--border:#e5e7eb;--text:#0f172a;--muted:#64748b}
.co-shell{display:grid;grid-template-columns:1.5fr .9fr;gap:16px}
@media (max-width:1024px){.co-shell{grid-template-columns:1fr}}
.card{border:1px solid var(--border);border-radius:14px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.card-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);background:#f8fafc;border-top-left-radius:14px;border-top-right-radius:14px;color:var(--text)}
.card-bd{padding:14px;color:var(--text)}
.tag{display:inline-flex;gap:6px;align-items:center;padding:4px 10px;border:1px solid var(--border);border-radius:999px;background:#f1f5f9;font-size:12px;color:var(--text);font-weight:700}
.addr-grid{display:grid;gap:10px}
.item{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center}
.item .thumb{width:64px;height:64px;border-radius:12px;object-fit:cover;border:1px solid var(--border);background:#ffffff}
.item .name{font-weight:700;line-height:1.3;color:var(--text)}
.line{border-top:1px dashed var(--border);margin:12px 0}
.row{display:flex;gap:10px;flex-wrap:wrap}
.row.between{justify-content:space-between}
.price{font-weight:800;color:var(--text)}
.pm-row{display:grid;gap:8px;margin-top:8px;color:var(--text)}
.note{width:100%;min-height:100px}
.sum{display:grid;gap:8px;color:var(--text)}
.sum .r{display:flex;justify-content:space-between}
.sum .total{font-size:20px;font-weight:900;color:#16a34a}
.bar{position:sticky;bottom:12px;display:flex;gap:12px;align-items:center;justify-content:flex-end;padding:14px;border:1px solid var(--border);border-radius:14px;background:#ffffff;box-shadow:0 8px 30px rgba(17,24,39,.06)}
.btn{height:40px;padding:0 16px;border-radius:10px;border:1px solid var(--border);background:#ffffff;color:var(--text);font-weight:800;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.btn.primary{background:linear-gradient(180deg,#34d399,#10b981);border-color:#10b981;color:#ffffff;box-shadow:0 6px 18px rgba(16,185,129,.25)}
.warn{color:#b45309}
.muted{color:var(--muted)}
.input{min-width:240px}
.coupon{display:flex;gap:8px;align-items:center}
.hint{display:flex;gap:8px;align-items:center;margin-top:8px}
  `;

  return (
    <div className="checkoutX" style={{ color: "#0f172a" }}>
      <style>{css}</style>
      <h1 style={{ margin: 0, marginBottom: 8, color: "#0f172a" }}>Thanh toán</h1>

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
                <input className="u-input input" placeholder="Họ tên"
                  value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}/>
                <input className="u-input input" placeholder="Số điện thoại"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/>
              </div>
              <input className="u-input" placeholder="Địa chỉ"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/>
              <div className="row">
                <input className="u-input input" placeholder="Email (tuỳ chọn)" type="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
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
                const qty = toInt(i.qty || 1);
                const price = toInt(i.price || 0);
                return (
                  <div className="item" key={i.id}>
                    <img className="thumb"
                      src={i.thumbnail_url || "https://placehold.co/64x64?text=No+Img"}
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/64x64?text=No+Img")}
                    />
                    <div>
                      <div className="name">{i.name}</div>
                      <div className="muted">x {qty}</div>
                    </div>
                    <div className="price">{VND.format(qty * price)}₫</div>
                  </div>
                );
              })}
              {!cartForCheckout.length && <div className="muted">Chưa có sản phẩm nào. Hãy quay lại giỏ hàng nhé.</div>}
            </div>
          </div>
        </div>

        {/* ========== Cột phải ========== */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* Thanh toán & vận chuyển */}
          <div className="card">
            <div className="card-hd"><b>Thanh toán & Vận chuyển</b></div>
            <div className="card-bd" style={{ display: "grid", gap: 14 }}>
              <div>
                <b>Phương thức thanh toán</b>
                <div className="pm-row">
                  <label>
                    <input type="radio" name="pm" checked={form.payment_method === "cod"}
                      onChange={() => setForm({ ...form, payment_method: "cod" })}/> {" "}
                    Thanh toán khi nhận hàng (COD)
                  </label>
                  <label title={momoDisabled ? momoReason : ""} style={{ opacity: momoDisabled ? 0.7 : 1 }}>
                    <input type="radio" name="pm" checked={form.payment_method === "momo"}
                      onChange={() => setForm({ ...form, payment_method: "momo" })} disabled={momoDisabled}/> {" "}
                    Ví MoMo / QR online {momoDisabled && <span className="tag warn">{momoReason}</span>}
                  </label>
                </div>
              </div>

              <div className="line" />

              <div>
                <b>Chọn hình thức vận chuyển</b>
                <div className="pm-row">
                  <label><input type="radio" name="ship" value="standard" checked={ship === "standard"} onChange={(e) => setShip(e.target.value)}/> {" "}
                    Tiêu chuẩn — {VND.format(0)}₫</label>
                  <label><input type="radio" name="ship" value="fast" checked={ship === "fast"} onChange={(e) => setShip(e.target.value)}/> {" "}
                    Nhanh — {VND.format(25000)}₫</label>
                  <label><input type="radio" name="ship" value="express" checked={ship === "express"} onChange={(e) => setShip(e.target.value)}/> {" "}
                    Hoả tốc — {VND.format(50000)}₫</label>
                </div>
              </div>

              <div className="line" />

              <div>
                <b>Mã giảm giá</b>
                <div className="coupon">
                  <input className="u-input" placeholder="Nhập mã giảm giá"
                    value={coupon} onChange={(e) => setCoupon(e.target.value)} style={{ flex: 1 }}/>
                  <button className="btn" onClick={applyCoupon}>Áp dụng</button>
                  <button className="btn" onClick={() => setOpenVoucher(true)}>Chọn mã</button>
                  {appliedCoupon && <button className="btn" onClick={clearCoupon}>Huỷ mã</button>}
                </div>

                {/* Gợi ý nhanh ngoài Drawer */}
                {!appliedCoupon && bestHint?.off > 0 && (
                  <div className="hint">
                    <span className="tag">Gợi ý</span>
                    <span>Mã <b>{bestHint.code}</b> có thể giảm <b>{VND.format(bestHint.off)}₫</b>.</span>
                    <button className="btn" onClick={() => applyCouponFromDrawer(bestHint.code)}>Áp dụng tốt nhất</button>
                  </div>
                )}

                {appliedCoupon && (
                  <div style={{ marginTop: 8 }}>
                    <span className="tag">Đã áp dụng: <b>{appliedCoupon.code}</b> — {appliedCoupon.desc}</span>
                  </div>
                )}
              </div>

              <div className="line" />

              <div>
                <b>Lời nhắn cho shop</b>
                <textarea className="u-input note" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến…"
                  value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}/>
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
            {msg && <div className="tag" style={{ background: "#ecfdf5", borderColor: "#86efac" }}>{msg}</div>}
            <button className="btn primary" onClick={submit} disabled={loading || !cartForCheckout.length}>
              {loading ? "Đang xử lý…" : form.payment_method === "momo" ? "Thanh toán MoMo" : "Đặt hàng COD"}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer chọn mã */}
      <VoucherDrawer
        open={openVoucher}
        onClose={() => setOpenVoucher(false)}
        subtotal={subTotal}
        onPickCode={applyCouponFromDrawer}
      />
    </div>
  );
}
