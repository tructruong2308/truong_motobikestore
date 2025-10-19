import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
.admin-header{ height:60px; display:flex; align-items:center; justify-content:space-between; padding:0 16px;
  background:var(--panel-2); border-bottom:1px solid var(--line); color:var(--text) }
.admin-header .brand{ font-size:18px; font-weight:800; letter-spacing:.3px; color:#93c5fd; cursor:pointer }
.admin-header .right{ display:flex; align-items:center; gap:12px }
.admin-header .pill{ display:flex; align-items:center; gap:8px; border:1px solid var(--line); background:var(--panel);
  padding:6px 10px; border-radius:999px; }
.admin-header .btn{ padding:6px 12px; border-radius:10px; border:1px solid var(--line); background:#1f2937; color:var(--text); font-weight:600; cursor:pointer }
:root[data-theme="light"] .admin-header .btn{ background:#fff }
.admin-header .btn:hover{ filter:brightness(1.06) }
.admin-header .avatar{ width:36px; height:36px; border-radius:50%; background:#0f62fe; color:#fff; display:grid; place-items:center; font-weight:800 }
`;

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY  = "admin_user";

export default function AdminHeader() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");
  const navigate = useNavigate();

  // init user + theme
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
      setUser(u);
    } catch { setUser(null); }

    const t = localStorage.getItem("theme") || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    try {
      if (token) {
        // ưu tiên endpoint admin
        const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
        const tryCall = async (url) => fetch(url, { method: "POST", headers }).catch(() => {});
        await tryCall("http://127.0.0.1:8000/api/admin/logout");
        // fallback nếu BE chỉ có /logout
        await tryCall("http://127.0.0.1:8000/api/logout");
      }
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      navigate("/admin/login", { replace: true });
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // chuẩn hoá hiển thị role
  const roleLabel = (() => {
    const r = (user?.roles || user?.role || "").toString().toLowerCase();
    if (r === "admin") return "admin";
    if (r === "customer" || r === "user") return "customer";
    return r || "—";
  })();

  const avatarChar = (user?.name?.trim()?.[0] || "A").toUpperCase();

  return (
    <div className="admin-header">
      <style>{styles}</style>
      <strong className="brand" onClick={() => navigate("/admin")}>⚡ Admin Panel</strong>
      <div className="right">
        <button className="btn" onClick={toggleTheme}>
          {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
        </button>
        {user && (
          <div className="pill">
            <span style={{opacity:.8}}>👋 Xin chào,</span>
            <b>{user.name || "Admin"}</b>
            {!!roleLabel && <span className="u-chip" style={{marginLeft:6}}>{roleLabel}</span>}
          </div>
        )}
        <button className="btn" onClick={handleLogout}>Đăng xuất</button>
        <div className="avatar">{avatarChar}</div>
      </div>
    </div>
  );
}
