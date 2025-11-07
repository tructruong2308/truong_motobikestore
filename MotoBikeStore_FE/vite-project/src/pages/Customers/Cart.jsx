// src/pages/Customers/Cart.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const VND = new Intl.NumberFormat("vi-VN");
const TAB_ID = (() => {
  const exist = sessionStorage.getItem("tab_id");
  if (exist) return exist;
  const id = Math.random().toString(36).slice(2);
  sessionStorage.setItem("tab_id", id);
  return id;
})();

export default function Cart({ cart = [], setCart }) {
  // ======= TỰ REFRESH – KHÔNG GIẬT =======
  const lastHashRef = useRef("");
  const [selected, setSelected] = useState(() => new Set()); // id đã chọn

  const hash = (arr) => {
    try {
      return JSON.stringify(arr.map((x) => [x.id, x.qty]));
    } catch {
      return "";
    }
  };

  const readFromLS = () => {
    try {
      const list = JSON.parse(localStorage.getItem("cart") || "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  const writeAndBroadcast = (next) => {
    const newHash = hash(next);
    if (newHash === lastHashRef.current) return;
    lastHashRef.current = newHash;
    localStorage.setItem("cart", JSON.stringify(next));
    setCart(next);
    // giữ các lựa chọn còn tồn tại
    setSelected((prev) => {
      const ids = new Set(next.map((x) => String(x.id)));
      return new Set([...prev].filter((id) => ids.has(id)));
    });
    window.dispatchEvent(
      new CustomEvent("cart:refresh", { detail: { source: TAB_ID } })
    );
  };

  // lần đầu vào trang
  useEffect(() => {
    const list = readFromLS();
    const newHash = hash(list);
    if (newHash !== lastHashRef.current) {
      lastHashRef.current = newHash;
      setCart(list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // nghe thay đổi từ tab/comp khác
  useEffect(() => {
    const onCartRefresh = (e) => {
      if (e?.detail?.source === TAB_ID) return;
      const list = readFromLS();
      const newHash = hash(list);
      if (newHash !== lastHashRef.current) {
        lastHashRef.current = newHash;
        setCart(list);
        setSelected((prev) => {
          const ids = new Set(list.map((x) => String(x.id)));
          return new Set([...prev].filter((id) => ids.has(id)));
        });
      }
    };
    window.addEventListener("cart:refresh", onCartRefresh);
    window.addEventListener("storage", onCartRefresh);
    return () => {
      window.removeEventListener("cart:refresh", onCartRefresh);
      window.removeEventListener("storage", onCartRefresh);
    };
  }, [setCart]);

  // ======= Actions
  const updateQty = (id, qty) =>
    writeAndBroadcast(
      cart.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
    );

  const removeItem = (id) => writeAndBroadcast(cart.filter((x) => x.id !== id));

  const removeSelected = () => {
    if (!selected.size) return;
    writeAndBroadcast(cart.filter((x) => !selected.has(String(x.id))));
    setSelected(new Set());
  };

  const clearAll = () => {
    if (!cart.length) return;
    writeAndBroadcast([]);
    setSelected(new Set());
  };

  // ======= Select
  const allIds = cart.map((x) => String(x.id));
  const allChecked = cart.length > 0 && allIds.every((id) => selected.has(id));
  const partiallyChecked = cart.length > 0 && !allChecked && selected.size > 0;

  const toggleAll = (checked) => {
    if (!checked) setSelected(new Set());
    else setSelected(new Set(allIds));
  };
  const toggleOne = (id) => {
    const k = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // ======= Totals
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + (i.qty || 1) * Number(i.price || 0), 0),
    [cart]
  );
  const selectedTotal = useMemo(
    () =>
      cart.reduce(
        (s, i) =>
          selected.has(String(i.id))
            ? s + (i.qty || 1) * Number(i.price || 0)
            : s,
        0
      ),
    [cart, selected]
  );
  const selectedCount = useMemo(
    () => cart.filter((x) => selected.has(String(x.id))).length,
    [cart, selected]
  );

  // ======= Gửi danh sách id đã chọn cho Checkout
  const goCheckout = (e) => {
    if (selected.size === 0) {
      // nếu không chọn gì -> cho thanh toán toàn bộ (giữ hành vi cũ)
      localStorage.removeItem("checkout_selected_ids");
      return;
    }
    const ids = [...selected];
    localStorage.setItem("checkout_selected_ids", JSON.stringify(ids));
  };

  // ======= CSS (Skin sáng)
const css = `
:root{--line:#e5e7eb;--text:#0f172a;--muted:#64748b}

/* dùng light form-controls, tránh auto dark của trình duyệt */
.cartX{ color-scheme: light; }

.cartX .tbl{ width:100%; border-collapse:separate; border-spacing:0; table-layout:fixed }
.cartX th, .cartX td{ padding:14px 12px; border-bottom:1px dashed var(--line); vertical-align:middle }
.cartX thead th{ font-weight:800; color:var(--text); background:#f8fafc; border-bottom:1px solid var(--line) }
.cartX .prod{ display:flex; align-items:center; gap:12px; min-width:0 }
.cartX .thumb{ flex:0 0 64px; width:64px; height:64px; border-radius:12px; border:1px solid var(--line); object-fit:cover; background:#ffffff }
.cartX .name{ font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.cartX .price{ font-weight:700; text-align:right; color:var(--text) }
.cartX .qty{ display:flex; gap:6px; align-items:center; justify-content:flex-start }

/* nút +/- */
.cartX .btn{ height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#ffffff; color:var(--text); font-weight:700; cursor:pointer; transition:transform .08s ease; box-shadow:0 1px 2px rgba(0,0,0,.04) }
.cartX .btn:active{ transform:scale(.98) }
.cartX .btn.ghost{ background:transparent }
.cartX .btn.outline{ background:#ffffff }

/* === FIX: input số lượng luôn nền trắng, text tối, viền sáng === */
.cartX .qty .u-input{
  height:36px;
  width:72px;
  text-align:center;
  border:1px solid var(--line);
  border-radius:10px;
  background:#ffffff !important;
  color:var(--text) !important;
  outline:none;
  box-shadow:none;
  caret-color:var(--text);
}

/* focus ring nhẹ xanh lá */
.cartX .qty .u-input:focus{
  border-color:#22c55e;
  box-shadow:0 0 0 3px rgba(34,197,94,.18);
}

/* ẩn spinner của type=number nếu có */
.cartX .qty .u-input::-webkit-outer-spin-button,
.cartX .qty .u-input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0 }
.cartX .qty .u-input[type=number]{ -moz-appearance:textfield }

/* chống autofill nền vàng/đen trên Chrome */
.cartX .qty .u-input:-webkit-autofill{
  -webkit-text-fill-color:var(--text);
  box-shadow: inset 0 0 0px 1000px #ffffff !important;
  transition: background-color 9999s ease-out 0s;
}

.cartX .sumBar{ position:sticky; bottom:12px; display:flex; gap:12px; align-items:center; justify-content:flex-end; padding:14px; border:1px solid var(--line); border-radius:14px; background:#ffffff; box-shadow:0 8px 30px rgba(17,24,39,.06) }
.cartX .total{ font-weight:900; font-size:18px; color:var(--text) }
.cartX .empty{ text-align:center; padding:28px 16px; color:var(--muted) }
.cartX .empty .box{ display:inline-grid; gap:10px; justify-items:center; padding:18px; border:1px dashed var(--line); border-radius:14px; background:#f8fafc }
.cartX .tag{ display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; border:1px solid var(--line); background:#f1f5f9; font-size:12px; color:var(--text); font-weight:700 }
.cartX .chk{ width:18px; height:18px; accent-color:#22c55e; cursor:pointer }
`;

  return (
    <div className="u-grid cartX" style={{ gap: 16, color: "#0f172a" }}>
      <style>{css}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>Giỏ hàng</h1>
        {cart.length > 0 && <span className="tag">Có {cart.length} sản phẩm</span>}
        {selected.size > 0 && (
          <span className="tag">Đã chọn: {selectedCount} · ₫{VND.format(selectedTotal)}</span>
        )}
      </div>

      {/* Thanh công cụ */}
      <div
        className="u-card u-border"
        style={{
          padding: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          background: "#ffffff",
          borderColor: "#e5e7eb",
        }}
      >
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            className="chk"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = partiallyChecked; }}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          Chọn tất cả
        </label>

        <button className="btn" disabled={!selected.size} onClick={removeSelected}>
          Xoá đã chọn
        </button>
        <button className="btn ghost" disabled={!cart.length} onClick={clearAll}>
          Xoá tất cả
        </button>

        <div style={{ flex: 1 }} />
        <div className="total">Tổng giỏ: {VND.format(cartTotal)}₫</div>
      </div>

      <div
        className="u-card u-border"
        style={{ padding: 0, overflow: "hidden", background: "#ffffff", borderColor: "#e5e7eb" }}
      >
        <table className="tbl">
          <colgroup>
            <col style={{ width: 52 }} />
            <col />
            <col style={{ width: 140 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 80 }} />
          </colgroup>

          <thead>
            <tr>
              <th></th>
              <th>Sản phẩm</th>
              <th style={{ textAlign: "right" }}>Giá</th>
              <th>Số lượng</th>
              <th style={{ textAlign: "right" }}>Tạm tính</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {cart.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    <div className="box">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
                        width="60"
                        height="60"
                        style={{ opacity: 0.9 }}
                      />
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Giỏ hàng trống</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        Tiếp tục mua sắm để thêm sản phẩm nhé!
                      </div>
                      <a className="u-btn" href="/products" style={{ background: "#111827", color: "#fff" }}>
                        Mua sắm ngay
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {cart.map((it) => {
              const id = String(it.id);
              const price = Number(it.price || 0);
              const qty = Number(it.qty || 1);
              const sub = qty * price;
              const checked = selected.has(id);
              return (
                <tr key={id}>
                  <td style={{ textAlign: "center" }}>
                    <input type="checkbox" className="chk" checked={checked} onChange={() => toggleOne(id)} />
                  </td>

                  <td>
                    <div className="prod">
                      <img
                        className="thumb"
                        src={it.thumbnail_url || "https://placehold.co/64x64?text=No+Img"}
                        alt={it.name}
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/64x64?text=No+Img")}
                      />
                      <div className="name" title={it.name}>{it.name}</div>
                    </div>
                  </td>

                  <td className="price">{VND.format(price)}₫</td>

                  <td>
                    <div className="qty">
                      <button className="btn outline" onClick={() => updateQty(it.id, qty - 1)} aria-label="Giảm">−</button>
                      <input
                        className="u-input"
                        value={qty}
                        onChange={(e) => updateQty(it.id, Math.max(1, parseInt(e.target.value || "1", 10)))}
                      />
                      <button className="btn outline" onClick={() => updateQty(it.id, qty + 1)} aria-label="Tăng">+</button>
                    </div>
                  </td>

                  <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                    {VND.format(sub)}₫
                  </td>

                  <td>
                    <button className="btn ghost" onClick={() => removeItem(it.id)} title="Xoá">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Thanh tóm tắt (sticky) */}
      <div className="sumBar">
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            className="chk"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = partiallyChecked; }}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          Chọn tất cả
        </label>

        <div style={{ flex: 1 }} />
        <span className="tag">Đã chọn: {selectedCount}</span>
        <span className="tag">Tổng: ₫{VND.format(selectedTotal)}</span>

        <a className="u-btn" href="/checkout" onClick={goCheckout} style={{ background: "#10b981", color: "#fff" }}>
          Thanh toán
        </a>
      </div>
    </div>
  );
}
