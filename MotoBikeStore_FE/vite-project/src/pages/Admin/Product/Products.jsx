import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const ADMIN_API = `${API_BASE}/admin`;
const IMG_PLACEHOLDER = "https://placehold.co/50x50?text=No+Img";
const ADMIN_TOKEN_KEY = "admin_token";

const formatVND = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0";
};

// ===== Helpers =====
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// LẤY TỒN KHO: gom đủ biến thể tên cột (EN + VN) & nested
const getQty = (p) => {
  const candidates = [
    p?.qty,
    p?.stock,
    p?.stock_qty,
    p?.stock_quantity,
    p?.quantity,
    p?.available,
    p?.available_qty,
    p?.available_quantity,
    p?.inventory,
    p?.inventory_qty,
    p?.inventory_quantity,
    p?.stock_sum,         // withSum BE
    p?.stock_total,
    p?.total_qty,
    p?.total_quantity,
    p?.so_luong,          // VN
    p?.soLuong,
    p?.ton_kho,
    p?.tonkho,
    p?.pivot?.qty,
    p?.inventories?.total,
  ];
  for (const v of candidates) {
    const n = toNum(v);
    if (n !== 0) return n; // ưu tiên số khác 0
  }
  if (typeof p?.in_stock === "boolean") return p.in_stock ? 1 : 0;
  const maybe = candidates.map(toNum).find((n) => Number.isFinite(n));
  return toNum(maybe) || 0;
};

// Giá gốc (+các tên hay gặp)
const pickPriceRoot = (p) =>
  p?.price_root ?? p?.priceRoot ?? p?.price ?? p?.amount ?? 0;

// Giá sale (+các tên hay gặp)
const pickSalePrice = (p) =>
  p?.sale_price ?? p?.price_sale ?? p?.priceSale ?? p?.salePrice ?? null;

const isOnSale = (p) => {
  const root = Number(pickPriceRoot(p)) || 0;
  const sale = Number(pickSalePrice(p));
  return Number.isFinite(sale) && sale > 0 && root > 0 && sale < root;
};

const discountPercent = (p) => {
  if (!isOnSale(p)) return 0;
  const root = Number(pickPriceRoot(p)) || 0;
  const sale = Number(pickSalePrice(p));
  return Math.round(((root - sale) / root) * 100);
};

const getThumb = (p) => p?.thumbnail_url || p?.thumbnail || IMG_PLACEHOLDER;

const getCreatedAt = (p) => {
  const raw =
    p?.created_at?.date ||
    p?.created_at ||
    p?.createdAt ||
    p?.created ||
    p?.createdat;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
};

const styles = `
.admin-screen .toolbar{ display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap }
.admin-screen .toolbar input, .admin-screen .toolbar select{ height:36px; padding:0 10px; border-radius:10px; border:1px solid var(--line); background:var(--panel); color:var(--text) }
.admin-screen .toolbar .btn{ padding:8px 12px; border-radius:10px; border:1px solid var(--line); background:#1f2937; color:var(--text); font-weight:600; cursor:pointer }
:root[data-theme="light"] .admin-screen .toolbar .btn{ background:#fff }
.admin-screen .table-wrap{ border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--panel); margin-top:12px }
.admin-screen table{ width:100%; border-collapse:separate; border-spacing:0 }
.admin-screen thead th{ position:sticky; top:0; z-index:1; background:var(--panel-2); border-bottom:1px solid var(--line); padding:12px; text-align:left; font-weight:700; color:var(--text) }
.admin-screen tbody td{ padding:12px 14px; border-bottom:1px solid var(--line-soft); color:var(--text) }
.admin-screen tbody tr:hover{ background:rgba(148,163,184,.08) }
.admin-screen tbody tr:nth-child(even){ background:rgba(148,163,184,.05) }
.admin-screen .btn-text{ cursor:pointer; border:none; background:transparent; color:#93c5fd; }
.admin-screen .btn-text:hover{ text-decoration:underline }
.admin-screen .price-old{ text-decoration:line-through; opacity:.65 }
.admin-screen .sale-badge{ margin-left:6px; padding:2px 6px; border-radius:8px; font-size:12px; background:rgba(59,130,246,.15); color:#60a5fa; }
.admin-screen .percent-badge{ margin-left:6px; padding:2px 6px; border-radius:8px; font-size:12px; background:rgba(34,197,94,.15); color:#22c55e; }
.admin-screen .pager{ display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px }
.admin-screen .pager .btn{ padding:6px 10px; border-radius:10px; border:1px solid var(--line); background:#1f2937; color:var(--text); cursor:pointer }
`;

