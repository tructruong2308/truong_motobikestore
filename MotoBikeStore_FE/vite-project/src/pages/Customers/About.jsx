export default function About() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-4">Về MotoBikeStore</h1>
      <p className="text-slate-300 mb-8">
        MotoBikeStore là cửa hàng xe máy & phụ kiện hiện đại, minh bạch, giá hợp lý và
        dịch vụ hậu mãi tận tâm. Chúng tôi tự hào mang lại trải nghiệm mua sắm đáng tin cậy cho mọi khách hàng.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">Sứ mệnh</h2>
          <p>Giúp khách hàng chọn đúng chiếc xe phù hợp nhất với nhu cầu và ngân sách.</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">Giá trị cốt lõi</h2>
          <ul className="list-disc ml-5 space-y-1 text-slate-300">
            <li>Trung thực & minh bạch</li>
            <li>Nhanh chóng & đúng hẹn</li>
            <li>Bảo hành rõ ràng</li>
          </ul>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">Đội ngũ</h2>
          <p>Kỹ thuật viên chứng chỉ hãng, tư vấn viên giàu kinh nghiệm, chăm sóc 24/7.</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Tại sao chọn chúng tôi?</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {[
          "Nguồn hàng chính hãng",
          "Trả góp linh hoạt",
          "Hỗ trợ đăng ký biển số",
          "Bảo dưỡng định kỳ",
        ].map((x) => (
          <div key={x} className="rounded-xl bg-slate-800/50 p-4 border border-slate-700">
            {x}
          </div>
        ))}
      </div>
    </main>
  );
}
