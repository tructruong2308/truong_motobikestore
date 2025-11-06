export default function About() {
  return (
    <main className="bg-white">
      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600">
            🏁 Giới thiệu
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
            Về MotoBikeStore
          </h1>
          <p className="mt-2 text-slate-600 max-w-3xl mx-auto">
            MotoBikeStore là cửa hàng xe máy & phụ kiện hiện đại, minh bạch, giá hợp lý
            và dịch vụ hậu mãi tận tâm. Chúng tôi nỗ lực mang lại trải nghiệm mua sắm
            đáng tin cậy cho mọi khách hàng.
          </p>
        </div>

        {/* 3 feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Sứ mệnh</h2>
            <p className="text-slate-600">
              Giúp khách hàng chọn đúng chiếc xe phù hợp nhất với nhu cầu và ngân sách.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Giá trị cốt lõi</h2>
            <ul className="list-disc ml-5 space-y-1 text-slate-600">
              <li>Trung thực & minh bạch</li>
              <li>Nhanh chóng & đúng hẹn</li>
              <li>Bảo hành rõ ràng</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Đội ngũ</h2>
            <p className="text-slate-600">
              Kỹ thuật viên chứng chỉ hãng, tư vấn viên giàu kinh nghiệm, hỗ trợ 24/7.
            </p>
          </div>
        </div>

        {/* Why choose us */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Tại sao chọn chúng tôi?</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              "Nguồn hàng chính hãng",
              "Trả góp linh hoạt",
              "Hỗ trợ đăng ký biển số",
              "Bảo dưỡng định kỳ",
            ].map((x) => (
              <div
                key={x}
                className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-slate-700 font-medium"
              >
                {x}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
