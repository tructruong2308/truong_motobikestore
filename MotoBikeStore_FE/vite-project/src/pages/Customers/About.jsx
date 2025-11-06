export default function About() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-800">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
        Về MotoBikeStore
      </h1>
      <p className="mb-8 text-slate-600">
        MotoBikeStore là cửa hàng xe máy & phụ kiện hiện đại, minh bạch, giá hợp lý và
        dịch vụ hậu mãi tận tâm. Chúng tôi tự hào mang lại trải nghiệm mua sắm đáng tin cậy cho mọi khách hàng.
      </p>

      {/* 3 khối thông tin */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Sứ mệnh</h2>
          <p className="text-slate-600">
            Giúp khách hàng chọn đúng chiếc xe phù hợp nhất với nhu cầu và ngân sách.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Giá trị cốt lõi</h2>
          <ul className="list-disc ml-5 space-y-1 text-slate-600">
            <li>Trung thực & minh bạch</li>
            <li>Nhanh chóng & đúng hẹn</li>
            <li>Bảo hành rõ ràng</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Đội ngũ</h2>
          <p className="text-slate-600">
            Kỹ thuật viên chứng chỉ hãng, tư vấn viên giàu kinh nghiệm, chăm sóc 24/7.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 mb-3">Tại sao chọn chúng tôi?</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {[
          "Nguồn hàng chính hãng",
          "Trả góp linh hoạt",
          "Hỗ trợ đăng ký biển số",
          "Bảo dưỡng định kỳ",
        ].map((x) => (
          <div
            key={x}
            className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-slate-700 hover:shadow-md hover:border-slate-300 transition"
          >
            {x}
          </div>
        ))}
      </div>
    </main>
  );
}
