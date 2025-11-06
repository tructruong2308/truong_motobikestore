// src/pages/Customers/Contact.jsx
import { useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const ok = r.ok;
      const j = await r.json().catch(() => ({}));
      setMsg(ok ? "✅ Gửi thành công!" : "❌ " + (j?.message || "Có lỗi xảy ra"));
      if (ok) setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setMsg("❌ Không thể gửi");
    }
  };

  return (
    <main className="bg-white min-h-[70vh]">
      {/* SCOPED OVERRIDE: loại bỏ các style nền tối đang áp lên input */}
      <style>{`
        .contact-wrap input,
        .contact-wrap textarea,
        .contact-wrap select {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important; /* slate-200 */
        }
        .contact-wrap input:focus,
        .contact-wrap textarea:focus,
        .contact-wrap select:focus {
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, .15); /* emerald ring */
          border-color: #10b981 !important;
        }
      `}</style>

      <section className="max-w-5xl mx-auto px-4 py-12 contact-wrap">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600">
            ✉️ Liên hệ & Hỗ trợ
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn
          </h1>
          <p className="mt-2 text-slate-600">
            Có câu hỏi hay góp ý? Hãy để lại thông tin, chúng tôi sẽ phản hồi sớm nhất.
          </p>
        </div>

        {/* GRID: Form (trái) – Info (phải) */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM CARD */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8"
          >
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ tên <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border px-3 py-3 placeholder-slate-400"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border px-3 py-3 placeholder-slate-400"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    className="w-full rounded-xl border px-3 py-3 placeholder-slate-400"
                    placeholder="09xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tiêu đề <span className="text-slate-400">(tuỳ chọn)</span>
                </label>
                <input
                  className="w-full rounded-xl border px-3 py-3 placeholder-slate-400"
                  placeholder="Tóm tắt vấn đề của bạn"
                  value={form.subject || ""}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nội dung <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border px-3 py-3 placeholder-slate-400"
                  placeholder="Mô tả chi tiết vấn đề hoặc hỗ trợ bạn cần…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  ⏱️ Thời gian phản hồi trung bình: <b>1–3 giờ</b> (T2–CN).
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition"
                >
                  Gửi yêu cầu
                </button>
                {msg && (
                  <span
                    className={`text-sm ${
                      msg.startsWith("✅") ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {msg}
                  </span>
                )}
              </div>
            </div>
          </form>

          {/* INFO CARD */}
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Thông tin cửa hàng</h2>

            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="mt-1">📧</span>
                <div>
                  <div className="font-medium">Email</div>
                  <a href="mailto:support@motobikestore.vn" className="text-emerald-700">
                    support@motobikestore.vn
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1">☎️</span>
                <div>
                  <div className="font-medium">Hotline</div>
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
                  <div className="text-slate-600 mt-1">
                    🔧 Bảo hành chính hãng • 🚚 Giao hàng toàn quốc
                  </div>
                </div>
              </li>
            </ul>

            <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200">
              <iframe
                className="w-full h-64"
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
