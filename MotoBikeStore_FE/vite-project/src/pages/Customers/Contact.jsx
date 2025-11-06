// src/pages/Customers/Contact.jsx
import { useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", message: "", subject: ""
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const ok = r.ok;
      const j = await r.json().catch(() => ({}));
      setMsg(ok ? "✅ Gửi thành công!" : "❌ " + (j?.message || "Có lỗi xảy ra"));
      if (ok) setForm({ name: "", email: "", phone: "", message: "", subject: "" });
    } catch {
      setMsg("❌ Không thể gửi");
    } finally {
      setLoading(false);
    }
  };

  const filled = (v) => "bg-white"; // luôn trắng, cao cấp

  return (
    <main className="relative min-h-[70vh] bg-white">
      {/* Backdrop premium */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 420px at 10% -10%, rgba(99,102,241,.08), transparent), radial-gradient(900px 420px at 90% -20%, rgba(56,189,248,.08), transparent)"
        }}
      />

      {/* SUPER-SCOPED styles cho form xịn */}
      <style>{`
        .contact-wrap{max-width:1080px}
        .contact-card{
          border:1px solid #e6e9ef; border-radius:28px; background:rgba(255,255,255,.9);
          backdrop-filter:saturate(140%) blur(6px);
          box-shadow:0 18px 48px -18px rgba(2,6,23,.16), 0 2px 8px rgba(2,6,23,.04);
        }
        .input-wrap{position:relative}
        .input-ico{
          position:absolute; inset-inline-start:14px; inset-block-start:50%; transform:translateY(-50%);
          font-size:18px; color:#94a3b8
        }
        .contact-wrap input,.contact-wrap textarea{
          width:100%; background:#fff; color:#0f172a; border:1px solid #e5e7eb;
          border-radius:16px; padding:14px 16px 14px 44px; height:52px;
          transition:box-shadow .15s ease, border-color .15s ease, transform .05s ease;
        }
        .contact-wrap textarea{min-height:160px; height:auto; padding-top:14px}
        .contact-wrap input::placeholder,.contact-wrap textarea::placeholder{color:#9aa7b5}
        .contact-wrap label{color:#0f172a; font-weight:800; letter-spacing:.2px}
        .contact-wrap .row{display:grid; gap:16px}
        @media (min-width:768px){ .contact-wrap .row{grid-template-columns:1fr 1fr} }
        .focusable:focus{
          outline:none !important; border-color:#7c3aed !important;
          box-shadow:0 0 0 6px rgba(124,58,237,.14);
        }
        .btn-grad{
          background:linear-gradient(90deg,#22c55e,#16a34a);
          color:#fff; height:48px; padding:0 24px; border-radius:14px; font-weight:800;
          box-shadow:0 10px 24px -10px rgba(16,185,129,.55);
          transition:transform .06s ease, filter .2s ease, box-shadow .2s ease;
          border:0;
        }
        .btn-grad:hover{ filter:brightness(1.03); box-shadow:0 16px 36px -14px rgba(16,185,129,.6) }
        .btn-grad:active{ transform:translateY(1px) }
        .badge{
          display:inline-flex; align-items:center; gap:8px;
          padding:.4rem .75rem; border-radius:999px; border:1px solid #e6e9ef; background:#f8fafc; color:#475569
        }
        .divider{height:4px; width:120px; margin:18px auto 0; border-radius:999px;
          background:linear-gradient(90deg,#4f46e5,#8b5cf6,#06b6d4)}
        .list-tile{display:flex; gap:12px; padding:12px; border-radius:14px; border:1px solid #eef2f7}
        .list-tile:hover{background:#f8fafc}
      `}</style>

      <section className="contact-wrap mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="badge">✉️ Liên hệ & Hỗ trợ</span>
          <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Đăng ký hỗ trợ / liên hệ
          </h1>
          <p className="mt-3 text-slate-600">
            Nhập thông tin, chúng tôi sẽ phản hồi sớm. Thời gian phản hồi trung bình: <b>1–3 giờ</b>.
          </p>
          <div className="divider" />
        </div>

        {/* GRID 2 cột: Form | Info */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM */}
          <form onSubmit={onSubmit} className="contact-card p-6 md:p-8">
            {/* Họ tên */}
            <div className="mb-5">
              <label className="block text-sm mb-2">Họ tên <span className="text-rose-600">*</span></label>
              <div className="input-wrap">
                <span className="input-ico">👤</span>
                <input
                  className={`focusable ${filled(form.name)}`}
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email | Phone */}
            <div className="row mb-5">
              <div>
                <label className="block text-sm mb-2">E-mail <span className="text-rose-600">*</span></label>
                <div className="input-wrap">
                  <span className="input-ico">📧</span>
                  <input
                    type="email"
                    className="focusable bg-white"
                    placeholder="ban@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Số điện thoại</label>
                <div className="input-wrap">
                  <span className="input-ico">📞</span>
                  <input
                    className="focusable bg-white"
                    placeholder="09xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Tiêu đề */}
            <div className="mb-5">
              <label className="block text-sm mb-2">
                Tiêu đề <span className="text-slate-400 text-xs font-normal">(tuỳ chọn)</span>
              </label>
              <div className="input-wrap">
                <span className="input-ico">📝</span>
                <input
                  className="focusable bg-white"
                  placeholder="Tóm tắt vấn đề của bạn"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
            </div>

            {/* Nội dung */}
            <div className="mb-2">
              <label className="block text-sm mb-2">Nội dung <span className="text-rose-600">*</span></label>
              <div className="input-wrap">
                <span className="input-ico" style={{ insetBlockStart: 18 }}>💬</span>
                <textarea
                  className="focusable bg-white"
                  placeholder="Mô tả chi tiết vấn đề hoặc hỗ trợ bạn cần…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  style={{ paddingLeft: 44 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>Gợi ý: nêu rõ mẫu xe / thời gian / nội dung cần hỗ trợ.</span>
                <span>{(form.message || "").length}/1000</span>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-5 flex items-center gap-3">
              <button disabled={loading} className="btn-grad" aria-busy={loading}>
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
              {msg && (
                <span className={`text-sm ${msg.startsWith("✅") ? "text-emerald-600" : "text-rose-600"}`}>
                  {msg}
                </span>
              )}
            </div>
          </form>

          {/* INFO */}
          <aside className="contact-card p-6 md:p-8">
            <h2 className="text-xl font-black text-slate-900 mb-5">Thông tin cửa hàng</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="list-tile">
                <span className="mt-0.5">📧</span>
                <div>
                  <div className="font-semibold">E-mail</div>
                  <a href="mailto:support@motobikestore.vn" className="text-indigo-700 hover:underline">
                    support@motobikestore.vn
                  </a>
                </div>
              </li>
              <li className="list-tile">
                <span className="mt-0.5">☎️</span>
                <div>
                  <div className="font-semibold">Đường dây nóng</div>
                  <div>0900 000 000</div>
                </div>
              </li>
              <li className="list-tile">
                <span className="mt-0.5">📍</span>
                <div>
                  <div className="font-semibold">Địa chỉ</div>
                  <div>123 Lê Lợi, Q.1, TP.HCM</div>
                </div>
              </li>
              <li className="list-tile">
                <span className="mt-0.5">🕘</span>
                <div>
                  <div className="font-semibold">Giờ làm việc</div>
                  <div>8:00–21:00 (T2–CN)</div>
                  <div className="text-slate-600 mt-1">🔧 Bảo hành chính hãng • 🚚 Giao hàng toàn quốc</div>
                </div>
              </li>
            </ul>

            <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200">
              <iframe
                className="w-full aspect-[16/10]"
                loading="lazy"
                src="https://www.google.com/maps/embed?pb="
                title="Google Map"
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
