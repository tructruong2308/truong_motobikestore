import { useEffect, useMemo, useState } from "react";

/* ====== Config chung giống Users.jsx ====== */
const API_ROOT = "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT}/api`;
const ADMIN_API = `${API_BASE}/admin`;
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY  = "admin_user";

/* ======================== styles (tái sử dụng tone của Users) ======================== */
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
.admin-screen .badge.unread{ background:rgba(59,130,246,.14); color:#2563eb; border:1px solid rgba(59,130,246,.35) }
.admin-screen .badge.read{ background:rgba(34,197,94,.15); color:#16a34a; border:1px solid rgba(34,197,94,.35) }
.admin-screen .btn-danger{ background:#ef4444; color:white; border:none; border-radius:8px; padding:6px 10px; font-size:12px; cursor:pointer }
.admin-screen .btn-danger:hover{ filter:brightness(1.05) }
.admin-screen .btn-text{ cursor:pointer; border:none; background:transparent; color:#93c5fd; }
.admin-screen .pager{ display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px }

/* Slide-over detail */
.drawer{ position:fixed; inset:0; z-index:50; display:flex; justify-content:flex-end; background:rgba(2,6,23,.35) }
.drawer .panel{ width:min(540px,100%); height:100%; background:var(--panel); border-left:1px solid var(--line); display:flex; flex-direction:column }
.drawer .panel-hd{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 14px; border-bottom:1px solid var(--line); background:var(--panel-2) }
.drawer .panel-bd{ padding:14px; overflow:auto; flex:1 }
.drawer .row{ display:grid; grid-template-columns:120px 1fr; gap:10px; padding:10px 0; border-bottom:1px dashed var(--line-soft) }
.drawer .msg{ white-space:pre-wrap; line-height:1.6 }
`;

/* ======================== Chuẩn hoá dữ liệu ======================== */
const normBool = (v) => {
  if (v === true || v === 1 || v === "1") return true;
  if (typeof v === "string") return ["read","seen","true","yes"].includes(v.toLowerCase());
  return false;
};
const normalizeItem = (m) => ({
  id: m.id,
  name: m.name ?? m.full_name ?? "",
  email: m.email ?? "",
  phone: m.phone ?? m.sdt ?? "",
  subject: m.subject ?? m.title ?? "",
  message: m.message ?? m.content ?? "",
  is_read: normBool(m.is_read ?? (m.read_at ? 1 : 0)),
  read_at: m.read_at ?? null,
  created_at: m.created_at ?? m.createdAt ?? "",
});

/* ======================== Component ======================== */
export default function ContactsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [qView, setQView] = useState("");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [openId, setOpenId] = useState(null); // mở panel xem chi tiết

  /* ===== Auth header & xử lý 401 ===== */
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

  /* ===== API helpers ===== */
  const listEndpoint = `${ADMIN_API}/contacts`;
  const oneEndpoint  = (id) => `${ADMIN_API}/contacts/${id}`;

  async function fetchContacts() {
    try {
      setLoading(true);
      setErr("");
      const url = new URL(listEndpoint);
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(pageSize));

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json", ...authHeader() },
        cache: "no-store",
      });
      if (handleAuthFail(res.status)) return;
      if (!res.ok) throw new Error("Không tải được danh sách liên hệ");

      const data = await res.json().catch(() => ({}));
      const arr =
        (Array.isArray(data) && data) ||
        (Array.isArray(data.data) && data.data) ||
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data.contacts) && data.contacts) ||
        [];

      setItems(arr.map(normalizeItem));
    } catch (e) {
      setErr(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  /* ====== PATCH /read (hoặc fallback PATCH /{id} {status:'read'}) ====== */
  async function markRead(id) {
    let res = await fetch(`${oneEndpoint(id)}/read`, {
      method: "PATCH",
      headers: { Accept: "application/json", ...authHeader() },
    });

    if (!res.ok) {
      res = await fetch(oneEndpoint(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
        body: JSON.stringify({ status: "read" }),
      });
    }

    if (handleAuthFail(res.status)) return;
    if (!res.ok) return alert("❌ Đánh dấu đã đọc thất bại");

    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x))
    );
  }

  /* ====== PATCH /done (hoặc fallback PATCH /{id} {status:'done'}) ====== */
  async function markDone(id) {
    let res = await fetch(`${oneEndpoint(id)}/done`, {
      method: "PATCH",
      headers: { Accept: "application/json", ...authHeader() },
    });

    if (!res.ok) {
      res = await fetch(oneEndpoint(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
        body: JSON.stringify({ status: "done" }),
      });
    }

    if (handleAuthFail(res.status)) return;
    if (!res.ok) return alert("❌ Đánh dấu đã xử lý thất bại");

    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
  }

  async function removeContact(id) {
    if (!window.confirm("Xoá yêu cầu liên hệ này?")) return;
    try {
      const res = await fetch(oneEndpoint(id), {
        method: "DELETE",
        headers: { Accept: "application/json", ...authHeader() },
      });
      if (handleAuthFail(res.status)) return;
      if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
      else alert("❌ Xoá thất bại");
    } catch (e) {
      console.error(e);
    }
  }

  /* ===== Effects ===== */
  useEffect(() => { fetchContacts(); /* eslint-disable-next-line */ }, [page, pageSize, q]);
  useEffect(() => { const t = setTimeout(() => setQ(qView), 300); return () => clearTimeout(t); }, [qView]);

  /* ===== Derived ===== */
  const totalPages = 1; // server đã phân trang; client hiển thị nguyên trang trả về
  const list = useMemo(() => items, [items]);
  const opened = list.find((x) => x.id === openId) || null;

  /* ===== CSV Export ===== */
  const exportCSV = () => {
    const header = ["ID","Tên","Email","SĐT","Tiêu đề","Đã đọc","Tạo lúc"];
    const rows = list.map((m) => [
      m.id, m.name, m.email, m.phone, m.subject,
      m.is_read ? "read" : "unread",
      String(m.created_at || "")
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(x => `"${String(x ?? "").replaceAll('"','""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contacts_${Date.now()}.csv`;
    a.click();
  };

  return (
    <section className="admin-screen">
      <style>{styles}</style>

      {/* Toolbar */}
      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Liên hệ khách hàng</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={qView}
            onChange={(e) => setQView(e.target.value)}
            placeholder="Tìm theo tên, email, tiêu đề…"
          />
          <button className="btn" onClick={exportCSV}>Xuất CSV</button>
        </div>
      </div>

      {err && <p style={{ color: "#fecaca", marginTop: 8 }}>{err}</p>}
      {loading && <p style={{ color: "var(--muted)", marginTop: 8 }}>Đang tải dữ liệu…</p>}

      {!loading && (
        <>
          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người gửi</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Tiêu đề</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th>Thời gian</th>
                  <th style={{ textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.name || <span style={{opacity:.6}}>(không tên)</span>}</td>
                    <td>{m.email}</td>
                    <td>{m.phone}</td>
                    <td style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.subject || <span style={{opacity:.6}}>(không tiêu đề)</span>}
                    </td>
                    <td align="center">
                      {m.is_read ? (
                        <span className="badge read">Đã đọc</span>
                      ) : (
                        <span className="badge unread">Chưa đọc</span>
                      )}
                    </td>
                    <td>{m.created_at ? new Date(m.created_at).toLocaleString("vi-VN") : ""}</td>
                    <td align="center">
                      <button className="btn-text" onClick={() => setOpenId(m.id)}>Xem</button>
                      <span style={{ opacity: 0.35, margin: "0 6px" }}>|</span>
                      {/* Toggle: nếu chưa đọc -> đánh dấu đã đọc; nếu đã đọc -> đánh dấu đã xử lý */}
                      <button
                        className="btn-text"
                        onClick={() => (m.is_read ? markDone(m.id) : markRead(m.id))}
                      >
                        {m.is_read ? "Đánh dấu đã xử lý" : "Đánh dấu đã đọc"}
                      </button>
                      <span style={{ opacity: 0.35, margin: "0 6px" }}>|</span>
                      <button className="btn-danger" onClick={() => removeContact(m.id)}>Xoá</button>
                    </td>
                  </tr>
                ))}
                {!list.length && (
                  <tr>
                    <td colSpan={8} align="center" style={{ padding: 18, color: "var(--muted)" }}>
                      Chưa có yêu cầu liên hệ nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pager (server paging) */}
          <div className="pager">
            <span style={{ opacity: 0.7 }}>Trang {page}/{totalPages}</span>
            <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
            <button className="btn" onClick={() => setPage((p) => p + 1)}>Sau</button>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}
            >
              {[10, 20, 50].map((n) => (<option key={n} value={n}>{n}/trang</option>))}
            </select>
          </div>
        </>
      )}

      {/* Drawer chi tiết */}
      {opened && (
        <div className="drawer" onClick={() => setOpenId(null)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-hd">
              <b>Chi tiết liên hệ #{opened.id}</b>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  className="btn"
                  href={`mailto:${encodeURIComponent(opened.email)}?subject=${encodeURIComponent(
                    `[MotoBikeStore] Phản hồi: ${opened.subject || "Liên hệ"}`
                  )}`}
                >
                  Trả lời email
                </a>
                <button
                  className="btn"
                  onClick={() => (opened.is_read ? markDone(opened.id) : markRead(opened.id))}
                >
                  {opened.is_read ? "Đánh dấu đã xử lý" : "Đánh dấu đã đọc"}
                </button>
                <button className="btn-danger" onClick={() => { setOpenId(null); removeContact(opened.id); }}>
                  Xoá
                </button>
                <button className="btn" onClick={() => setOpenId(null)}>Đóng</button>
              </div>
            </div>
            <div className="panel-bd">
              <div className="row"><div>Người gửi</div><div>{opened.name || "—"}</div></div>
              <div className="row"><div>Email</div><div>{opened.email || "—"}</div></div>
              <div className="row"><div>Số điện thoại</div><div>{opened.phone || "—"}</div></div>
              <div className="row"><div>Tiêu đề</div><div>{opened.subject || "—"}</div></div>
              <div className="row"><div>Thời gian</div><div>{opened.created_at ? new Date(opened.created_at).toLocaleString("vi-VN") : "—"}</div></div>
              <div className="row" style={{ borderBottom: "none" }}>
                <div>Nội dung</div>
                <div className="msg">{opened.message || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
