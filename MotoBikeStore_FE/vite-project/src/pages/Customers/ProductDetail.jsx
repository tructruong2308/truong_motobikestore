// src/pages/Customers/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toVNDateTime } from "../../utils/time";
import ProductReview from "../../components/ProductReview";

const API_ROOT = "http://127.0.0.1:8000";
const API_A = `${API_ROOT}/api`;
const API_B = `${API_ROOT}`;
const PLACEHOLDER = "https://placehold.co/800x600?text=No+Image";

/* ================= Helpers ================= */

// Bỏ mọi ký tự không phải số
const toMoneyNumber = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/[^\d-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// Trả về { val, key }
const pickWithKey = (obj, keys) => {
  for (const k of keys) {
    if (!obj) break;
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const n = toMoneyNumber(v);
    if (n > 0) return { val: n, key: k };
  }
  return { val: 0, key: "" };
};

// Hợp nhất trường giá bị thiếu
const mergePriceFields = (target, source) => {
  if (!target || !source) return target;
  const keys = [
    "price_root","original_price","old_price","gia_goc","gia_niem_yet",
    "base_price","unit_price","price_out",
    "price_sale","sale_price","discount_price","promotion_price","priceSale",
    "gia_km","giam_gia",
    "price","final_price","gia_ban","gia_hien_tai","gia"
  ];
  for (const k of keys) {
    if (target[k] === undefined || target[k] === null || target[k] === 0 || target[k] === "0") {
      if (source[k] !== undefined && source[k] !== null && source[k] !== "") {
        target[k] = source[k];
      }
    }
  }
  return target;
};

// Chuẩn hoá giá cho UI
const getPrices = (o) => {
  const basePick = pickWithKey(o, [
    "price_root","original_price","old_price","gia_goc",
    "gia_niem_yet","base_price","unit_price","price_out",
  ]);
  const nowPick  = pickWithKey(o, [
    "price","final_price","gia_ban","gia_hien_tai","gia",
  ]);
  const salePick = pickWithKey(o, [
    "price_sale","sale_price","discount_price","promotion_price",
    "priceSale","gia_km","giam_gia",
  ]);

  let now = nowPick.val || 0;
  if (salePick.val > 0 && (basePick.val === 0 || salePick.val <= basePick.val)) {
    now = salePick.val;
  }
  if (now === 0) now = basePick.val || salePick.val || 0;

  const base = basePick.val;
  const showOld = base > 0 && now > 0 && base > now;
  return { base, now, sale: salePick.val, showOld };
};

/* ==== Cart helpers ==== */
const CART_KEYS = ["cart","cart_items","shopping_cart","mbs_cart","CART"];
function readCart() {
  for (const k of CART_KEYS) {
    try {
      const arr = JSON.parse(localStorage.getItem(k) || "null");
      if (Array.isArray(arr)) return { key: k, items: arr };
    } catch {}
  }
  return { key: "cart", items: [] };
}
function writeCart(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}
function normalizeForCart(p) {
  const src = p?.raw ? { ...p.raw, ...p } : p || {};
  const id = src.id ?? src.product_id ?? src.productId ?? src.slug ?? src.code ?? null;
  const name = src.name ?? src.title ?? "";
  const { now } = getPrices(src);
  const thumb =
    src.thumbnail_url || src.thumbnail || src.image_url || src.image || PLACEHOLDER;

  return { id, name, price: now, image: thumb, thumbnail_url: thumb, qty: 1 };
}

/* ======== Reviews helpers (stars) ======== */
function Stars({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ display: "inline-flex", gap: 2, color: "#f59e0b", alignItems: "center" }}>
      {Array.from({ length: full }).map((_, i) => <span key={"f"+i}>★</span>)}
      {half ? <span>☆</span> : null}
      {Array.from({ length: empty }).map((_, i) => <span key={"e"+i} style={{ opacity: .3 }}>★</span>)}
      <span style={{ marginLeft: 6, fontSize: 12, opacity: .8 }}>{v.toFixed(1)}</span>
    </span>
  );
}

/* ================= Fetchers ================= */
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  try { return await res.json(); } catch { return {}; }
}
async function fetchDetail(pid) {
  for (const url of [`${API_A}/products/${pid}`, `${API_B}/products/${pid}`]) {
    try {
      const j = await getJSON(url);
      return j?.data ?? j ?? null;
    } catch {}
  }
  return null;
}
async function fetchListAndFind(pid) {
  for (const url of [`${API_A}/products`, `${API_B}/products`]) {
    try {
      const j = await getJSON(url);
      const list = (Array.isArray(j) && j) || j?.data || j?.items || j?.products || [];
      const found = list.find(x => String(x?.id ?? x?.product_id) === String(pid));
      if (found) return found;
    } catch {}
  }
  return null;
}
async function getJSONSafe(url, init) {
  try {
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, data: json };
  } catch {
    return { ok: false, data: {} };
  }
}

