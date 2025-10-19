import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY  = "admin_user";

function isAdminUser(u) {
  const r = u?.roles ?? u?.role ?? "";
  if (typeof r === "string") return r.toLowerCase() === "admin";
  if (Array.isArray(r)) return r.map(String).map(s=>s.toLowerCase()).includes("admin");
  return false;
}

export default function Dashboard() {
  const [auth, setAuth] = useState({ checked: false, allow: false });

  useEffect(() => {
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const user = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
      if (!token || !user) {
        setAuth({ checked: true, allow: false });
      } else {
        setAuth({ checked: true, allow: isAdminUser(user) });
      }
    } catch {
      setAuth({ checked: true, allow: false });
    }
  }, []);

  if (!auth.checked) {
    return <div className="p-6">⏳ Đang kiểm tra quyền truy cập...</div>;
  }
  if (!auth.allow) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <section className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Bảng điều khiển</h1>
      <div className="w-full max-w-3xl">
        <video width="75%" controls className="rounded-lg shadow-lg border">
          <source src="http://127.0.0.1:8000/assets/video/luffy.mp4" type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
      </div>
    </section>
  );
}
