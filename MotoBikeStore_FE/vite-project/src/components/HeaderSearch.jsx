// src/components/HeaderSearch.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_ROOT = "http://127.0.0.1:8000";
const money = (n) =>
  Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(+n || 0);

export default function HeaderSearch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(-1);

  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Đồng bộ với ?q= khi đang ở /products
  useEffect(() => {
    if (location.pathname.startsWith("/products")) {
      const sp = new URLSearchParams(location.search);
      setQ(sp.get("q") || "");
    }
  }, [location.pathname, location.search]);

  // Fetch gợi ý (debounce 250ms)
  useEffect(() => {
    const kw = q.trim();
    if (kw.length < 2) {
      setItems([]);
      setOpen(false);
      setIdx(-1);
      abortRef.current?.abort();
      return;
    }

    const ctl = new AbortController();
    abortRef.current = ctl;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const url = `${API_ROOT}/api/products?per_page=8&q=${encodeURIComponent(kw)}`;
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setItems(
          list.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price_sale ?? p.price ?? p.unit_price ?? 0,
            thumb: p.thumbnail_url || p.thumbnail || p.image_url || "",
          }))
        );
        setOpen(true);
        setIdx(-1);
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current?.contains(e.target)) {
        setOpen(false);
        setIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goSearch = () =>
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : `/products`);
  const goDetail = (id) => navigate(`/products/${id}`);

  const onKey = (e) => {
    if (!open || !items.length) {
      if (e.key === "Enter") {
        e.preventDefault();
        goSearch();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => (i + 1 >= items.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => (i - 1 < 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      idx > -1 ? goDetail(items[idx].id) : goSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
      setIdx(-1);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative", width: 420, maxWidth: "100%" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          idx > -1 ? goDetail(items[idx].id) : goSearch();
        }}
        style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}
      >
        <input
          ref={inputRef}
          aria-label="Tìm sản phẩm"
          className="u-input"
          placeholder="🔎 Tìm nhanh..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (q.trim().length >= 2 && items.length) setOpen(true);
          }}
          onKeyDown={onKey}
          style={{
            height: 38,
            minWidth: 220,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#0f172a",
            width: "100%",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,.03)",
          }}
        />
        <button
          type="submit"
          style={{
            height: 38,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #10b981",
            background: "#10b981",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,.05)",
          }}
        >
          Tìm
        </button>
      </form>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(17,24,39,.08)",
            zIndex: 2000,
            maxHeight: 360,
            overflowY: "auto",
            padding: 6,
          }}
        >
          {loading && (
            <div style={{ padding: "10px 12px", color: "#64748b", fontStyle: "italic" }}>
              Đang tìm…
            </div>
          )}

          {!loading && !items.length && (
            <div style={{ padding: "10px 12px", color: "#64748b" }}>
              Không có gợi ý. Nhấn Enter để tìm “{q.trim()}”.
            </div>
          )}

          {!loading &&
            items.map((it, i) => (
              <div
                key={it.id}
                role="option"
                aria-selected={i === idx}
                onMouseEnter={() => setIdx(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goDetail(it.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: i === idx ? "rgba(16,185,129,.10)" : "transparent",
                  border: i === idx ? "1px solid rgba(16,185,129,.25)" : "1px solid transparent",
                }}
              >
                <img
                  src={it.thumb || "https://placehold.co/56x42?text=No+Img"}
                  alt={it.name}
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/56x42?text=No+Img")}
                  style={{
                    width: 56,
                    height: 42,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    title={it.name}
                    style={{
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 700,
                    }}
                  >
                    {it.name}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Nhấn Enter để xem</div>
                </div>
                <div style={{ color: "#059669", fontWeight: 800 }}>{money(it.price)}</div>
              </div>
            ))}

          {!loading && q.trim() && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={goSearch}
              style={{
                marginTop: 4,
                padding: "10px 12px",
                borderTop: "1px dashed #e5e7eb",
                color: "#2563eb",
                cursor: "pointer",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              Tìm “{q.trim()}” trong tất cả sản phẩm →
            </div>
          )}
        </div>
      )}
    </div>
  );
}
