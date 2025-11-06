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

  const filled = (v) =>
    (v?.trim()?.length ? "bg-white" : "bg-white") + " focus:bg-white transition-colors";

  return (
    <main className="relative min-h-[70vh] bg-white">
      {/* nền nhẹ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(99,102,241,.06),transparent)]"
      />

      {/* scoped styles: tập trung sửa cảm giác input */}
      <style>{`
        .contact-wrap{max-width:1000px}
        .contact-wrap input,.contact-wrap textarea,.contact-wrap select{
          background:#fff !important; color:#0f172a !important;
          border:1px solid #e5e7eb !important; border-radius:16px !important;
          padding:14px 16px !important; height:48px;
        }
        .contact-wrap textarea{height:auto; min-height:140px; line-height:1.6}
        .contact-wrap input::placeholder,.contact-wrap textarea::placeholder{color:#94a3b8}
        .contact-wrap label{color:#0f172a; font-weight:700}
        .contact-wrap .field{display:flex; flex-direction:column; gap:8px}
        .contact-wrap .row{display:grid; gap:16px}
        @media (min-width:768px){ .contact-wrap .row{grid-template-columns:1fr 1fr} }
        .contact-card{
          border:1px solid #e5e7eb; border-radius:24px; background:#fff;
          box-shadow:0 12px 32px -18px rgba(2,6,23,.12);
        }
        .contact-wrap .hint{font-size:12px; color:#64748b}
        .contact-wrap .focus-ring:focus{
          outline:none !important; box-shadow:0 0 0 4px rgba(99,102,241,.18);
          border-color:#6366f1 !important;
        }
        .divider{
          height:3px; width:96px; margin:16px auto 0; border-radius:999px;
          background:linear-gradient(90deg,#6366f1,#8b5cf6,#38bdf8);
        }
      `}</style>

      <section className="contact-wrap mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600">
            ✉️ Liên hệ & Hỗ trợ
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
            Đăng ký hỗ trợ / liên hệ
          </h1>
          <p className="mt-2 text-slate-600">
            Nhập thông tin để chúng tôi phản hồi sớm. Thời gian phản hồi trung bình: <b>1–3 giờ</b>.
          </p>
          <div className="divider" />
        </div>

        {/* GRID 2 cột: Form | Info (giữ nguyên bố cục) */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM CARD */}
          <form onSubmit={onSubmit} className="contact-card p-6 md:p-8">
            <div className="field mb-5">
              <label>Họ tên <span className="text-rose-600">*</span></label>
              <input
                className={`focus-ring ${filled(form.name)}`}
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="row mb-5">
              <div className="field">
                <label>E-mail <span className="text-rose-600">*</span></label>
                <input
                  type="email"
                  className={`focus-ring ${filled(form.email)}`}
                  placeholder="ban@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Số điện thoại</label>
                <input
                  className={`focus-ring ${filled(form.phone)}`}
                  placeholder="09xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="field mb-5">
              <label>Tiêu đề <span className="text-slate-400 text-xs font-normal">(tuỳ chọn)</span></label>
              <input
                className={`focus-ring ${filled(form.subject)}`}
                placeholder="Tóm tắt vấn đề của bạn"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            <div className="field mb-2">
              <label>Nội dung <span className="text-rose-600">*</span></label>
              <textarea
                className={`focus-ring ${filled(form.message)}`}
                placeholder="Mô tả chi tiết vấn đề hoặc hỗ trợ bạn cần…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <div className="flex items-center justify-between hint mt-1">
                <span>Gợi ý: nêu rõ mẫu xe / thời gian / nội dung cần hỗ trợ.</span>
                <span>{(form.message || "").length}/1000</span>
              </div>
            </div>

            <div className="pt-5 flex items-center gap-3">
              <button
                disabled={loading}
                className={`h-11 px-6 rounded-2xl text-white font-semibold transition
                ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"}`}
              >
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
              {msg && (
                <span className={`text-sm ${msg.startsWith("✅") ? "text-emerald-600" : "text-rose-600"}`}>
                  {msg}
                </span>
              )}
            </div>
          </form>

          {/* INFO CARD (giữ nguyên nội dung) */}
          <aside className="contact-card p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Thông tin cửa hàng</h2>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="mt-1">📧</span>
                <div>
                  <div className="font-medium">E-mail</div>
                  <a href="mailto:support@motobikestore.vn" className="text-indigo-700 hover:underline">
                    support@motobikestore.vn
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1">☎️</span>
                <div>
                  <div className="font-medium">Đường dây nóng</div>
                  <div>0900 000 000</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1">📍</span>
                <div>
                  <div className="font-medium">Địa chỉ</div>
                  <div>123 Lê Lợi, Q.1, TP.HCM</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1">🕘</span>
                <div>
                  <div className="font-medium">Giờ làm việc</div>
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
