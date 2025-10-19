// src/pages/Admin/User/Users.jsx
import { useEffect, useMemo, useState } from "react";

const API_ROOT = "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT}/api`;
const ADMIN_API = `${API_BASE}/admin`;
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";
const AVA_PLACEHOLDER = "https://placehold.co/40x40?text=U";

/* ======================== styles ======================== */
const styles = `
.admin-screen .toolbar{ display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap }
.admin-screen .toolbar input, .admin-screen .toolbar select{ height:36px; padding:0 10px; border-radius:10px; border:1px solid var(--line); background:var(--panel); color:var(--text); min-width:220px }
.admin-screen .toolbar .btn{ padding:8px 12px; border-radius:10px; border:1px solid var(--line); background:#1f2937; color:var(--text); font-weight:600; cursor:pointer }
:root[data-theme="light"] .admin-screen .toolbar .btn{ background:#fff }
.admin-screen .table-wrap{ border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--panel); margin-top:12px }
.admin-screen table{ width:100%; border-collapse:separate; border-spacing:0; font-size:14px }
.admin-screen thead th{ position:sticky; top:0; z-index:1; background:var(--panel-2); border-bottom:1px solid var(--line); padding:12px; text-align:left; font-weight:700; color:var(--text) }
.admin-screen tbody td{ padding:12px 14px; border-bottom:1px solid var(--line-soft); color:var(--text) }
.admin-screen tbody tr:hover{ background:rgba(148,163,184,.08) }
.admin-screen .badge{ border-radius:999px; padding:2px 8px; font-size:12px; }
.admin-screen .badge.active{ background:rgba(34,197,94,.15); color:#16a34a; border:1px solid rgba(34,197,94,.35) }
.admin-screen .badge.lock{ background:rgba(148,163,184,.2); color:#334155; border:1px solid rgba(148,163,184,.35) }
.admin-screen .btn-danger{ background:#ef4444; color:white; border:none; border-radius:8px; padding:6px 10px; font-size:12px; cursor:pointer }
.admin-screen .btn-danger:hover{ filter:brightness(1.05) }
.admin-screen .pager{ display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px }
.admin-screen .btn-text{ cursor:pointer; border:none; background:transparent; color:#93c5fd; }
`;

/* ======================== role mapping (FE <-> BE) ======================== */
const ROLE_OPTIONS = [
  { label: "quản trị viên", value: "admin" },
  { label: "khách", value: "customer" },
];
const toServerRole = (clientValue) => (clientValue === "admin" ? "admin" : "customer");
const fromServerRole = (serverValue) => (serverValue === "admin" ? "admin" : "customer");

