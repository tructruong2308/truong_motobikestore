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
    <main className="relative bg-white min-h-[70vh]">
      {/* BG trang trí */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,#000_35%,transparent_80%)] bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(99,102,241,.08),transparent),linear-gradient(180deg,#fff,rgba(250,250,255,.6))]"
      />

      {/* SCOPED OVERRIDE: giữ input nền sáng, ring đẹp */}
      <style>{`
        .contact-wrap input,
        .contact-wrap textarea,
        .contact-wrap select {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }
        .contact-wrap input:focus,
        .contact-wrap textarea:focus,
        .contact-wrap select:focus {
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,.15); /* indigo ring */
          border-color: #6366f1 !important;
        }
      `}</style>

      <section className="max-w-6xl mx-auto px-4 py-12 contact-wrap">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600">
            ✉️ Liên hệ & Hỗ trợ
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn
          </h1>
          <p className="mt-3 text-slate-600">
            Có câu hỏi hay góp ý? Hãy để lại thông tin, chúng tôi sẽ phản hồi sớm nhất.
          </p>

          {/* Divider gradient */}
          <div className="mx-auto mt-6 h-[3px] w-28 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
        </div>

        {/* GRID: Form (trái) – Info (phải) */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM CARD */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg shadow-slate-200/40 p-6 md:p-8 transition hover:shadow-xl"
          >
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Họ tên <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border px-4 py-3 placeholder-slate-400 transition"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border px-4 py-3 placeholder-slate-400 transition"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
                  <input
                    className="w-full rounded-xl border px-4 py-3 placeholder-slate-400 transition"
                    placeholder="09xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Tiêu đề <span className="text-slate-400">(tuỳ chọn)</span>
                </label>
                <input
                  className="w-full rounded-xl border px-4 py-3 placeholder-slate-400 transition"
                  placeholder="Tóm tắt vấn đề của bạn"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Nội dung <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border px-4 py-3 placeholder-slate-400 transition leading-relaxed"
                  placeholder="Mô tả chi tiết vấn đề hoặc hỗ trợ bạn cần…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>⏱️ Phản hồi trung bình: <b>1–3 giờ</b> (T2–CN)</span>
                  <span>{(form.message || "").length}/1000</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  disabled={loading}
                  className={`inline-flex items-center justify-center h-11 px-5 rounded-xl text-white font-semibold shadow-sm transition
                    ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"}`}
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
            </div>
          </form>

          {/* INFO CARD */}
          <aside className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg shadow-slate-200/40 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Thông tin cửa hàng
            </h2>

            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="mt-1">📧</span>
                <div>
                  <div className="font-medium">Email</div>
                  <a href="mailto:support@motobikestore.vn" className="text-indigo-700 hover:underline">
                    support@motobikestore.vn
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1">☎️</span>
                <div>
                  <div className="font-medium">Hotline</div>
                  <div className="select-all">0900 000 000</div>
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

            <div className="mt-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <iframe
                  className="w-full aspect-[16/10]"
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb="
                  title="Google Map"
                />
                {/* viền gradient nhẹ ở cạnh trên */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Gợi ý: Nhấn vào bản đồ để mở trong Google Maps và xem đường đi nhanh.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
