import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    address: "",
    avatar: null,       // File
  });
  const [preview, setPreview] = useState(null);
  const token = localStorage.getItem("customer_token");

  // Nếu chưa login -> về trang login
  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  // Load hồ sơ (ưu tiên localStorage -> /api/me)
  useEffect(() => {
    async function load() {
      try {
        const cached = JSON.parse(localStorage.getItem("customer_user") || "null");
        if (cached) {
          setForm(s => ({
            ...s,
            name: cached.name || "",
            email: cached.email || "",
            username: cached.username || "",
            phone: cached.phone || "",
            address: cached.address || "",
          }));
          setPreview(cached.avatar_url || null);
          setLoading(false);
        } else {
          const res = await fetch(`${API}/api/me`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          const u = data?.data || {};
          setForm(s => ({
            ...s,
            name: u.name || "",
            email: u.email || "",
            username: u.username || "",
            phone: u.phone || "",
            address: u.address || "",
          }));
          setPreview(u.avatar_url || null);
          setLoading(false);
          localStorage.setItem("customer_user", JSON.stringify(u));
          window.dispatchEvent(new Event("user:refresh"));
        }
      } catch {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(s => ({ ...s, avatar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setMsg("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name || "");         // 👈 Laravel nhận được
      fd.append("phone", form.phone || "");
      fd.append("address", form.address || "");
      // Nếu cho phép đổi email/username thì mở 2 dòng dưới:
      // fd.append("email", form.email || "");
      // fd.append("username", form.username || "");

      if (form.avatar) fd.append("avatar", form.avatar);

      // ✅ GỬI POST (FormData). Nếu API đang là PUT, spoof như sau:
      // fd.append("_method", "PUT");  // mở nếu route backend là PUT/PATCH
      const res = await fetch(`${API}/api/profile`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        // Lấy message validation từ Laravel
        const msg =
          data?.message ||
          Object.values(data?.errors || {})[0]?.[0] ||
          "Cập nhật thất bại";
        throw new Error(msg);
      }

      // Lưu lại user mới
      localStorage.setItem("customer_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("user:refresh"));

      setMsg("✅ " + (data.message || "Cập nhật hồ sơ thành công"));
    } catch (err) {
      setMsg("❌ " + (err.message || "Có lỗi xảy ra"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="u-card u-border p-4">⏳ Đang tải hồ sơ…</div>;

  const card = {
    border: "1px solid rgba(148,163,184,.25)",
    background: "linear-gradient(180deg, rgba(15,23,42,.55), rgba(2,6,23,.65))",
    color: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)",
  };
  const label = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, opacity: .92 };
  const input = {
    width: "100%", height: 44, padding: "10px 14px", borderRadius: 12,
    border: "1px solid rgba(148,163,184,.28)", background: "rgba(2,6,23,.6)",
    color: "#e5e7eb", outline: "none",
  };
  const row = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <div className="u-card u-border" style={card}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f8fafc" }}>Hồ sơ của tôi</h2>
      <p style={{ marginTop: 6, opacity: .8, fontSize: 13.5 }}>Cập nhật thông tin cá nhân và ảnh đại diện.</p>

      {msg && (
        <div
          className="u-card u-border"
          style={{
            marginTop: 12, padding: 10, borderRadius: 12,
            border: `1px solid ${msg.startsWith("✅") ? "rgba(16,185,129,.5)" : "rgba(239,68,68,.5)"}`,
            background: msg.startsWith("✅")
              ? "linear-gradient(180deg, rgba(6,78,59,.25), rgba(2,44,34,.25))"
              : "linear-gradient(180deg, rgba(127,29,29,.25), rgba(69,10,10,.25))",
            color: msg.startsWith("✅") ? "#A7F3D0" : "#FECACA",
            fontSize: 13.5,
          }}
        >
          {msg}
        </div>
      )}

      <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {/* Avatar + uploader */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 120, height: 120, borderRadius: "50%", overflow: "hidden",
              border: "2px solid rgba(255,255,255,.15)", background: "rgba(2,6,23,.5)",
              boxShadow: "0 10px 30px rgba(0,0,0,.35)", display: "grid", placeItems: "center",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="avatar preview"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://i.pravatar.cc/150?u=fallback";
                }}
              />
            ) : (
              <img
                src="https://i.pravatar.cc/150?u=guest"
                alt="no avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label className="u-btn outline" style={{ width: "fit-content", padding: "8px 12px", cursor: "pointer" }}>
              Chọn ảnh…
              <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
            </label>
            <small style={{ opacity: .8 }}>Hỗ trợ JPEG/PNG/WEBP/AVIF. Tối đa 2MB.</small>
          </div>
        </div>

        {/* Thông tin */}
        <div style={row}>
          <div>
            <label style={label}>Họ tên</label>
            <input name="name" value={form.name} onChange={onChange} required className="u-input" style={input} />
          </div>
          <div>
            <label style={label}>Số điện thoại</label>
            <input name="phone" value={form.phone} onChange={onChange} className="u-input" style={input} />
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={label}>E-mail (không chỉnh sửa)</label>
            <input value={form.email} disabled className="u-input" style={{ ...input, opacity: .7 }} />
          </div>
          <div>
            <label style={label}>Tên đăng nhập (không chỉnh sửa)</label>
            <input value={form.username} disabled className="u-input" style={{ ...input, opacity: .7 }} />
          </div>
        </div>

        <div>
          <label style={label}>Địa chỉ</label>
          <input name="address" value={form.address} onChange={onChange} className="u-input" style={input} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            className="u-btn"
            disabled={saving}
            style={{
              height: 44, borderRadius: 12,
              border: "1px solid rgba(16,185,129,.55)",
              background: "linear-gradient(180deg, rgba(16,185,129,.35), rgba(5,150,105,.4))",
              color: "#ecfdf5", fontWeight: 800, letterSpacing: .3,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1,
            }}
          >
            {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
          </button>

          <button
            type="button"
            className="u-btn outline"
            onClick={() => navigate(-1)}
            style={{
              height: 44, borderRadius: 12,
              border: "1px solid rgba(148,163,184,.35)", background: "transparent",
              color: "#e5e7eb", fontWeight: 700,
            }}
          >
            ← Quay lại
          </button>
        </div>
      </form>
    </div>
  );
}
