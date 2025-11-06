import { useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
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
      if (ok) setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setMsg("❌ Không thể gửi");
    }
  };

  return (
    <main className="min-h-[70vh] bg-white">
      {/* khối giữa trang */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Liên hệ &amp; Hỗ trợ</h1>
          <p className="mt-2 text-slate-600">
            Có câu hỏi hay góp ý? Hãy gửi cho chúng tôi, chúng tôi sẽ phản hồi sớm nhất.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* FORM */}
          <form
            onSubmit={onSubmit}
            className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-7"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ tên <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-slate-800 placeholder-slate-400
                             focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-slate-800 placeholder-slate-400
                             focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  autoComplete="tel"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-mail <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-slate-800 placeholder-slate-400
                             focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tiêu đề (tuỳ chọn)
                </label>
                <input
                  className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-slate-800 placeholder-slate-400
                             focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Mô tả ngắn gọn vấn đề bạn gặp"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nội dung <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-800 placeholder-slate-400
                             focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  placeholder="Bạn phải mô tả vấn đề hoặc yêu cầu hỗ trợ…"
                />
                <p className="mt-1.5 text-xs text-slate-500">* Thời gian phản hồi trung bình: <b>1–3 giờ</b></p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600
                           px-5 text-white font-semibold hover:bg-emerald-500 hover:border-emerald-500
                           active:scale-[.99] transition"
              >
                Gửi
              </button>
              {msg && (
                <span className={`text-sm ${msg.startsWith("✅") ? "text-emerald-600" : "text-rose-600"}`}>
                  {msg}
                </span>
              )}
            </div>
          </form>

          {/* THÔNG TIN CỬA HÀNG */}
          <aside className="w-full max-w-xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-7">
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Thông tin cửa hàng</h2>
              <ul className="space-y-1.5 text-slate-700">
                <li>📷 Email: <b>support@motobikestore.vn</b></li>
                <li>☎️ Đường dây nóng: <b>0900 000 000</b></li>
                <li>📍 Địa chỉ: 123 Lê Lợi, Q.1, TP.HCM</li>
                <li>🕗 8:00–21:00 (T2–CN) • 🛠️ Bảo hành chính hãng • 🚚 Giao hàng toàn quốc</li>
              </ul>
              <div className="mt-4 aspect-[3/2] w-full overflow-hidden rounded-2xl border border-slate-200">
                <iframe
                  className="w-full h-full"
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb="
                  title="Bản đồ"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
