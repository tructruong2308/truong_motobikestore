// src/pages/Customers/Contact.jsx
import { useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", subject: "" });
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

  return (
    <main className="relative min-h-[70vh] flex justify-center">
      {/* nền nhẹ + đảm bảo khối nằm giữa */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,#000_35%,transparent_80%)] bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(99,102,241,.08),transparent),linear-gradient(180deg,#fff,rgba(250,250,255,.6))]"
      />

      {/* Giữ input nền sáng dù site đang dark */}
      <style>{`
        .contact-wrap input, .contact-wrap textarea, .contact-wrap select {
          background: #fff !important; color: #0f172a !important; border-color: #e2e8f0 !important;
        }
        .contact-wrap input:focus, .contact-wrap textarea:focus, .contact-wrap select:focus {
          outline: none !important; box-shadow: 0 0 0 4px rgba(99,102,241,.15); border-color: #6366f1 !important;
        }
        .form-row { display: grid; gap: 16px; }
        @media (min-width: 768px) { .form-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>

      <section className="contact-wrap w-full max-w-5xl px-4 py-12">
        {/* Header căn giữa */}
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
          <div className="mx-auto mt-6 h-[3px] w-24 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
        </div>

        {/* Lưới 2 cột: Form (trái) – Info (phải) */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM CARD – chia ô theo hàng rõ ràng */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 md:p-8"
          >
            {/* Hàng 1: Họ tên (full) */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Họ tên <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border px-4 py-3 placeholder-slate-400"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Hàng 2: Email | Số điện thoại */}
            <div className="form-row mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border px-4 py-3 placeholder-slate-400"
                  placeholder="ban@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  className="w-full rounded-xl border px-4 py-3 placeholder-slate-400"
                  placeholder="09xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Hàng 3: Tiêu đề (full) */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiêu đề <span className="text-slate-400">(tuỳ chọn)</span>
              </label>
              <input
                className="w-full rounded-xl border px-4 py-3 placeholder-slate-400"
                placeholder="Tóm tắt vấn đề của bạn"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            {/* Hàng 4: Nội dung (full) */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nội dung <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                className="w-full rounded-xl border px-4 py-3 placeholder-slate-400 leading-relaxed"
                placeholder="Mô tả chi tiết vấn đề hoặc hỗ trợ bạn cần…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>⏱️ Phản hồi trung bình: <b>1–3 giờ</b> (T2–CN)</span>
                <span>{(form.message || "").length}/1000</span>
              </div>
            </div>

            {/* Nút gửi + thông báo */}
            <div className="flex items-center gap-3 pt-3">
              <button
                disabled={loading}
                className={`inline-flex items-center justify-center h-11 px-5 rounded-xl text-white font-semibold shadow-sm transition
                  ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"}`}
                aria-busy={loading}
              >
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
              {msg && (
                <span
                  role="status"
                  aria-live="polite"
                  className={`text-sm ${msg.startsWith("✅") ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {msg}
                </span>
              )}
            </div>
          </form>

          {/* INFO CARD */}
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-5">Thông tin cửa hàng</h2>
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
