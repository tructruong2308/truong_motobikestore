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
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-6">Liên hệ & Hỗ trợ</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form liên hệ */}
        <form
          onSubmit={onSubmit}
          className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm mb-1">Họ tên</label>
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Số điện thoại</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Nội dung</label>
            <textarea
              rows={5}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <button className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
            Gửi
          </button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </form>

        {/* Thông tin liên hệ */}
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-2">Thông tin cửa hàng</h2>
            <p>Email: support@motobikestore.vn</p>
            <p>Hotline: 0900 000 000</p>
            <p>Địa chỉ: 123 Lê Lợi, Q.1, TP.HCM</p>
          </div>
          <iframe
            className="w-full h-64 rounded-2xl border border-slate-700"
            loading="lazy"
            src="https://www.google.com/maps/embed?pb="
          />
        </div>
      </div>
    </main>
  );
}