export default function Products() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [qView, setQView] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [onlyNew, setOnlyNew] = useState(false);
  const [newWithinDays, setNewWithinDays] = useState(30);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [onlySale, setOnlySale] = useState(false);

  // ---- Auth helpers (ADMIN) ----
  const getAdminToken = () => {
    try { return localStorage.getItem(ADMIN_TOKEN_KEY) || ""; } catch { return ""; }
  };
  const handle401 = () => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem("admin_user");
    } catch {}
    window.location.replace("/admin/login");
  };
  const adminHeader = (withJson = false) => {
    const token = getAdminToken();
    const h = { Accept: "application/json" };
    if (withJson) h["Content-Type"] = "application/json";
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  // Redirect nếu không có admin_token (UI admin)
  useEffect(() => {
    const t = getAdminToken();
    if (!t) window.location.replace("/admin/login");
  }, []);

  // ===== Data loaders =====
  const tryMergeStockSummary = async (products, signal) => {
    const token = getAdminToken();
    if (!token) return products;
    const ids = products.map((p) => p.id).filter(Boolean);
    if (ids.length === 0) return products;

    try {
      const res = await fetch(`${ADMIN_API}/stock/summary?ids=${ids.join(",")}`, {
        signal,
        headers: adminHeader(false),
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) { handle401(); return products; }
      if (!res.ok) return products;
      const data = await res.json().catch(() => ({}));
      const map = data?.data ?? data ?? {};
      return products.map((p) => {
        const v = map?.[p.id] ?? map?.[String(p.id)];
        const q = Number.isFinite(Number(v)) ? Number(v) : p.qty;
        return { ...p, qty: q };
      });
    } catch {
      return products;
    }
  };

  // Fetch đủ sản phẩm (xử lý phân trang Laravel)
  const loadItems = async (signal) => {
    const token = getAdminToken();
    const headers = adminHeader(false);

    // Ưu tiên admin/products có per_page lớn; fallback public
    const baseUrl = token ? `${ADMIN_API}/products` : `${API_BASE}/products`;
    const firstUrl = `${baseUrl}?per_page=500`; // nếu BE hỗ trợ → đủ 1 lần

    const fetchJson = async (url) => {
      const res = await fetch(url, { signal, headers, cache: "no-store" });
      if (res.status === 401 || res.status === 403) { handle401(); throw new Error("Unauthorized"); }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    let all = [];
    let data = await fetchJson(firstUrl).catch((e) => { throw e; });

    if (Array.isArray(data)) {
      all = data;
    } else {
      const pageItems =
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.data?.data) && data.data.data) ||
        [];
      all = [...pageItems];

      // Lặp theo next link nếu có
      let nextUrl = data?.links?.next || data?.next_page_url || null;
      while (nextUrl) {
        const d = await fetchJson(nextUrl);
        const more =
          (Array.isArray(d?.data) && d.data) ||
          (Array.isArray(d?.items) && d.items) ||
          (Array.isArray(d?.data?.data) && d.data.data) ||
          [];
        all.push(...more);
        nextUrl = d?.links?.next || d?.next_page_url || null;
      }

      // Hoặc lặp theo ?page=2..N nếu có last_page
      const lastPage = data?.meta?.last_page || data?.last_page;
      const currentPage = data?.meta?.current_page || data?.current_page || 1;
      if (!data?.links?.next && Number(lastPage) > Number(currentPage)) {
        for (let p = Number(currentPage) + 1; p <= Number(lastPage); p++) {
          const url = `${baseUrl}?page=${p}&per_page=500`;
          const d = await fetchJson(url);
          const more =
            (Array.isArray(d?.data) && d.data) ||
            (Array.isArray(d?.items) && d.items) ||
            (Array.isArray(d?.data?.data) && d.data.data) ||
            [];
          all.push(...more);
        }
      }
    }

    let normalized = all.map((p) => ({ ...p, qty: getQty(p) }));
    normalized = await tryMergeStockSummary(normalized, signal);
    setItems(normalized);
  };

  const loadCategories = async (signal) => {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const list =
        (Array.isArray(data) && data) ||
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.data?.data) && data.data.data) ||
        [];
      setCategories(list);
    } catch {}
  };

  // Fetch lần đầu
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        await Promise.all([loadItems(ac.signal), loadCategories(ac.signal)]);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được sản phẩm.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const handleRefresh = async () => {
    const ac = new AbortController();
    try {
      setLoading(true);
      setErr("");
      await Promise.all([loadItems(ac.signal), loadCategories(ac.signal)]);
    } catch (e) {
      if (e.name !== "AbortError") setErr("Không tải được sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setQ(qView), 300);
    return () => clearTimeout(t);
  }, [qView]);

  // ===== Filtering & Sorting =====
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = !s
      ? items
      : items.filter(
          (x) =>
            (x?.name || "").toLowerCase().includes(s) ||
            (x?.sku || "").toLowerCase().includes(s)
        );

    // Danh mục
    if (categoryId) {
      const cid = String(categoryId);
      out = out.filter((x) => {
        const id1 = x?.category_id;
        const id2 = x?.categoryId;
        const id3 = x?.category?.id;
        return [id1, id2, id3].some((v) => v !== undefined && String(v) === cid);
      });
    }

    // Chỉ giảm giá
    if (onlySale) out = out.filter(isOnSale);

    // Còn hàng
    if (inStockOnly) out = out.filter((x) => Number(x?.qty || 0) > 0);

    // Chỉ mới trong N ngày
    if (onlyNew) {
      const now = Date.now();
      const cut = newWithinDays * 24 * 60 * 60 * 1000;
      out = out.filter((x) => {
        const t = getCreatedAt(x);
        return t > 0 && now - t <= cut;
      });
    }

    // Sort
    const dir = sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      if (sort.key === "price_root") {
        const av = Number(pickPriceRoot(a)) || 0;
        const bv = Number(pickPriceRoot(b)) || 0;
        return (av - bv) * dir;
      }
      if (sort.key === "qty") {
        const av = Number(a?.qty || 0);
        const bv = Number(b?.qty || 0);
        return (av - bv) * dir;
      }
      if (sort.key === "created_at") {
        const av = getCreatedAt(a);
        const bv = getCreatedAt(b);
        return (av - bv) * dir; // desc = mới nhất
      }
      const av = (a?.name || "").toString();
      const bv = (b?.name || "").toString();
      return av.localeCompare(bv, "vi", { sensitivity: "base" }) * dir;
    });

    return out;
  }, [items, q, sort, onlyNew, newWithinDays, inStockOnly, categoryId, onlySale]);

  // Paging state
  useEffect(() => {
    setPage(1);
  }, [q, sort, pageSize, onlyNew, newWithinDays, inStockOnly, categoryId, onlySale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [filtered, page, pageSize]
  );

  // ===== Actions =====
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name || id}"?`)) return;
    try {
      const res = await fetch(`${ADMIN_API}/products/${id}`, {
        method: "DELETE",
        headers: adminHeader(false),
      });
      if (res.status === 401 || res.status === 403) { handle401(); return; }
      if (!res.ok) throw new Error("Xóa thất bại");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert("❌ Không thể xóa sản phẩm.");
    }
  };

  const exportCSV = () => {
    const header = ["ID", "Tên", "SKU", "Giá gốc", "Giá giảm", "% giảm", "Tồn", "Ngày tạo", "Danh mục"];
    const rows = filtered.map((p) => [
      p.id,
      p.name,
      p.sku,
      pickPriceRoot(p),
      pickSalePrice(p) ?? "",
      discountPercent(p),
      Number(p.qty || 0),
      new Date(getCreatedAt(p) || 0).toISOString().slice(0, 19).replace("T", " "),
      p?.category?.name ?? p?.category_name ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `products_${Date.now()}.csv`;
    a.click();
  };

  const resetFilters = () => {
    setQView(""); setQ("");
    setOnlyNew(false); setNewWithinDays(30);
    setInStockOnly(false); setCategoryId(""); setOnlySale(false);
    setSort({ key: "name", dir: "asc" });
    setPageSize(10);
  };

  // ===== UI =====
  return (
    <section className="admin-screen">
      <style>{styles}</style>

      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Products</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={qView}
            onChange={(e) => setQView(e.target.value)}
            placeholder="Tìm tên/SKU…"
            aria-label="Tìm kiếm sản phẩm"
          />

          {/* Sort */}
          <select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":");
              setSort({ key: k, dir: d });
            }}
            aria-label="Sắp xếp"
          >
            <option value="name:asc">Tên A→Z</option>
            <option value="name:desc">Tên Z→A</option>
            <option value="price_root:asc">Giá gốc ↑</option>
            <option value="price_root:desc">Giá gốc ↓</option>
            <option value="qty:desc">Tồn ↓</option>
            <option value="qty:asc">Tồn ↑</option>
            <option value="created_at:desc">Mới nhất</option>
            <option value="created_at:asc">Cũ nhất</option>
          </select>

          {/* Danh mục */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            title="Lọc theo danh mục"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Chỉ giảm giá */}
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} />
            Chỉ đang giảm giá
          </label>

          {/* Chỉ mới trong N ngày */}
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
            Chỉ sản phẩm mới
          </label>
          <select
            value={newWithinDays}
            onChange={(e) => setNewWithinDays(Number(e.target.value))}
            disabled={!onlyNew}
            title="Trong vòng N ngày"
          >
            {[7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>{d} ngày</option>
            ))}
          </select>

          {/* Chỉ còn hàng */}
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
            Chỉ còn hàng
          </label>

          <button className="btn" onClick={exportCSV}>Xuất CSV</button>
          <button className="btn" onClick={() => navigate("/admin/products/new")}>+ Thêm</button>
          <button className="btn" onClick={handleRefresh} title="Làm mới dữ liệu">Làm mới</button>
          <button className="btn" onClick={resetFilters} title="Xoá mọi lọc">Xoá lọc</button>
        </div>
      </div>

      {loading && <p style={{ marginTop: 12, color: "var(--muted)" }}>Đang tải dữ liệu...</p>}
      {err && <p style={{ marginTop: 12, color: "#fecaca" }}>{err}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>SKU</th>
              <th style={{ textAlign: "right" }}>Giá gốc</th>
              <th style={{ textAlign: "right" }}>Giá giảm</th>
              <th style={{ textAlign: "right" }}>Tồn</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => {
              const root = Number(pickPriceRoot(p)) || 0;
              const saleRaw = pickSalePrice(p);
              const sale = Number(saleRaw);
              const onSale = isOnSale(p);
              const percent = discountPercent(p);

              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <img
                      src={getThumb(p)}
                      alt={p.name}
                      style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8, transition: "transform .2s" }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.5)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onError={(e) => { e.currentTarget.src = IMG_PLACEHOLDER; }}
                    />
                  </td>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>

                  {/* Giá gốc */}
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span className={onSale ? "price-old" : ""}>
                      ₫{formatVND(root)}
                    </span>
                    {onSale && <span className="percent-badge">-{percent}%</span>}
                  </td>

                  {/* Giá giảm */}
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {onSale ? (
                      <>
                        ₫{formatVND(sale)}
                        <span className="sale-badge">SALE</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Tồn */}
                  <td style={{ textAlign: "right" }}>
                    {Number(p?.qty ?? 0)}
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "2px 6px",
                        borderRadius: 8,
                        fontSize: 12,
                        background: Number(p?.qty ?? 0) > 0 ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
                        color: Number(p?.qty ?? 0) > 0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {Number(p?.qty ?? 0) > 0 ? "Còn" : "Hết"}
                    </span>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <button className="btn-text" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>Sửa</button>
                    <span style={{ opacity: 0.35, margin: "0 6px" }}>|</span>
                    <button className="btn-text" onClick={() => handleDelete(p.id, p.name)}>Xóa</button>
                  </td>
                </tr>
              );
            })}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 18, textAlign: "center", color: "var(--muted)" }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span style={{ opacity: 0.7 }}>
          Trang {page}/{totalPages} · Tổng {filtered.length} SP
        </span>
        <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Trước
        </button>
        <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Sau
        </button>
        <select value={pageSize} onChange={(e) => { setPageSize(+e.target.value); }}>
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}/trang</option>
          ))}
        </select>
      </div>
    </section>
  );
}
