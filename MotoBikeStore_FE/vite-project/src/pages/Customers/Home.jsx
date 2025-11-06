// src/pages/Customers/Home.jsx
import { useEffect, useState, useMemo } from "react";
import ProductCard from "../../components/ProductCard";

const API_BASE = "http://127.0.0.1:8000";
const API_CATEGORIES = `${API_BASE}/api/categories`;
const API_PRODUCTS = `${API_BASE}/api/products`;

const CAT_PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";
const PROD_PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

const SHOW_COUNT = 4; // đổi 4/5/8 tuỳ ý

// ======= LIGHT THEME (chỉ style, giữ nguyên cấu trúc) =======
const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 2px rgba(16,24,40,.04)",
  borderRadius: 16,
};
const cardHover = {
  transition: "transform .15s ease, box-shadow .15s ease, border-color .15s",
};
const h2Style = { margin: "12px 0 0", color: "#0f172a" };
const textMuted = { opacity: 0.9, color: "#334155" };
const btn = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 12,
  fontWeight: 800,
  textDecoration: "none",
  background: "#10b981",
  color: "#052e2b",
  border: "1px solid #059669",
};
const btnOutline = {
  ...btn,
  background: "transparent",
  color: "#047857",
  border: "1px solid #10b981",
};

// Ghép URL ảnh danh mục
const buildCatImg = (raw) => {
  if (!raw) return CAT_PLACEHOLDER;
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/assets/images/")) return `${API_BASE}${s}`;
  if (s.startsWith("assets/images/")) return `${API_BASE}/${s}`;
  if (s.startsWith("/images/")) return `${API_BASE}${s}`;
  if (s.startsWith("images/")) return `${API_BASE}/${s}`;
  const hasExt = /\.[a-z0-9]+$/i.test(s);
  const name = hasExt ? s : `${s}.webp`;
  return `${API_BASE}/assets/images/${name}`;
};

// Kiểm tra đúng nghĩa "giảm giá"
const isSale = (p) => {
  const root = Number(p?.price_root ?? 0);
  const price = Number(p?.price ?? p?.price_sale ?? 0);
  return root > 0 && price > 0 && price < root;
};

// Chuẩn hoá dữ liệu cho ProductCard (ảnh, giá…)
const normalizeProduct = (p) => ({
  ...p,
  image: p?.thumbnail_url || p?.thumbnail || p?.image_url || PROD_PLACEHOLDER,
});

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const qsNew = new URLSearchParams({
          limit: String(SHOW_COUNT),
          _ts: Date.now().toString(),
        });
        const qsSale = new URLSearchParams({
          limit: String(SHOW_COUNT),
          only_sale: "1",
          _ts: Date.now().toString(),
        });

        const [resCats, resNew, resSale] = await Promise.all([
          fetch(API_CATEGORIES, { signal: ac.signal, headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch(`${API_PRODUCTS}?${qsNew.toString()}`, { signal: ac.signal, headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch(`${API_PRODUCTS}?${qsSale.toString()}`, { signal: ac.signal, headers: { Accept: "application/json" }, cache: "no-store" }),
        ]);

        if (!resCats.ok) throw new Error(`Cats HTTP ${resCats.status}`);
        if (!resNew.ok) throw new Error(`New HTTP ${resNew.status}`);
        if (!resSale.ok) throw new Error(`Sale HTTP ${resSale.status}`);

        const catsData = await resCats.json().catch(() => []);
        const newData = await resNew.json().catch(() => []);
        const saleData = await resSale.json().catch(() => []);

        const cats = Array.isArray(catsData) ? catsData : (catsData?.data || []);
        let latest = Array.isArray(newData) ? newData : (newData?.data || []);
        let sales = Array.isArray(saleData) ? saleData : (saleData?.data || []);

        sales = sales.filter(isSale);
        latest = [...latest].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0)).slice(0, SHOW_COUNT);
        sales = [...sales].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0)).slice(0, SHOW_COUNT);

        setCategories(cats);
        setNewItems(latest);
        setSaleItems(sales);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Không tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const latestView = useMemo(() => newItems.map(normalizeProduct), [newItems]);
  const salesView = useMemo(() => saleItems.map(normalizeProduct), [saleItems]);

  const onCatImgError = (e) => {
    const tried = e.currentTarget.getAttribute("data-tried") || "0";
    const src = e.currentTarget.src;
    if (tried === "0" && /\.webp(\?.*)?$/i.test(src)) {
      e.currentTarget.setAttribute("data-tried", "1");
      e.currentTarget.src = src.replace(/\.webp(\?.*)?$/i, ".jpg$1");
    } else {
      e.currentTarget.src = CAT_PLACEHOLDER;
    }
  };

  return (
    <div className="u-grid" style={{ gap: 16, background: "#ffffff", color: "#0f172a" }}>
      {/* Hero */}
      <div
        className="u-card u-border u-hover"
        style={{ ...cardStyle, ...cardHover, padding: 0, overflow: "hidden" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr" }}>
          <img
            src={`${API_BASE}/assets/images/banner.webp`}
            alt="banner"
            onError={(e) => (e.currentTarget.src = CAT_PLACEHOLDER)}
            style={{ width: "100%", height: 320, objectFit: "cover" }}
          />
          <div style={{ padding: 20, display: "grid", alignContent: "center", gap: 10 }}>
            <div style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: "#effdf6", color: "#047857", fontWeight: 700 }}>
              MotoBikeStore
            </div>
            <h1 style={{ margin: 0, lineHeight: 1.15, color: "#0f172a" }}>
              Hiệu năng bùng nổ – Phong cách thể thao
            </h1>
            <p style={textMuted}>
              Khuyến mãi hấp dẫn cho xe & phụ kiện thể thao. Giao nhanh toàn quốc.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="/products" style={btn}>Mua ngay</a>
              <a href="#categories" style={btnOutline}>Xem danh mục</a>
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi (nếu có) */}
      {err && (
        <div className="u-card u-border" style={{ ...cardStyle, padding: 12, color: "#b91c1c" }}>
          {err}
        </div>
      )}

      {/* Categories */}
      <section id="categories" className="u-grid" style={{ gap: 12 }}>
        <h2 style={{ ...h2Style, marginTop: 4 }}>Danh mục</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
          }}
        >
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="u-card u-border" style={{ ...cardStyle, padding: 10 }}>
                <div className="skeleton" style={{ height: 110, borderRadius: 10 }} />
                <div className="skeleton" style={{ height: 16, borderRadius: 6, marginTop: 8 }} />
              </div>
            ))}

          {!loading &&
            categories.map((c) => (
              <a
                key={c.id}
                href={`/category/${c.id}`}
                className="u-card u-border u-hover"
                style={{
                  ...cardStyle,
                  ...cardHover,
                  padding: 10,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <img
                  src={buildCatImg(c.image || c.image_url || c.thumbnail || c.photo || c.icon)}
                  alt={c.name}
                  data-tried="0"
                  onError={onCatImgError}
                  style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 10 }}
                />
                <div style={{ marginTop: 8, fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
              </a>
            ))}
        </div>
      </section>

      {/* New items */}
      <section className="u-grid" style={{ gap: 12 }}>
        <h2 style={h2Style}>Hàng mới</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          }}
        >
          {loading
            ? Array.from({ length: SHOW_COUNT }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />
              ))
            : latestView.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Sale items */}
      <section className="u-grid" style={{ gap: 12 }}>
        <h2 style={h2Style}>Đang giảm giá</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          }}
        >
          {loading
            ? Array.from({ length: SHOW_COUNT }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />
              ))
            : salesView.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
