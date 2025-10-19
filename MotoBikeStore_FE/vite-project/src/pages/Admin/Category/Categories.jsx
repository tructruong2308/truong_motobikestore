// src/pages/Admin/Category/Categories.jsx
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const ADMIN_API = `${API_BASE}/admin`;
const ADMIN_TOKEN_KEY = "admin_token";
const PLACEHOLDER = "https://placehold.co/80x60?text=No+Img";

function removeVietnameseTones(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
function slugify(str = "") {
  const noAccent = removeVietnameseTones(str);
  return noAccent.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

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
.admin-screen .btn-text{ cursor:pointer; border:none; background:transparent; color:#93c5fd; }
.admin-screen .btn-text:hover{ text-decoration:underline }
.admin-screen .pager{ display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px }
.admin-screen .backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; padding:16px; z-index:50 }
.admin-screen .modal{ width:480px; background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:16px }
.admin-screen .modal h3{ margin:0 0 8px 0 }
.admin-screen .modal label div{ margin-bottom:4px; color:var(--muted) }
.admin-screen .modal input, .admin-screen .modal textarea, .admin-screen .modal select{ width:100%; color:var(--text); background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:10px }
.admin-screen .modal .row2{ display:grid; grid-template-columns:1fr 1fr; gap:10px }
.admin-screen .modal .actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:8px }
`;

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [qView, setQView] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state (hỗ trợ cả url ảnh và file ảnh)
  const [form, setForm] = useState({
    id: null,
    name: "",
    slug: "",
    image: "",          // URL ảnh (optional)
    imageFile: null,    // file ảnh (optional)
    sort_order: 0,
    description: "",
    parent_id: ""
  });

  // ===== helpers auth giống ProductAdd =====
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

  // ===== load list (public) =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr("");
        const res = await fetch(`${API_BASE}/categories`, { headers: headerWithToken(false) });
        if (res.status === 401 || res.status === 403) { handle401(); return; }
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setRows(data.data || data || []);
      } catch (e) {
        setErr("Không tải được danh mục.");
      } finally { setLoading(false); }
    })();
  }, []);

  // debounce search
  useEffect(() => { const t = setTimeout(() => setQ(qView), 300); return () => clearTimeout(t); }, [qView]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = !s ? rows : rows.filter((c) =>
      (c.name || "").toLowerCase().includes(s) || (c.slug || "").toLowerCase().includes(s)
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = (a[sort.key] ?? "").toString().toLowerCase();
      const bv = (b[sort.key] ?? "").toString().toLowerCase();
      if (av === bv) return 0; return av > bv ? dir : -dir;
    });
    return out;
  }, [q, rows, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [filtered, page, pageSize]
  );

  // ===== form handlers =====
  const onChangeForm = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      const file = files?.[0] || null;
      setForm((f) => ({ ...f, imageFile: file }));
      return;
    }
    setForm((f) => ({ ...f, [name]: name === "sort_order" ? Number(value) : value }));
  };
  const onChangeName = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, name: value, slug: f.slug || slugify(value) }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      slug: "",
      image: "",
      imageFile: null,
      sort_order: 0,
      description: "",
      parent_id: ""
    });
  };

  // ===== CREATE (Admin) =====
  const createCategory = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Nhập tên danh mục");

    try {
      setSaving(true);

      // Nếu có file ảnh -> dùng FormData; không thì gửi JSON
      let res;
      if (form.imageFile) {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        fd.append("slug", (form.slug || slugify(form.name)).trim());
        fd.append("sort_order", String(Number(form.sort_order) || 0));
        fd.append("description", form.description || "");
        if (form.parent_id) fd.append("parent_id", String(Number(form.parent_id)));
        fd.append("image", form.image || ""); // nếu BE vẫn nhận field image (text)
        fd.append("image_file", form.imageFile); // file ảnh (BE cần chấp nhận)

        res = await fetch(`${ADMIN_API}/categories`, {
          method: "POST",
          headers: headerWithToken(false), // KHÔNG set content-type khi gửi FormData
          body: fd,
        });
      } else {
        const payload = {
          name: form.name.trim(),
          slug: (form.slug || slugify(form.name)).trim(),
          image: form.image?.trim() || null,
          sort_order: Number(form.sort_order) || 0,
          description: form.description || "",
          parent_id: form.parent_id ? Number(form.parent_id) : null,
        };
        res = await fetch(`${ADMIN_API}/categories`, {
          method: "POST",
          headers: headerWithToken(true),
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401 || res.status === 403) { handle401(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data?.errors) {
          const msg = Object.values(data.errors).flat().join(", ");
          throw new Error(msg || "Dữ liệu không hợp lệ");
        }
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      const created = data.data || data;
      setRows((prev) => [created, ...prev]);
      setOpenAdd(false);
      resetForm();
      alert("✅ Tạo danh mục thành công!");
    } catch (e2) {
      alert("❌ Không thể tạo danh mục.\n" + (e2.message || ""));
    } finally { setSaving(false); }
  };

  // ===== EDIT (prefill) =====
  const startEdit = (c) => {
    setForm({
      id: c.id,
      name: c.name || "",
      slug: c.slug || "",
      image: c.image || c.image_url || "",
      imageFile: null,
      sort_order: c.sort_order || 0,
      description: c.description || "",
      parent_id: c.parent_id || ""
    });
    setOpenEdit(true);
  };

  // ===== UPDATE (Admin) =====
  const updateCategory = async (e) => {
    e.preventDefault();
    if (!form.id) return;

    try {
      setSaving(true);
      let res;

      if (form.imageFile) {
        // Có file mới -> PUT FormData
        const fd = new FormData();
        fd.append("name", form.name.trim());
        fd.append("slug", (form.slug || slugify(form.name)).trim());
        fd.append("sort_order", String(Number(form.sort_order) || 0));
        fd.append("description", form.description || "");
        fd.append("image", form.image || "");
        if (form.parent_id) fd.append("parent_id", String(Number(form.parent_id)));
        fd.append("_method", "PUT"); // nếu BE không nhận PUT với formdata, có thể dùng method spoofing
        fd.append("image_file", form.imageFile);

        res = await fetch(`${ADMIN_API}/categories/${form.id}`, {
          method: "POST",
          headers: headerWithToken(false),
          body: fd,
        });
      } else {
        // Không có file -> PUT JSON
        const payload = {
          name: form.name.trim(),
          slug: (form.slug || slugify(form.name)).trim(),
          image: form.image?.trim() || null,
          sort_order: Number(form.sort_order) || 0,
          description: form.description || "",
          parent_id: form.parent_id ? Number(form.parent_id) : null,
        };
        res = await fetch(`${ADMIN_API}/categories/${form.id}`, {
          method: "PUT",
          headers: headerWithToken(true),
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401 || res.status === 403) { handle401(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data?.errors) {
          const msg = Object.values(data.errors).flat().join(", ");
          throw new Error(msg || "Dữ liệu không hợp lệ");
        }
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      const updated = data.data || data;
      setRows(prev => prev.map(x => x.id === form.id ? { ...x, ...updated } : x));
      setOpenEdit(false);
      alert("✅ Cập nhật thành công!");
    } catch (e2) {
      alert("❌ " + (e2.message || "Không thể cập nhật."));
    } finally { setSaving(false); }
  };

  // ===== DELETE (Admin) =====
  const deleteCategory = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;
    try {
      const res = await fetch(`${ADMIN_API}/categories/${id}`, {
        method: "DELETE",
        headers: headerWithToken(false),
      });
      if (res.status === 401 || res.status === 403) { handle401(); return; }
      if (!res.ok) throw new Error("Xóa thất bại");
      setRows((prev) => prev.filter((x) => x.id !== id));
      alert("🗑️ Đã xóa.");
    } catch (e) {
      alert("❌ Không thể xóa. Có thể đang bị ràng buộc sản phẩm.\n" + (e.message || ""));
    }
  };

  // CSV export (giữ nguyên)
  const exportCSV = () => {
    const header = ["ID","Tên","Slug","ParentID","Sort","Image"];
    const rowsCSV = filtered.map(c => [c.id, c.name, c.slug, c.parent_id || "", c.sort_order || 0, c.image_url || c.image || ""]);
    const csv = [header, ...rowsCSV].map(r => r.map(x => `"${String(x ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `categories_${Date.now()}.csv`; a.click();
  };

  return (
    <section className="admin-screen">
      <style>{styles}</style>

      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Categories</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={qView} onChange={(e) => setQView(e.target.value)} placeholder="Tìm theo tên/slug…" />
          <select value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [k, d] = e.target.value.split(":"); setSort({ key: k, dir: d }); }}>
            <option value="name:asc">Tên A→Z</option>
            <option value="name:desc">Tên Z→A</option>
            <option value="slug:asc">Slug A→Z</option>
            <option value="slug:desc">Slug Z→A</option>
          </select>
          <button className="btn" onClick={exportCSV}>Xuất CSV</button>
          <button className="btn" onClick={() => setOpenAdd(true)}>+ Add</button>
        </div>
      </div>

      {loading && <p style={{ marginTop: 12, color: "var(--muted)" }}>Đang tải dữ liệu...</p>}
      {err && <p style={{ marginTop: 12, color: "#fecaca" }}>{err}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Tên</th><th>Slug</th><th>Ảnh</th><th style={{textAlign:"center"}}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>
                  <img
                    src={c.image_url || c.image || PLACEHOLDER}
                    alt={c.name}
                    style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, transition: "transform .2s" }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                  />
                </td>
                <td align="center">
                  <button className="btn-text" onClick={() => startEdit(c)}>Sửa</button>
                  <span style={{ opacity:.35, margin:"0 6px" }}>|</span>
                  <button className="btn-text" onClick={() => deleteCategory(c.id)} style={{ color:"#fca5a5" }}>Xóa</button>
                </td>
              </tr>
            ))}
            {!loading && pageItems.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 18, textAlign:"center", color:"var(--muted)" }}>Trống</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span style={{opacity:.7}}>Trang {page}/{totalPages}</span>
        <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
        <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
        <select value={pageSize} onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}>
          {[10,20,50].map(n => <option key={n} value={n}>{n}/trang</option>)}
        </select>
      </div>

      {/* Modal tạo */}
      {openAdd && (
        <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpenAdd(false); }}>
          <form onSubmit={createCategory} className="modal">
            <h3>Tạo danh mục</h3>
            <label><div>Tên *</div><input name="name" value={form.name} onChange={onChangeName} placeholder="Ví dụ: Áo thun" required /></label>
            <label><div>Slug *</div><input name="slug" value={form.slug} onChange={onChangeForm} placeholder="ao-thun" required /></label>
            <div className="row2">
              <label><div>Ảnh (URL)</div><input name="image" value={form.image} onChange={onChangeForm} placeholder="https://..." /></label>
              <label><div>Ảnh (File)</div><input type="file" accept="image/*" name="imageFile" onChange={onChangeForm} /></label>
            </div>
            <div className="row2">
              <label><div>Thứ tự</div><input type="number" name="sort_order" value={form.sort_order} onChange={onChangeForm} /></label>
              <label><div>Parent ID (nếu có)</div><input type="number" name="parent_id" value={form.parent_id} onChange={onChangeForm} /></label>
            </div>
            <label><div>Mô tả</div><textarea name="description" value={form.description} onChange={onChangeForm} rows={3} /></label>
            <div className="actions">
              <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Hủy</button>
              <button type="submit" className="btn" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal sửa */}
      {openEdit && (
        <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpenEdit(false); }}>
          <form onSubmit={updateCategory} className="modal">
            <h3>Sửa danh mục #{form.id}</h3>
            <label><div>Tên *</div><input name="name" value={form.name} onChange={onChangeName} required /></label>
            <label><div>Slug *</div><input name="slug" value={form.slug} onChange={onChangeForm} required /></label>
            <div className="row2">
              <label><div>Ảnh (URL)</div><input name="image" value={form.image} onChange={onChangeForm} /></label>
              <label><div>Đổi ảnh (File)</div><input type="file" accept="image/*" name="imageFile" onChange={onChangeForm} /></label>
            </div>
            <div className="row2">
              <label><div>Thứ tự</div><input type="number" name="sort_order" value={form.sort_order} onChange={onChangeForm} /></label>
              <label><div>Parent ID</div><input type="number" name="parent_id" value={form.parent_id} onChange={onChangeForm} /></label>
            </div>
            <label><div>Mô tả</div><textarea name="description" value={form.description} onChange={onChangeForm} rows={3} /></label>
            <div className="actions">
              <button type="button" className="btn" onClick={() => setOpenEdit(false)}>Hủy</button>
              <button type="submit" className="btn" disabled={saving}>{saving ? "Đang lưu..." : "Cập nhật"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
