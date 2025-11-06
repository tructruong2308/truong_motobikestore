// src/pages/Customers/About.jsx
export default function About() {
  return (
    <main className="bg-white">
      <section className="max-w-6xl mx-auto px-4 py-14">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-gradient-to-r from-slate-50 to-white text-sm text-slate-600 shadow-sm">
            🏁 Giới thiệu
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Về MotoBikeStore
          </h1>
          <p className="mt-3 text-slate-600 max-w-3xl mx-auto leading-relaxed">
            MotoBikeStore là cửa hàng xe máy & phụ kiện hiện đại, minh bạch, giá hợp lý
            và dịch vụ hậu mãi tận tâm. Chúng tôi nỗ lực mang lại trải nghiệm mua sắm
            đáng tin cậy cho mọi khách hàng.
          </p>
          <div className="mt-6 h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" />
        </div>

        {/* 3 feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_6px_30px_rgba(2,6,23,.05)] hover:shadow-[0_10px_40px_rgba(2,6,23,.08)] transition-shadow">
            <div className="inline-flex items-center gap-2 text-emerald-600 font-semibold mb-2">
              <span className="text-lg">🎯</span> Sứ mệnh
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Giúp bạn chọn đúng</h2>
            <p className="text-slate-600 leading-relaxed">
              Giúp khách hàng chọn đúng chiếc xe phù hợp nhất với nhu cầu và ngân sách.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_6px_30px_rgba(2,6,23,.05)] hover:shadow-[0_10px_40px_rgba(2,6,23,.08)] transition-shadow">
            <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold mb-2">
              <span className="text-lg">💎</span> Giá trị cốt lõi
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Chúng tôi cam kết</h2>
            <ul className="list-disc ml-5 space-y-1 text-slate-600 leading-relaxed">
              <li>Trung thực &amp; minh bạch</li>
              <li>Nhanh chóng &amp; đúng hẹn</li>
              <li>Bảo hành rõ ràng</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_6px_30px_rgba(2,6,23,.05)] hover:shadow-[0_10px_40px_rgba(2,6,23,.08)] transition-shadow">
            <div className="inline-flex items-center gap-2 text-sky-600 font-semibold mb-2">
              <span className="text-lg">👥</span> Đội ngũ
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Chuyên nghiệp & tận tâm</h2>
            <p className="text-slate-600 leading-relaxed">
              Kỹ thuật viên chứng chỉ hãng, tư vấn viên giàu kinh nghiệm, hỗ trợ 24/7.
            </p>
          </div>
        </div>

        {/* Why choose us */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_6px_30px_rgba(2,6,23,.05)]">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Tại sao chọn chúng tôi?
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              "Nguồn hàng chính hãng",
              "Trả góp linh hoạt",
              "Hỗ trợ đăng ký biển số",
              "Bảo dưỡng định kỳ",
            ].map((x) => (
              <div
                key={x}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 font-medium hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span className="truncate">{x}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
