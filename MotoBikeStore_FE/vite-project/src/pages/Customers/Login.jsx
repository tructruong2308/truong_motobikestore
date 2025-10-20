// src/pages/Customers/Login.jsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Đăng nhập thất bại");
      }

      // ✅ Lưu cả key mới (customer_*) và key legacy (token/user) để tương thích
      localStorage.setItem("customer_token", data.token);
      localStorage.setItem("customer_user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);              // legacy cho các trang đang dùng
      localStorage.setItem("user", JSON.stringify(data.user)); // legacy cho các trang đang dùng

      // 🔄 Khôi phục giỏ theo user
      try {
        const u = data.user;
        const userCartKey = u?.id ? `cart_u_${u.id}` : "cart_guest";
        const saved = JSON.parse(localStorage.getItem(userCartKey) || "[]");
        localStorage.setItem("cart", JSON.stringify(Array.isArray(saved) ? saved : []));
        window.dispatchEvent(new Event("cart:refresh"));
      } catch {}

      // Cho header/cart sync biết
      window.dispatchEvent(new Event("user:refresh"));

      setMsg("✅ Đăng nhập thành công!");

      // Ưu tiên quay về nơi đã chặn khi thêm giỏ hàng
      const back = localStorage.getItem("post_login_redirect");
      if (back) {
        localStorage.removeItem("post_login_redirect");
        navigate(back, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setMsg("❌ " + (err.message || "Có lỗi xảy ra, vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    form.email.trim().length > 0 &&
    form.password.trim().length > 0 &&
    !loading;

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
      <div
        className="u-card u-border"
        style={{ width: "100%", maxWidth: 440, padding: 18 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="u-chip"
            style={{
              background: "rgba(15,23,42,.4)",
              borderColor: "rgba(148,163,184,.25)",
            }}
          >
            MotoBikeStore
          </div>
          <div className="u-chip">Khu vực khách hàng</div>
          <div style={{ flex: 1 }} />
          <div className="u-chip" title="MotoBikeStore" style={{ fontWeight: 800 }}>
            🏍️
          </div>
        </div>

        <h1
          style={{
            margin: "12px 0 4px",
            fontSize: 24,
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          Đăng nhập
        </h1>
        <p style={{ margin: 0, opacity: 0.85 }}>
          Nhập email và mật khẩu để tiếp tục mua sắm.
        </p>

        {msg && (
          <div
            className="u-card u-border"
            style={{
              marginTop: 12,
              padding: 10,
              borderColor: msg.startsWith("✅")
                ? "rgba(16,185,129,.35)"
                : "rgba(239,68,68,.35)",
              color: msg.startsWith("✅") ? "#6fe0b1" : "#fecaca",
              background: msg.startsWith("✅")
                ? "linear-gradient(180deg, rgba(6,78,59,.25), rgba(6,95,70,.2))"
                : "linear-gradient(180deg, rgba(127,29,29,.25), rgba(69,10,10,.25))",
            }}
          >
            {msg}
          </div>
        )}

        <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.9 }}
            >
              E-mail
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={onChange}
              className="u-input"
              style={{
                background: "rgba(2,6,23,.5)",
                borderColor: "rgba(148,163,184,.25)",
              }}
              autoFocus
              required
            />
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.9 }}
            >
              Mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                className="u-input"
                style={{
                  paddingRight: 82,
                  background: "rgba(2,6,23,.5)",
                  borderColor: "rgba(148,163,184,.25)",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="u-btn outline"
                style={{ position: "absolute", right: 6, top: 6, height: 30, padding: "0 10px" }}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="u-btn"
            disabled={!canSubmit}
            style={{
              opacity: canSubmit ? 1 : 0.6,
              cursor: canSubmit ? "pointer" : "not-allowed",
              marginTop: 4,
            }}
          >
            {loading ? "⏳ Đang đăng nhập..." : "🔓 Đăng nhập"}
          </button>
        </form>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: 0.8,
            fontSize: 13,
          }}
        >
          <span>
            Chưa có tài khoản?{" "}
            <Link className="u-chip" to="/register" style={{ textDecoration: "none" }}>
              Đăng ký
            </Link>
          </span>
          <a href="/" className="u-chip" style={{ textDecoration: "none" }}>
            ← Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
