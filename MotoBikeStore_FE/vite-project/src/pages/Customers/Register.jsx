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

  // ========== UI HELPERS (Light theme) ==========
  const card = {
    width: "100%",
    maxWidth: 520,
    padding: 20,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow:
      "0 1px 2px rgba(0,0,0,.04), 0 8px 30px rgba(17,24,39,.06)",
    color: "#0f172a",
  };

  const label = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.2,
    opacity: 0.95,
    color: "#334155",
  };

  const input = {
    width: "100%",
    height: 44,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,.03)",
  };

  const inputFocus = {
    borderColor: "rgba(59,130,246,.6)",
    boxShadow: "0 0 0 3px rgba(59,130,246,.25)",
  };

  const chip = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    fontSize: 12,
    color: "#0f172a",
  };

  const btn = (disabled) => ({
    height: 44,
    borderRadius: 12,
    border: "1px solid #10b981",
    background: "linear-gradient(180deg, #34d399, #10b981)",
    color: "white",
    fontWeight: 800,
    letterSpacing: 0.3,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    transition: "transform .06s ease, box-shadow .15s ease",
    boxShadow: "0 6px 18px rgba(16,185,129,.25)",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)",
        color: "#0f172a",
      }}
    >
      <div className="u-card u-border" style={card}>
        {/* Header nhỏ đồng bộ */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="u-chip" style={chip}>MotoBikeStore</div>
          <div className="u-chip" style={chip}>Tạo tài khoản</div>
          <div style={{ flex: 1 }} />
          <div
            className="u-chip"
            title="MotoBikeStore"
            style={{ ...chip, fontWeight: 800 }}
          >
            🏍️
          </div>
        </div>

        <h1
          style={{
            margin: "14px 0 6px",
            fontSize: 26,
            fontWeight: 900,
            lineHeight: 1.2,
            color: "#0f172a",
          }}
        >
          Đăng ký tài khoản
        </h1>
        <p style={{ margin: 0, opacity: 0.85, fontSize: 13.5, color: "#334155" }}>
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
                message.startsWith("✅") ? "#86efac" : "#fecaca"
              }`,
              background: message.startsWith("✅")
                ? "linear-gradient(180deg, #ecfdf5, #dcfce7)"
                : "linear-gradient(180deg, #fff1f2, #ffe4e6)",
              color: message.startsWith("✅") ? "#166534" : "#991b1b",
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
              onFocus={(e) => Object.assign(e.target.style, { ...input, ...inputFocus })}
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
              onFocus={(e) => Object.assign(e.target.style, { ...input, ...inputFocus })}
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
              onFocus={(e) => Object.assign(e.target.style, { ...input, ...inputFocus })}
              onBlur={(e) => Object.assign(e.target.style, input)}
            />
          </div>

          {/* Avatar */}
          <div>
            <label style={label}>Ảnh đại diện</label>
            <div
              style={{
                border: "1px dashed #e5e7eb",
                background: "#f8fafc",
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
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  color: "#0f172a",
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

              <div style={{ fontSize: 12.5, opacity: 0.85, color: "#334155" }}>
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
                    border: "2px solid #e5e7eb",
                    boxShadow: "0 6px 16px rgba(0,0,0,.12)",
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
                onFocus={(e) =>
                  Object.assign(e.target.style, {
                    ...input,
                    ...inputFocus,
                    paddingRight: 88,
                  })
                }
                onBlur={(e) =>
                  Object.assign(e.target.style, { ...input, paddingRight: 88 })
                }
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
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  fontWeight: 700,
                  color: "#0f172a",
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
                onFocus={(e) =>
                  Object.assign(e.target.style, {
                    ...input,
                    ...inputFocus,
                    paddingRight: 88,
                  })
                }
                onBlur={(e) =>
                  Object.assign(e.target.style, { ...input, paddingRight: 88 })
                }
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
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  fontWeight: 700,
                  color: "#0f172a",
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
              onFocus={(e) => Object.assign(e.target.style, { ...input, ...inputFocus })}
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
              opacity: 0.9,
              marginTop: 2,
              color: "#334155",
            }}
          >
            <span>Đã có tài khoản?</span>
            <Link
              to="/login"
              className="u-chip"
              style={{
                ...chip,
                textDecoration: "none",
                background: "#eef2ff",
                borderColor: "#e0e7ff",
                color: "#3730a3",
              }}
            >
              Đăng nhập →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