/* ======================== helpers ======================== */
const resolveAvatar = (u) => {
  // Ưu tiên avatar_url (BE đã chuẩn hoá absolute URL nhờ accessor)
  const raw =
    u.avatar_url ??
    u.profile_photo_url ??
    u.image_url ??
    u.photo_url ??
    u.avatar ??
    u.image ??
    u.photo ??
    u.profile_image ??
    "";

  if (!raw) return AVA_PLACEHOLDER;

  // Absolute URL → dùng luôn
  if (typeof raw === "string" && /^https?:\/\//i.test(raw)) return raw;

  // /storage/... hoặc storage/... → ghép API_ROOT
  if (typeof raw === "string") {
    const r = raw.replace(/^\//, "");
    if (r.startsWith("storage/")) {
      return `${API_ROOT}/${r}`;
    }
    // Trường hợp chỉ là tên file hoặc path không có "storage/" → giả định lưu trên public disk
    return `${API_ROOT}/storage/${r}`;
  }

  return AVA_PLACEHOLDER;
};

/* ======================== normalizers ======================== */
const normStatus = (u) => {
  if (typeof u.status === "number") return u.status;
  if (typeof u.status === "boolean") return u.status ? 1 : 0;
  const s = String(u.status ?? "").toLowerCase();
  if (s === "active" || s === "enabled") return 1;
  if (s === "locked" || s === "disabled" || s === "banned") return 0;
  return 1;
};
const normRole = (u) => fromServerRole(u.role ?? u.roles ?? "customer");
const normCreatedAt = (u) => u.created_at ?? u.createdAt ?? u.created ?? "";

const normalizeUser = (u) => ({
  id: u.id,
  name: u.name ?? "",
  email: u.email ?? "",
  username: u.username ?? "",
  roles: normRole(u),        // "admin" | "customer"
  status: normStatus(u),     // 1 | 0
  created_at: normCreatedAt(u),
  avatar_url: resolveAvatar(u), // ✅ avatar đã chuẩn hoá
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [qView, setQView] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const handleAuthFail = (status) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      window.location.href = "/admin/login";
      return true;
    }
    return false;
  };

  /* ======================== API helpers ======================== */
  async function putUser(id, payload) {
    const res = await fetch(`${ADMIN_API}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (handleAuthFail(res.status)) return null;
    if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  async function postUserAction(id, action) {
    const res = await fetch(`${ADMIN_API}/users/${id}/${action}`, {
      method: "POST",
      headers: { Accept: "application/json", ...authHeader() },
      cache: "no-store",
    });
    if (handleAuthFail(res.status)) return null;
    if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  /* ======================== CRUD ======================== */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErr("");
      const url = new URL(`${ADMIN_API}/users`);
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(pageSize));

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json", ...authHeader() },
        cache: "no-store",
      });
      if (handleAuthFail(res.status)) return;
      if (!res.ok) throw new Error("Không tải được danh sách người dùng");

      const data = await res.json().catch(() => ({}));
      const arr =
        (Array.isArray(data) && data) ||
        (Array.isArray(data.data) && data.data) ||
        (Array.isArray(data.users) && data.users) ||
        (Array.isArray(data.items) && data.items) ||
        [];
      setUsers(arr.map(normalizeUser));
    } catch (e) {
      setErr(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Xoá người dùng này?")) return;
    try {
      const res = await fetch(`${ADMIN_API}/users/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", ...authHeader() },
      });
      if (handleAuthFail(res.status)) return;
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
      else alert("❌ Xoá thất bại");
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const updateRole = async (u, clientRoleValue) => {
    const serverRole = toServerRole(clientRoleValue);
    try {
      await putUser(u.id, { roles: serverRole });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, roles: clientRoleValue } : x)));
    } catch {
      alert("❌ Cập nhật vai trò thất bại");
    }
  };

  const toggleStatus = async (u) => {
    const nextIsLock = u.status === 1;
    try {
      await postUserAction(u.id, nextIsLock ? "lock" : "unlock");
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status: nextIsLock ? 0 : 1 } : x))
      );
    } catch {
      alert("❌ Cập nhật trạng thái thất bại");
    }
  };

  /* ======================== effects ======================== */
  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [page, pageSize, q]);
  useEffect(() => {
    const t = setTimeout(() => setQ(qView), 300);
    return () => clearTimeout(t);
  }, [qView]);

  /* ======================== derived ======================== */
  const filtered = useMemo(() => users, [users]);
  const totalPages = 1;
  const pageItems = filtered;

  // CSV
  const exportCSV = () => {
    const header = ["ID", "Tên", "E-mail", "Username", "Vai trò", "Trạng thái", "Tạo lúc"];
    const rows = filtered.map((u) => [
      u.id,
      u.name,
      u.email,
      u.username,
      u.roles,
      u.status === 1 ? "active" : "locked",
      String(u.created_at || ""),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `users_${Date.now()}.csv`;
    a.click();
  };

  /* ======================== render ======================== */
  return (
    <section className="admin-screen">
      <style>{styles}</style>

      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Người dùng</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={qView} onChange={(e) => setQView(e.target.value)} placeholder="Tìm theo tên, email, role…" />
          <button className="btn" onClick={exportCSV}>Xuất CSV</button>
        </div>
      </div>

      {err && <p style={{ color: "#fecaca", marginTop: 8 }}>{err}</p>}
      {loading && <p style={{ color: "var(--muted)", marginTop: 8 }}>Đang tải dữ liệu…</p>}

      {!loading && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>E-mail</th>
                  <th>Tên người dùng</th>
                  <th>Vai trò</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th style={{ textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <img
                        src={u.avatar_url || AVA_PLACEHOLDER}
                        alt={u.name || `user-${u.id}`}
                        onError={(e) => (e.currentTarget.src = AVA_PLACEHOLDER)}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: "50%",
                          border: "1px solid var(--line)",
                          background: "var(--panel-2)",
                        }}
                      />
                    </td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.username}</td>
                    <td>
                      <select
                        value={u.roles}
                        onChange={(e) => updateRole(u, e.target.value)}
                        style={{ background:"var(--panel)", border:"1px solid var(--line)", color:"var(--text)", borderRadius:8, height:30 }}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td align="center">
                      {u.status === 1 ? <span className="badge active">Hoạt động</span> : <span className="badge lock">Khoá</span>}
                    </td>
                    <td align="center">
                      <button className="btn-text" onClick={() => toggleStatus(u)}>{u.status === 1 ? "Khoá" : "Mở khoá"}</button>
                      <span style={{ opacity: 0.35, margin: "0 6px" }}>|</span>
                      <button onClick={() => removeUser(u.id)} className="btn-danger">Xoá</button>
                    </td>
                  </tr>
                ))}
                {!pageItems.length && (
                  <tr>
                    <td colSpan={8} align="center" style={{ padding: 18, color: "var(--muted)" }}>
                      Không có người dùng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <span style={{ opacity: 0.7 }}>Trang {page}/{totalPages}</span>
            <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
            <button className="btn" onClick={() => setPage((p) => p + 1)}>Sau</button>
            <select value={pageSize} onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}>
              {[10, 20, 50].map((n) => (<option key={n} value={n}>{n}/trang</option>))}
            </select>
          </div>
        </>
      )}
    </section>
  );
}