/* ================= Page ================= */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // rating summary
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        // 1) Chi tiết
        let p = await fetchDetail(id);
        // 2) Bù trường giá còn thiếu
        const hasBase =
          toMoneyNumber(p?.price_root ?? p?.original_price ?? p?.old_price ?? p?.gia_goc ?? 0) > 0;
        const hasSale =
          toMoneyNumber(p?.price_sale ?? p?.sale_price ?? p?.discount_price ?? p?.promotion_price ?? 0) > 0;

        if (!hasBase || !hasSale) {
          const fromList = await fetchListAndFind(p?.id ?? id);
          if (fromList) p = mergePriceFields(p, fromList);
        }

        if (!alive) return;
        setData(p);

        // 3) Liên quan
        const catId = p?.category_id || p?.category?.id || p?.categoryId || null;
        const candidates = [
          catId ? `${API_A}/categories/${catId}/products` : `${API_A}/products`,
          catId ? `${API_B}/categories/${catId}/products` : `${API_B}/products`,
        ];

        for (const url of candidates) {
          try {
            const j = await getJSON(url);
            const list =
              (Array.isArray(j) && j) || j?.data || j?.items || j?.products || [];
            const norm = (x) => {
              const { base, now, sale, showOld } = getPrices(x);
              const thumb =
                x.thumbnail_url || x.thumbnail || x.image_url || x.image || "";
              return {
                id: x.id ?? x.product_id ?? null,
                name: x.name ?? "",
                base, now, sale, showOld,
                thumbnail_url: thumb,
                raw: x,
              };
            };
            const rel = list
              .map(norm)
              .filter((pp) => String(pp.id) !== String(id))
              .slice(0, 8);
            if (alive) setRelated(rel);
            break;
          } catch {}
        }
      } catch {
        if (alive) setErr("Không tải được chi tiết sản phẩm.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // rating summary
  useEffect(() => {
    let alive = true;
    (async () => {
      const { ok, data: d } = await getJSONSafe(`${API_A}/products/${id}/reviews`, {
        headers: { Accept: "application/json" }
      });
      if (!alive) return;
      if (ok) {
        setAvg(Number(d.avg ?? 0));
        setCount(Number(d.count ?? (d.reviews?.length ?? d.data?.length ?? 0)));
      } else {
        setAvg(0); setCount(0);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // ======= Giá cho CHI TIẾT =======
  const { now: nowPrice, base: basePrice, showOld } = useMemo(() => getPrices(data || {}), [data]);
  const discountPct =
    showOld && basePrice > 0
      ? Math.round(((basePrice - nowPrice) / basePrice) * 100)
      : 0;

  const imageUrl = useMemo(() => {
    if (!data) return PLACEHOLDER;
    return (
      data.thumbnail_url ||
      data.image_url ||
      data.thumbnail ||
      data.image ||
      PLACEHOLDER
    );
  }, [data]);

  const onAdd = (prod = data) => {
    if (!localStorage.getItem("token")) {
      alert("⚠️ Bạn cần đăng nhập trước khi thêm sản phẩm!");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    const item = normalizeForCart(prod);
    if (!item.id) {
      alert("Không thể xác định mã sản phẩm.");
      return;
    }
    const { key, items } = readCart();
    const i = items.findIndex((x) => String(x.id) === String(item.id));
    if (i >= 0) items[i].qty += 1;
    else items.push(item);
    writeCart(key, items);
    window.dispatchEvent(new CustomEvent("add-to-cart", { detail: item }));
    window.dispatchEvent(new Event("cart:refresh"));
    alert("✅ Đã thêm vào giỏ hàng!");
  };

  if (loading) return <div style={{ padding: 20 }}>Đang tải chi tiết…</div>;
  if (err) return <div style={{ padding: 20, color: "#ef4444" }}>{err}</div>;
  if (!data) return <div style={{ padding: 20 }}>Không tìm thấy sản phẩm.</div>;

  return (
    <div style={{ padding: 16 }}>
      <style>{`
        :root { --border: #e5e7eb; }

        .pd-grid { display:grid; grid-template-columns: 1.1fr 1fr; gap:24px; }
        @media (max-width: 1024px) { .pd-grid{ grid-template-columns: 1fr; } }

        .pd-frame {
          background:#ffffff; border:1px solid var(--border); border-radius:14px;
          height:clamp(340px, 50vh, 560px); aspect-ratio: 4/3;
          display:grid; place-items:center; overflow:hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }
        .pd-frame > img{ width:100%; height:100%; object-fit:contain; }

        .pd-price-row{ display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
        .pd-price-sale{ font-size:26px; font-weight:800; color:#0f172a; }
        .pd-price-old{ font-size:16px; text-decoration:line-through; opacity:.7; color:#64748b; }
        .pd-badge{
          font-size:12px; font-weight:700; padding:2px 8px; border-radius:999px;
          border:1px solid var(--border); background:#f1f5f9; color:#0f172a;
        }

        .rel-grid{ display:grid; gap:16px; grid-template-columns: repeat(4, minmax(0,1fr)); }
        @media (max-width: 1200px){ .rel-grid{ grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 900px){ .rel-grid{ grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px){ .rel-grid{ grid-template-columns: 1fr; } }

        .rel-card { display:grid; gap:10px; padding:12px; background:#ffffff; }
        .rel-img { background:#ffffff; border:1px solid var(--border); border-radius:12px;
          width:100%; aspect-ratio: 4/3; overflow:hidden; display:grid; place-items:center; }
        .rel-img > img { width:100%; height:100%; object-fit:contain; }
        .rel-name{ font-weight:700; line-height:1.3; min-height:2.6em; color:#0f172a; }
        .rel-price{ font-weight:800; color:#0f172a; }
        .rel-old{ margin-left:8px; text-decoration:line-through; opacity:.7; font-size:12px; color:#64748b; }
        .rel-actions{ display:flex; gap:8px; }
      `}</style>

      {/* Chi tiết */}
      <div className="u-card u-border" style={{ padding: 16, background: "#ffffff", borderColor: "#e5e7eb" }}>
        <div className="pd-grid">
          <div className="pd-frame">
            <img
              src={imageUrl}
              alt={data?.name}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
          </div>

          <div style={{ display: "grid", alignContent: "start", gap: 16 }}>
            <h1 style={{ margin: 0, color: "#0f172a" }}>{data?.name}</h1>

            {/* block Giá */}
            <div
              className="u-card u-border"
              style={{
                padding: 12,
                background: "#f8fafc",
                borderColor: "#e5e7eb",
                color: "#0f172a",
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 6, color: "#334155" }}>
                Giá
              </div>

              <div className="pd-price-row">
                <span className="pd-price-sale">
                  {toMoneyNumber(data ? getPrices(data).now : 0).toLocaleString("vi-VN")} ₫
                </span>
                {getPrices(data).showOld && (
                  <>
                    <span className="pd-price-old">
                      {toMoneyNumber(getPrices(data).base).toLocaleString("vi-VN")} ₫
                    </span>
                    {(() => {
                      const { base, now, showOld } = getPrices(data);
                      const pct = showOld && base > 0 ? Math.round(((base - now) / base) * 100) : 0;
                      return pct > 0 ? <span className="pd-badge">-{pct}%</span> : null;
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Tóm tắt rating */}
            <div
              className="u-card u-border"
              style={{
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#ffffff",
                borderColor: "#e5e7eb",
                borderRadius: 12,
                color: "#0f172a",
              }}
            >
              <b>Đánh giá:</b> <Stars value={avg} />
              <span className="u-chip" style={{ background: "#f1f5f9", borderColor: "#e5e7eb", color: "#0f172a" }}>
                {count} đánh giá
              </span>
            </div>

            {data?.description && (
              <div
                className="u-card u-border"
                style={{ padding: 12, background: "#ffffff", borderColor: "#e5e7eb", borderRadius: 12, color: "#0f172a" }}
              >
                {data.description}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="u-btn" onClick={() => onAdd(data)}>
                Thêm vào giỏ
              </button>
              <button className="u-btn outline" onClick={() => navigate("/cart")}>
                Xem giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="u-card u-border" style={{ padding: 16, marginTop: 16, background: "#ffffff", borderColor: "#e5e7eb" }}>
        <ProductReview />
      </div>

      {/* Liên quan */}
      <div className="u-card u-border" style={{ padding: 16, marginTop: 16, background: "#ffffff", borderColor: "#e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Sản phẩm liên quan</h3>
          <span className="u-chip" style={{ background: "#f1f5f9", borderColor: "#e5e7eb", color: "#0f172a" }}>
            {related.length}
          </span>
        </div>

        {related.length === 0 ? (
          <div style={{ opacity: 0.7, padding: "8px 0", color: "#334155" }}>
            Chưa có sản phẩm liên quan.
          </div>
        ) : (
          <div className="rel-grid">
            {related.map((p) => {
              const now = toMoneyNumber(p.now);
              const base = toMoneyNumber(p.base);
              const showOld = base > 0 && now > 0 && base > now;
              const img = (p.thumbnail_url && p.thumbnail_url.trim()) || PLACEHOLDER;

              return (
                <div key={p.id} className="u-card u-border u-hover rel-card" style={{ borderColor: "#e5e7eb" }}>
                  <Link to={`/products/${p.id}`} className="rel-img">
                    <img
                      src={img}
                      alt={p.name}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                    />
                  </Link>

                  <Link
                    to={`/products/${p.id}`}
                    className="rel-name"
                    style={{ color: "#0f172a", textDecoration: "none" }}
                  >
                    {p.name}
                  </Link>

                  <div>
                    <span className="rel-price">
                      {now.toLocaleString("vi-VN")} ₫
                    </span>
                    {showOld && (
                      <span className="rel-old">
                        {base.toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                  </div>

                  <div className="rel-actions">
                    <button className="u-btn" onClick={() => onAdd(p)}>
                      Thêm giỏ
                    </button>
                    <Link to={`/products/${p.id}`} className="u-btn outline">
                      Xem
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
