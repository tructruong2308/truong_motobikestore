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
      setMsg(ok ? "✅ Gửi thành công! Chúng tôi sẽ phản hồi trong 1–3 giờ làm việc." : "❌ " + (j?.message || "Có lỗi xảy ra"));
      if (ok) setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setMsg("❌ Không thể gửi. Vui lòng thử lại sau.");
    }
  };

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
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

        {/* Layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* FORM CARD */}
          <div className="lg:col-span-3">
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Họ tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="09xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tiêu đề (tuỳ chọn)
                  </label>
                  <input
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Tóm tắt vấn đề của bạn"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nội dung <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900
                             placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu hỗ trợ…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  ⏱️ Thời gian phản hồi trung bình: <b>1–3 giờ</b> (T2–CN).
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  className="inline-flex items-center justify-center h-11 px-5 rounded-xl
                             bg-emerald-600 text-white font-semibold hover:bg-emerald-500
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            </form>
          </div>

          {/* INFO CARD */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Thông tin cửa hàng</h2>
              <div className="mt-4 space-y-3 text-slate-700">
                <p className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5">📧</span>
                  <a href="mailto:support@motobikestore.vn" className="hover:text-emerald-600">
                    support@motobikestore.vn
                  </a>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5">☎️</span>
                  <a href="tel:0900000000" className="hover:text-emerald-600">0900 000 000</a>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5">📍</span>
                  <span>123 Lê Lợi, Q.1, TP.HCM</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5">🕗</span>
                  <span>08:00–21:00 (T2–CN) · Bảo hành chính hãng · Giao hàng toàn quốc</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <iframe
                className="w-full h-64"
                loading="lazy"
                src="https://www.google.com/maps/embed?pb="
                title="Bản đồ cửa hàng"
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
