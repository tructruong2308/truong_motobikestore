// src/pages/Admin/Product/ProductAdd.jsx
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const ADMIN_API = `${API_BASE}/admin`;
const ADMIN_TOKEN_KEY = "admin_token";

export default function ProductAdd() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ⚠️ BỎ brands
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    // brand_id: "",  // ❌ bỏ
    category_id: "",
    price_root: "",
    price_sale: "",
    qty: "",
    description: "",
    detail: "",
    status: true,
    thumbnail: null,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const salePercent = useMemo(() => {
    const root = Number(formData.price_root || 0);
    const sale = Number(formData.price_sale || 0);
    if (!root || !sale || sale >= root) return null;
    return Math.round(((root - sale) / root) * 100);
  }, [formData.price_root, formData.price_sale]);

  // Helpers auth
  const getAdminToken = () => {
    try { return localStorage.getItem(ADMIN_TOKEN_KEY) || ""; } catch { return ""; }
  };
  const handle401 = () => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem("admin_user");
    } catch {}
    window.location.href = "/admin/login";
  };
  const headerWithToken = (withJson = false) => {
    const t = getAdminToken();
    const h = { Accept: "application/json" };
    if (withJson) h["Content-Type"] = "application/json";
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  };

  // Chỉ load categories (KHÔNG gọi /api/brands nữa)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const resCat = await fetch(`${API_BASE}/categories`, {
          signal: ac.signal,
          headers: headerWithToken(false),
        });
        if (resCat.status === 401 || resCat.status === 403) { handle401(); return; }
        const c = await resCat.json().catch(() => ({}));
        setCategories(Array.isArray(c?.data) ? c.data : Array.isArray(c) ? c : []);
      } catch {}
    })();
    return () => ac.abort();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (type === "file") {
      const file = files?.[0];
      setFormData((prev) => ({ ...prev, thumbnail: file || null }));
      setThumbnailPreview(file ? URL.createObjectURL(file) : "");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, thumbnail: file }));
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client validate (KHÔNG kiểm tra brand)
    if (!formData.name.trim()) return setError("Tên sản phẩm là bắt buộc");
    if (!formData.price_root || Number(formData.price_root) <= 0)
      return setError("Giá gốc phải lớn hơn 0");
    if (!formData.category_id) return setError("Vui lòng chọn danh mục");
    if (formData.qty === "" || Number(formData.qty) < 0)
      return setError("Số lượng không hợp lệ");
    if (!formData.thumbnail) return setError("Ảnh đại diện là bắt buộc");

    try {
      setLoading(true);
      const fd = new FormData();

      // Append có điều kiện (tránh đẩy "" khiến BE validate lỗi)
      const add = (k, v) => { if (v !== "" && v !== null && v !== undefined) fd.append(k, v); };

      add("name", formData.name.trim());
      add("slug", (formData.slug || formData.name).trim().toLowerCase());
      add("category_id", String(Number(formData.category_id)));
      add("price_root", String(Number(formData.price_root)));
      if (formData.price_sale !== "" && Number(formData.price_sale) > 0) {
        add("price_sale", String(Number(formData.price_sale)));
      }
      add("qty", String(Number(formData.qty)));
      if (formData.description) add("description", formData.description);
      if (formData.detail) add("detail", formData.detail);
      add("status", formData.status ? "1" : "0");
      if (formData.thumbnail) fd.append("thumbnail", formData.thumbnail);

      const res = await fetch(`${ADMIN_API}/products`, {
        method: "POST",
        headers: headerWithToken(false), // KHÔNG set Content-Type khi gửi FormData
        body: fd,
      });

      if (res.status === 401 || res.status === 403) { handle401(); return; }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data?.errors) {
          const msg = Object.values(data.errors).flat().join(", ");
          throw new Error(msg || "Dữ liệu không hợp lệ");
        }
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      alert("✅ Thêm sản phẩm thành công!");
      navigate("/admin/products");
    } catch (err) {
      setError(err.message || "Có lỗi khi thêm sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Bạn có chắc muốn reset form?")) return;
    setFormData({
      name: "",
      slug: "",
      category_id: "",
      price_root: "",
      price_sale: "",
      qty: "",
      description: "",
      detail: "",
      status: true,
      thumbnail: null,
    });
    setThumbnailPreview("");
    setError("");
  };

  return (
    <div className="page">
      <style>{styles}</style>

      <div className="head">
        <div className="crumbs">
          <Link to="/admin/products" className="link">Sản phẩm</Link>
          <span>/</span>
          <span className="muted">Thêm mới</span>
        </div>
        <div className="actions">
          <Link to="/admin/products" className="btn ghost">← Quay lại</Link>
          <button className="btn primary" form="add-form" disabled={loading}>
            {loading ? "Đang xử lý…" : "Lưu"}
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <form id="add-form" onSubmit={handleSubmit} className="grid">
        <div className="col">
          <div className="card">
            <h3 className="card-title">Thông tin cơ bản</h3>
            <div className="row2">
              <label className="field">
                <span className="label">Tên sản phẩm *</span>
                <input className="input" name="name" value={formData.name} onChange={handleInputChange} required />
              </label>
              <label className="field">
                <span className="label">Slug</span>
                <input className="input" name="slug" value={formData.slug} onChange={handleInputChange} />
              </label>
            </div>

            <div className="row2">
              <label className="field">
                <span className="label">Danh mục *</span>
                <select className="input" name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <div className="field">
                <span className="label" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Giá & số lượng</h3>
            <div className="row3">
              <label className="field">
                <span className="label">Giá gốc *</span>
                <input className="input" type="number" min="0" name="price_root" value={formData.price_root} onChange={handleInputChange} required />
              </label>
              <label className="field">
                <span className="label">Giá khuyến mãi</span>
                <div className="with-note">
                  <input className="input" type="number" min="0" name="price_sale" value={formData.price_sale} onChange={handleInputChange} />
                  {salePercent !== null && <span className="note">−{salePercent}%</span>}
                </div>
              </label>
              <label className="field">
                <span className="label">Tồn kho *</span>
                <input className="input" type="number" min="0" name="qty" value={formData.qty} onChange={handleInputChange} required />
              </label>
            </div>
            <p className="hint">Nếu có giá khuyến mãi, vui lòng đảm bảo <b>Giá KM &lt; Giá gốc</b>.</p>
          </div>

          <div className="card">
            <h3 className="card-title">Mô tả</h3>
            <textarea className="textarea" name="description" rows={3} value={formData.description} onChange={handleInputChange} placeholder="Mô tả ngắn về sản phẩm..." />
          </div>

          <div className="card">
            <h3 className="card-title">Chi tiết (tuỳ chọn)</h3>
            <textarea className="textarea" name="detail" rows={6} value={formData.detail} onChange={handleInputChange} placeholder="Thông tin chi tiết, thông số..." />
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h3 className="card-title">Ảnh đại diện *</h3>
            <label className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
              <input id="thumb-input" type="file" name="thumbnail" accept="image/*" onChange={handleInputChange} style={{ display: "none" }} />
              {!thumbnailPreview ? (
                <div>
                  <div className="dz-icon">📷</div>
                  <div>Kéo & thả ảnh vào đây hoặc</div>
                  <button type="button" className="btn small" onClick={() => document.getElementById("thumb-input").click()}>Chọn ảnh…</button>
                </div>
              ) : (
                <div className="thumb-wrap">
                  <img src={thumbnailPreview} alt="preview" />
                  <div className="thumb-actions">
                    <button type="button" className="btn small ghost" onClick={() => document.getElementById("thumb-input").click()}>Đổi ảnh</button>
                    <button type="button" className="btn small danger" onClick={() => { setFormData((p) => ({ ...p, thumbnail: null })); setThumbnailPreview(""); }}>Xoá</button>
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className="card">
            <h3 className="card-title">Hiển thị</h3>
            <label className="switch">
              <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} />
              <span>Kích hoạt sản phẩm</span>
            </label>
            <p className="hint">Khi tắt, sản phẩm sẽ không xuất hiện ở trang người dùng.</p>
          </div>

          <div className="card actions-col">
            <button type="button" className="btn ghost" onClick={handleReset} disabled={loading}>Reset</button>
            <button type="submit" className="btn primary" form="add-form" disabled={loading}>{loading ? "Đang xử lý…" : "Thêm Sản Phẩm"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = `
.page{max-width:1100px;margin:0 auto;padding:16px}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}
.crumbs{display:flex;gap:8px;align-items:center;font-weight:600}
.crumbs .link{color:#2563eb;text-decoration:none}
.muted{opacity:.7}
.actions{display:flex;gap:8px}
.alert{background:#fee2e2;border:1px solid #fecaca;color:#7f1d1d;padding:10px 12px;border-radius:10px;margin-bottom:12px}
.grid{display:grid;grid-template-columns:1.5fr .9fr;gap:16px}
@media (max-width: 960px){ .grid{grid-template-columns:1fr} }
.col{display:grid;gap:16px}
.card{background:var(--panel,#0b1220);border:1px solid var(--line,#1f2937);border-radius:14px;padding:14px}
.card-title{margin:0 0 10px 0;font-size:16px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media (max-width: 720px){ .row2,.row3{grid-template-columns:1fr} }
.field{display:grid;gap:6px}
.label{opacity:.85}
.input,.textarea,select.input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#334155);background:var(--bg,#0a0f1a);color:var(--text,#e5e7eb)}
.input:focus,.textarea:focus,select.input:focus{outline:none;border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,.15)}
.textarea{min-height:90px;resize:vertical}
.with-note{position:relative}
.with-note .note{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-weight:700;color:#16a34a;background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.35);padding:2px 6px;border-radius:8px;font-size:12px}
.hint{margin:.25rem 0 0;font-size:12px;opacity:.75}
.dropzone{border:1px dashed #64748b;border-radius:14px;padding:16px;text-align:center;cursor:pointer;background:rgba(148,163,184,.06)}
.dropzone:hover{background:rgba(148,163,184,.09)}
.dz-icon{font-size:28px;margin-bottom:6px}
.thumb-wrap{display:grid;gap:10px;justify-items:center}
.thumb-wrap img{width:220px;max-width:100%;aspect-ratio:1.4/1;object-fit:cover;border-radius:12px;border:1px solid var(--line,#334155)}
.thumb-actions{display:flex;gap:8px}
.switch{display:flex;align-items:center;gap:10px}
.btn{border:1px solid var(--line,#334155);background:#111827;color:#e5e7eb;padding:8px 12px;border-radius:10px;font-weight:600;cursor:pointer}
.btn:hover{filter:brightness(1.05)}
.btn.ghost{background:transparent}
.btn.primary{background:#2563eb;border-color:#2563eb}
.btn.primary:hover{background:#1d4ed8;border-color:#1d4ed8}
.btn.small{padding:6px 10px;border-radius:8px}
.btn.danger{background:#dc2626;border-color:#dc2626}
.actions-col{display:grid;gap:8px}
`;
