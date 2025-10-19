// src/pages/Customers/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    avatar: null,
  });
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((s) => ({ ...s, avatar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("❌ Mật khẩu nhập lại không khớp!");
      return;
    }
    setMessage("");
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("username", form.username);
      fd.append("password", form.password);
      fd.append("password_confirmation", form.confirmPassword);
      fd.append("phone", form.phone);
      if (form.avatar) fd.append("avatar", form.avatar);

      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage("❌ " + (data?.message || "Đăng ký thất bại"));
        return;
      }
      setMessage("✅ Đăng ký thành công! Đang chuyển sang trang đăng nhập…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMessage("❌ Lỗi kết nối: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== UI HELPERS ==========
  const card = {
    width: "100%",
    maxWidth: 520,
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,.25)",
    background:
      "linear-gradient(180deg, rgba(15,23,42,.55), rgba(2,6,23,.65))",
    boxShadow:
      "0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)",
    color: "#e5e7eb",
  };

  const label = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: .2,
    opacity: .92,
  };

  const input = {
    width: "100%",
    height: 44,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,.28)",
    background: "rgba(2,6,23,.6)",
    color: "#e5e7eb",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
  };

  const inputFocus = {
    borderColor: "rgba(59,130,246,.6)",
    boxShadow: "0 0 0 3px rgba(59,130,246,.25)",
  };

  const chip = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,.25)",
    background: "rgba(15,23,42,.35)",
    fontSize: 12,
  };

  const btn = (disabled) => ({
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(16,185,129,.55)",
    background:
      "linear-gradient(180deg, rgba(16,185,129,.35), rgba(5,150,105,.4))",
    color: "#ecfdf5",
    fontWeight: 800,
    letterSpacing: .3,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? .65 : 1,
    transition: "transform .06s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "radial-gradient(1100px 650px at 8% -12%, #1f2937 0%, transparent 55%), radial-gradient(1100px 650px at 108% 12%, #0ea5e9 0%, transparent 50%), #0b1320",
      }}
    >
      <div className="u-card u-border" style={card}>
        {/* Header nhỏ đồng bộ */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="u-chip" style={chip}>MotoBikeStore</div>
          <div className="u-chip" style={chip}>Tạo tài khoản</div>
          <div style={{ flex: 1 }} />
          <div className="u-chip" title="MotoBikeStore" style={{ ...chip, fontWeight: 800 }}>
            🏍️
          </div>
        </div>

        <h1
          style={{
            margin: "14px 0 6px",
            fontSize: 26,
            fontWeight: 900,
            lineHeight: 1.2,
            color: "#f8fafc",
            textShadow: "0 1px 0 rgba(0,0,0,.35)",
          }}
        >
          Đăng ký tài khoản
        </h1>
        <p style={{ margin: 0, opacity: .8, fontSize: 13.5 }}>
          Nhập thông tin để tạo tài khoản mới.
        </p>

        {message && (
          <div
            className="u-card u-border"
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${
                message.startsWith("✅")
                  ? "rgba(16,185,129,.5)"
                  : "rgba(239,68,68,.5)"
              }`,
              background: message.startsWith("✅")
                ? "linear-gradient(180deg, rgba(6,78,59,.25), rgba(2,44,34,.25))"
                : "linear-gradient(180deg, rgba(127,29,29,.25), rgba(69,10,10,.25))",
              color: message.startsWith("✅") ? "#A7F3D0" : "#FECACA",
              fontSize: 13.5,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={submit} style={{ marginTop: 16, display: "grid", gap: 14 }}>
          {/* Họ tên */}
          <div>
            <label style={label}>Họ tên</label>
            <input
              className="u-input"
              name="name"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={onChange}
              required
              style={input}
              onFocus={(e) => Object.assign(e.target.style, inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, input)}
            />
          </div>

          {/* Tên đăng nhập */}
          <div>
            <label style={label}>Tên đăng nhập</label>
            <input
              className="u-input"
              name="username"
              placeholder="username"
              value={form.username}
              onChange={onChange}
              required
              style={input}
              onFocus={(e) => Object.assign(e.target.style, inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, input)}
            />
          </div>

          {/* Email */}
          <div>
            <label style={label}>E-mail</label>
            <input
              className="u-input"
              type="email"
              name="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={onChange}
              required
              style={input}
              onFocus={(e) => Object.assign(e.target.style, inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, input)}
            />
          </div>

          {/* Avatar */}
          <div>
            <label style={label}>Ảnh đại diện</label>
            <div
              style={{
                border: "1px dashed rgba(148,163,184,.35)",
                background: "rgba(2,6,23,.4)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <label
                className="u-btn outline"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,.45)",
                  background: "rgba(15,23,42,.35)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                Chọn ảnh…
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
              </label>

              <div style={{ fontSize: 12.5, opacity: .85 }}>
                PNG/JPG/WEBP ≤ 2MB. Nên chọn ảnh vuông.
              </div>

              {preview && (
                <img
                  src={preview}
                  alt="avatar preview"
                  style={{
                    marginLeft: "auto",
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,.25)",
                    boxShadow: "0 6px 16px rgba(0,0,0,.35)",
                  }}
                />
              )}
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label style={label}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                className="u-input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
                style={{ ...input, paddingRight: 88 }}
                onFocus={(e) => Object.assign(e.target.style, { ...input, ...inputFocus, paddingRight: 88 })}
                onBlur={(e) => Object.assign(e.target.style, { ...input, paddingRight: 88 })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="u-btn outline"
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,.45)",
                  background: "rgba(15,23,42,.35)",
                  fontWeight: 700,
                }}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Nhập lại mật khẩu */}
          <div>
            <label style={label}>Nhập lại mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                className="u-input"
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={onChange}
                required
                style={{ ...input, paddingRight: 88 }}
                onFocus={(e) => Object.assign(e.target.style, { ...input, ...inputFocus, paddingRight: 88 })}
                onBlur={(e) => Object.assign(e.target.style, { ...input, paddingRight: 88 })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="u-btn outline"
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,.45)",
                  background: "rgba(15,23,42,.35)",
                  fontWeight: 700,
                }}
              >
                {showConfirm ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label style={label}>Số điện thoại</label>
            <input
              className="u-input"
              name="phone"
              placeholder="09xxxxxxxx"
              value={form.phone}
              onChange={onChange}
              required
              style={input}
              onFocus={(e) => Object.assign(e.target.style, inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, input)}
            />
          </div>

          {/* Nút */}
          <button
            type="submit"
            className="u-btn"
            disabled={loading}
            style={btn(loading)}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "⏳ Đang đăng ký..." : "🚀 Đăng ký"}
          </button>

          {/* Foot */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              opacity: .85,
              marginTop: 2,
            }}
          >
            <span>Đã có tài khoản?</span>
            <Link to="/login" className="u-chip" style={{ ...chip, textDecoration: "none" }}>
              Đăng nhập →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
