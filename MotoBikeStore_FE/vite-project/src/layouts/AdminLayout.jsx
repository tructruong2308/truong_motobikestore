import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { useEffect } from "react";

const styles = `
:root{
  --bg:#0b0e14; --panel:#0e1320; --panel-2:#0b0f1a;
  --text:#e5e7eb; --muted:#a1a7b3;
  --line:rgba(100,116,139,.22); --line-soft:rgba(100,116,139,.14);
}
:root[data-theme="light"]{
  --bg:#f4f6f9; --panel:#ffffff; --panel-2:#f8fafc;
  --text:#0f172a; --muted:#475569;
  --line:rgba(15,23,42,.12); --line-soft:rgba(15,23,42,.08);
}
.admin-layout{ display:grid; grid-template-columns:240px 1fr; grid-template-rows:60px 1fr; height:100vh; background:var(--bg); color:var(--text); font-family:Inter, system-ui, sans-serif; }
.admin-layout aside{ grid-row:1 / span 2; background:#0b0f1a; border-right:1px solid var(--line); }
:root[data-theme="light"] .admin-layout aside{ background:#ffffff }
.admin-layout header{ grid-column:2; background:var(--panel-2); border-bottom:1px solid var(--line); position:sticky; top:0; z-index:20; }
.admin-layout main{ padding:20px; overflow:auto; }
`;

export default function AdminLayout() {
  // Guard ngay trong layout: nếu thiếu admin_token -> về trang login
  const hasToken = !!localStorage.getItem("admin_token");
  if (!hasToken) return <Navigate to="/admin/login" replace />;

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <div className="admin-layout">
      <style>{styles}</style>
      <aside><AdminSidebar /></aside>
      <header><AdminHeader /></header>
      <main><Outlet /></main>
    </div>
  );
}
