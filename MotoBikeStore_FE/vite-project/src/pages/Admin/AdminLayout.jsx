import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AdminLayout() {
  const [auth, setAuth] = useState({ checked: false, allow: false });

  useEffect(() => {
    const readAuth = () => {
      let token = "";
      let user = null;

      try {
        token = localStorage.getItem("admin_token") || "";
      } catch {}
      try {
        user = JSON.parse(localStorage.getItem("admin_user") || "null");
      } catch {
        user = null;
      }

      if (!token || !user) {
        setAuth({ checked: true, allow: false });
        return;
      }

      // Chấp nhận nhiều cách backend trả quyền:
      // - user.roles === "admin"
      // - user.roles là mảng và includes("admin")
      // - user.role === "admin"
      // - user.is_admin === true
      const roles = user?.roles;
      const isAdmin =
        roles === "admin" ||
        (Array.isArray(roles) && roles.includes("admin")) ||
        user?.role === "admin" ||
        user?.is_admin === true;

      setAuth({ checked: true, allow: !!isAdmin });
    };

    readAuth();

    // Đồng bộ đăng nhập/đăng xuất từ tab khác
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (["admin_token", "admin_user"].includes(e.key)) readAuth();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!auth.checked) {
    return <div className="p-6">⏳ Đang kiểm tra quyền truy cập...</div>;
  }

  if (!auth.allow) {
    // Không phải admin → quay về trang login admin
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div
      className="grid min-h-screen"
      style={{ gridTemplateColumns: "260px 1fr", gridTemplateRows: "64px 1fr" }}
    >
      {/* Sidebar */}
      <div className="bg-gray-900 text-white p-4">Sidebar Admin</div>
      {/* Header */}
      <div className="col-span-2 bg-gray-100 p-4">Header Admin</div>
      {/* Nội dung */}
      <main className="col-span-2 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
