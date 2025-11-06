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
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-800">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Liên hệ & Hỗ trợ
        </h1>
        <p className="mt-2 text-slate-600">
          Có câu hỏi hay góp ý? Hãy gửi cho chúng tôi, chúng tôi sẽ phản hồi sớm nhất.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form liên hệ */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-7 space-y-5"
        >
          {msg && (
            <div
              className={`text-sm rounded-xl px-4 py-3 font-medium ${
                msg.startsWith("✅")
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {msg}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Họ tên
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                placeholder="09xxxxxxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tiêu đề (tuỳ chọn)
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                placeholder="Mô tả ngắn vấn đề bạn gặp…"
                onChange={() => {}}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nội dung
            </label>
            <textarea
              rows={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
              placeholder="Mô tả vấn đề bạn gặp phải hoặc yêu cầu hỗ trợ…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-emerald-500 text-white font-semibold shadow-sm hover:bg-emerald-600 active:scale-[.99] transition"
            >
              Gửi
            </button>

            <span className="text-xs text-slate-500">
              * Thời gian phản hồi trung bình: <b>1–3 giờ</b>
            </span>
          </div>
        </form>

        {/* Thông tin liên hệ */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Thông tin cửa hàng
            </h2>

            <ul className="space-y-2 text-slate-700">
              <li>
                <span className="inline-flex w-6">📧</span>
                Email: <a href="mailto:support@motobikestore.vn" className="text-emerald-600 hover:underline">support@motobikestore.vn</a>
              </li>
              <li>
                <span className="inline-flex w-6">☎️</span>
                Hotline: <a href="tel:0900000000" className="text-emerald-600 hover:underline">0900 000 000</a>
              </li>
              <li>
                <span className="inline-flex w-6">📍</span>
                Địa chỉ: 123 Lê Lợi, Q.1, TP.HCM
              </li>
              <li className="text-slate-600">
                <span className="inline-flex w-6">⏰</span>
                8:00–21:00 (T2–CN) • 🔧 Bảo hành chính hãng • 🚚 Giao hàng toàn quốc
              </li>
            </ul>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <iframe
              className="w-full aspect-[16/10]"
              loading="lazy"
              src="https://www.google.com/maps/embed?pb="
              title="Bản đồ cửa hàng"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
