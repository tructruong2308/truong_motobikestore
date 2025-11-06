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

  const isOK = msg.startsWith("✅");
  const isErr = msg.startsWith("❌");

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-800">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Liên hệ & Hỗ trợ
        </h1>
        <div className="mt-2 h-1 w-28 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />
        <p className="mt-3 text-slate-500">
          Có câu hỏi hay góp ý? Hãy gửi cho chúng tôi, chúng tôi sẽ phản hồi sớm nhất.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* ===== Form liên hệ ===== */}
        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                placeholder="Mô tả vấn đề bạn gặp phải hoặc yêu cầu hỗ trợ…"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-[.99] transition"
              >
                Gửi
              </button>
              {msg && (
                <p
                  className={[
                    "text-sm px-3 py-2 rounded-lg border",
                    isOK
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isErr
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-slate-50 text-slate-600 border-slate-200",
                  ].join(" ")}
                >
                  {msg}
                </p>
              )}
            </div>
          </div>
        </form>

        {/* ===== Thông tin liên hệ / bản đồ ===== */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Thông tin cửa hàng</h2>
            <ul className="space-y-1 text-slate-600">
              <li>
                <span className="font-medium text-slate-700">Email:</span>{" "}
                support@motobikestore.vn
              </li>
              <li>
                <span className="font-medium text-slate-700">Hotline:</span>{" "}
                0900 000 000
              </li>
              <li>
                <span className="font-medium text-slate-700">Địa chỉ:</span>{" "}
                123 Lê Lợi, Q.1, TP.HCM
              </li>
            </ul>

            {/* badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                ⏱ 8:00–21:00 (T2–CN)
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                🛠 Bảo hành chính hãng
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                🚚 Giao hàng toàn quốc
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
            <iframe
              title="MotoBikeStore map"
              className="w-full h-64 rounded-xl"
              loading="lazy"
              src="https://www.google.com/maps/embed?pb="
            />
          </div>
        </div>
      </div>
    </main>
  );
}
