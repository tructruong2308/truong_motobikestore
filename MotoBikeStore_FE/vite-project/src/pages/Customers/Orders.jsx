import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("customer_token");
        const res = await fetch(`${API}/api/orders?per_page=50`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "Không tải được danh sách đơn hàng");
        }

        // Hỗ trợ cả 2 kiểu payload (mảng thẳng hoặc paginate)
        const payload = json?.data;
        const list = Array.isArray(payload) ? payload : (payload?.data || []);
        setOrders(list);
        if (!list.length) setMsg("Bạn chưa có đơn hàng nào.");
      } catch (e) {
        setMsg("❌ " + (e.message || "Có lỗi xảy ra"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="u-card u-border p-3">⏳ Đang tải đơn hàng…</div>;

  return (
    <div className="u-card u-border" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Đơn hàng của tôi</h2>
      {msg && <div className="u-card u-border" style={{ padding: 10, marginBottom: 10 }}>{msg}</div>}

      {orders.map(o => (
        <div key={o.id} className="u-card u-border" style={{ padding: 12, marginBottom: 10 }}>
          <div><b>Mã đơn:</b> {o.code || o.id}</div>
          <div><b>Tổng tiền:</b> {Number(o.total || 0).toLocaleString()}₫</div>
          <div><b>Trạng thái:</b> {o.status}</div>
          <div><b>Thanh toán:</b> {o.payment_method || "-"}</div>
          <div><b>Ngày tạo:</b> {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</div>
        </div>
      ))}
    </div>
  );
}
