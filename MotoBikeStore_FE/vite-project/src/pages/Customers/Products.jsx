// src/pages/Customers/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../../components/ProductCard";

const API_ROOT = "http://127.0.0.1:8000";
const API_PRODUCTS = `${API_ROOT}/api/products`;
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";
const PER_PAGE = 12;

// helpers
const asArray = (d) => (Array.isArray(d) ? d : d?.data ?? []);
const parseMeta = (d) => ({
  cur: d?.meta?.current_page ?? d?.current_page ?? 1,
  last: d?.meta?.last_page ?? d?.last_page ?? 1,
});

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");

  // ====== NEW: price range state ======
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ---------- LOAD ALL PRODUCTS ----------
  useEffect(() => {
    const ac = new AbortController();

    const getPage = async (page) => {
      const url = `${API_PRODUCTS}?page=${page}&per_page=${PER_PAGE}`;
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      try {
        return await res.json();
      } catch {
        return {};
      }
    };

    const dedupePush = (acc, seen, list) => {
      let added = 0;
      for (const p of list) {
        const key = p?.id ?? p?.product_id ?? p?.slug ?? JSON.stringify(p);
        if (!seen.has(key)) {
          seen.add(key);
          acc.push(p);
          added++;
        }
      }
      return added;
    };

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const all = [];
        const seen = new Set();

        // page 1
        const first = await getPage(1);
        const list1 = asArray(first);
        dedupePush(all, seen, list1);

        const { last } = parseMeta(first);

        if (last > 1) {
          // tải song song 2..last
          const pages = Array.from({ length: last - 1 }, (_, i) => i + 2);
          const datas = await Promise.allSettled(pages.map((p) => getPage(p)));
          for (const r of datas) {
            if (r.status === "fulfilled") {
              dedupePush(all, seen, asArray(r.value));
            }
          }
        } else {
          // fallback tuần tự cho API không trả meta
          for (let page = 2; page <= 300; page++) {
            const data = await getPage(page);
            const list = asArray(data);
            if (!list.length) break;
            const added = dedupePush(all, seen, list);
            if (added === 0) break;
          }
        }

        setItems(all);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // ---------- URL -> state (q, min, max) ----------
  useEffect(() => {
    const kw = searchParams.get("q") || "";
    const min = searchParams.get("min") || "";
    const max = searchParams.get("max") || "";
    setQ(kw);
    setMinPrice(min);
    setMaxPrice(max);
  }, [searchParams]);

  // ---------- state -> URL (q) ----------
  useEffect(() => {
    const t = setTimeout(() => {
      const cur = searchParams.get("q") || "";
      if (q !== cur) {
        const sp = new URLSearchParams(searchParams);
        if (q) sp.set("q", q);
        else sp.delete("q");
        setSearchParams(sp, { replace: true });
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // ---------- state -> URL (min, max) ----------
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(searchParams);
      const hasMin = minPrice !== "" && !Number.isNaN(Number(minPrice));
      const hasMax = maxPrice !== "" && !Number.isNaN(Number(maxPrice));

      if (hasMin) sp.set("min", String(minPrice));
      else sp.delete("min");

      if (hasMax) sp.set("max", String(maxPrice));
      else sp.delete("max");

      setSearchParams(sp, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  // ---------- ADD TO CART (fallback + lắng nghe sự kiện từ ProductCard) ----------
  const addToCartLocal = (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Bạn cần đăng nhập trước khi thêm sản phẩm!");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const id = product?.id ?? product?.product_id;
    const price = Number(
      product?.price_sale ?? product?.price ?? product?.unit_price ?? 0
    );
    const name = product?.name || "Sản phẩm";
    const thumb =
      product?.thumbnail_url || product?.image_url || product?.thumbnail || "";

    const idx = cart.findIndex((x) => x.id === id);
    if (idx > -1) {
      cart[idx].qty = (cart[idx].qty || 1) + 1;
    } else {
      cart.push({ id, name, price, thumbnail_url: thumb, qty: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Đã thêm vào giỏ hàng!");
  };

  useEffect(() => {
    const onAdd = (e) => {
      if (e?.detail) addToCartLocal(e.detail);
    };
    window.addEventListener("add-to-cart", onAdd);
    return () => window.removeEventListener("add-to-cart", onAdd);
  }, []);

  // ---------- FILTER + SORT ----------
  const filtered = useMemo(() => {
    const norm = (s) => (s || "").toString().toLowerCase();
    const kw = norm(q);

    let arr = !kw
      ? items
      : items.filter((p) =>
          `${p.name ?? ""} ${p.description ?? ""}`.toLowerCase().includes(kw)
        );

    const priceOf = (p) => Number(p.price_sale ?? p.price ?? p.unit_price ?? 0);

    // ====== NEW: apply price range if provided ======
    const min = Number(minPrice);
    const max = Number(maxPrice);
    const hasMin = minPrice !== "" && !Number.isNaN(min);
    const hasMax = maxPrice !== "" && !Number.isNaN(max);

    if (hasMin || hasMax) {
      arr = arr.filter((p) => {
        const price = priceOf(p);
        if (hasMin && price < min) return false;
        if (hasMax && price > max) return false;
        return true;
      });
    }

    switch (sort) {
      case "name_asc":
        arr = [...arr].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "price_asc":
        arr = [...arr].sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case "price_desc":
        arr = [...arr].sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case "new":
      default:
        arr = [...arr].sort((a, b) => {
          const ca = new Date(a.created_at || 0).getTime();
          const cb = new Date(b.created_at || 0).getTime();
          if (cb !== ca) return cb - ca;
          return (b.id || 0) - (a.id || 0);
        });
    }
    return arr;
  }, [items, q, sort, minPrice, maxPrice]);

  // ---------- helpers (UI) ----------
  const inputBase = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#0f172a",
    height: 40,
    borderRadius: 10,
  };

  const clearPrice = () => {
    setMinPrice("");
    setMaxPrice("");
  };

  // ---------- UI ----------
  return (
    <div
      className="page-wrap product-page"
      style={{ background: "#ffffff", color: "#0f172a" }}
    >
      {/* Toolbar */}
      <div
        className="u-card u-border"
        style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto",
          gap: 10,
          alignItems: "center",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 8px 30px rgba(17,24,39,.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Tất cả sản phẩm</h2>
          <span
            className="u-chip"
            style={{
              background: "#f1f5f9",
              borderColor: "#e5e7eb",
              color: "#0f172a",
              fontWeight: 800,
            }}
          >
            Tổng: {items.length}
          </span>
          {(q || minPrice !== "" || maxPrice !== "") && (
            <span
              className="u-chip"
              style={{
                background: "#eef2ff",
                borderColor: "#e0e7ff",
                color: "#3730a3",
                fontWeight: 700,
              }}
            >
              Kết quả: {filtered.length}
            </span>
          )}
        </div>

        {/* Search */}
        <input
          className="u-input"
          placeholder="🔍 Tìm sản phẩm…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 220, ...inputBase }}
        />

        {/* NEW: Min price */}
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className="u-input"
          placeholder="Giá từ"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ width: 120, ...inputBase }}
        />

        {/* NEW: Max price */}
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className="u-input"
          placeholder="Đến"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ width: 120, ...inputBase }}
        />

        {/* Sort */}
        <select
          className="u-input"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ ...inputBase }}
        >
          <option value="new">Mới nhất</option>
          <option value="name_asc">Tên A→Z</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </select>
      </div>

      {/* Quick actions under toolbar (optional) */}
      {(minPrice !== "" || maxPrice !== "") && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={clearPrice}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e5e7eb",
              padding: "6px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Xóa lọc giá
          </button>
        </div>
      )}

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: 260,
                borderRadius: 16,
                background:
                  "linear-gradient(90deg,#f1f5f9 25%,#e5e7eb 37%,#f1f5f9 63%)",
                backgroundSize: "400% 100%",
                animation: "sweep 1.2s ease-in-out infinite",
              }}
            />
          ))}
          <style>{`
            @keyframes sweep {
              0% { background-position: 100% 0 }
              100% { background-position: 0 0 }
            }
          `}</style>
        </div>
      ) : err && items.length === 0 ? (
        <p style={{ padding: 20, color: "#b91c1c" }}>{err}</p>
      ) : !items.length ? (
        <p style={{ padding: 20, color: "#334155" }}>Chưa có sản phẩm.</p>
      ) : (
        <div
          className="products-grid"
          style={{
            marginTop: 16,
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          }}
        >
          {filtered.map((p) => (
            <ProductCard
              key={p.id ?? `${p.product_id}-${p.slug ?? ""}`}
              p={{
                ...p,
                image:
                  p.thumbnail_url || p.thumbnail || p.image_url || PLACEHOLDER,
              }}
              // onAdd={() => addToCartLocal(p)}
            />
          ))}
        </div>
      )}

      <p style={{ marginTop: 24, textAlign: "center" }}>
        <Link
          to="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Về trang chủ
        </Link>
      </p>
    </div>
  );
}
