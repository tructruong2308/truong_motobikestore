import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const ADMIN_LOGIN_URL = `${API_BASE}/api/admin/login`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(ADMIN_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Đăng nhập thất bại");
      }

      // 🔑 LƯU ĐÚNG KEY CHO ADMIN
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    form.email.trim() && form.password.trim() && !loading;

  return (
    <div
      className="page-wrap"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background:
          "radial-gradient(1000px 600px at 10% -10%, #1f2937 0%, transparent 55%), radial-gradient(1000px 600px at 110% 10%, #0ea5e9 0%, transparent 50%), #0b1320",
      }}
    >
      <div className="u-card u-border" style={{ width: "100%", maxWidth: 460, padding: 18 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="u-chip" style={{ background: "rgba(15,23,42,.4)", borderColor: "rgba(148,163,184,.25)" }}>
            Cửa hàng xe máy
          </div>
          <div className="u-chip">Hệ thống quản trị</div>
          <div style={{ flex: 1 }} />
          <div className="u-chip" title="MotoBikeStore" style={{ fontWeight: 800 }}>🏍️</div>
        </div>

        <h1 style={{ margin: "12px 0 4px", fontSize: 24, fontWeight: 900, lineHeight: 1.2 }}>
          Đăng nhập quản trị viên
        </h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Nhập email và mật khẩu để tiếp tục.</p>

        {error && (
          <div
            className="u-card u-border"
            style={{
              marginTop: 12,
              padding: 10,
              borderColor: "rgba(239,68,68,.35)",
              color: "#fecaca",
              background: "linear-gradient(180deg, rgba(127,29,29,.25), rgba(69,10,10,.25))",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.9 }}>E-mail</label>
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={onChange}
              className="u-input"
              style={{
                background: "rgba(2,6,23,.5)",
                borderColor: "rgba(148,163,184,.25)",
                width: "calc(50% + 160px)",
                marginRight: "-160px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.9 }}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                className="u-input"
                style={{ paddingRight: 82, background: "rgba(2,6,23,.5)", borderColor: "rgba(148,163,184,.25)" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="u-btn outline"
                style={{ position: "absolute", right: 6, top: 6, height: 30, padding: "0 10px" }}
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <button type="submit" className="u-btn" disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.6, cursor: canSubmit ? "pointer" : "not-allowed", marginTop: 4 }}>
            {loading ? "⏳ Đang đăng nhập..." : "🚀 Đăng nhập"}
          </button>
        </form>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7, fontSize: 12 }}>
          <span>© {new Date().getFullYear()} MotoBikeStore – Admin</span>
          <a href="/" className="u-chip" style={{ textDecoration: "none" }}>← Về trang chủ</a>
        </div>
      </div>
    </div>
  );
}
