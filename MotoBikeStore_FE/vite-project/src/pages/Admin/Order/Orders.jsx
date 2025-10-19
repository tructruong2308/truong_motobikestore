// src/pages/Admin/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import Skeleton from "../../../components/ui/Skeleton";
import FilterBar from "../../../components/ui/FilterBar";

const API_BASE = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

const COLOR_BY_STATUS = { 0: "info", 1: "success", 2: "danger" };
const LABEL_BY_STATUS = { 0: "Pending", 1: "Completed", 2: "Cancelled" };

export default function Orders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sel, setSel] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  // ---- Auth helpers (ADMIN) ----
  const getAdminToken = () => {
    try {
      return localStorage.getItem("admin_token") || "";
    } catch {
      return "";
    }
  };
  const handle401 = () => {
    try {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    } catch {}
    window.location.href = "/admin/login";
  };
  const authHeaders = (withJson = true) => {
    const token = getAdminToken();
    const base = { Accept: "application/json" };
    if (withJson) base["Content-Type"] = "application/json";
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  };

  // ===== STYLE: đẹp, gọn, bám dark theme =====
  const styles = `
  .admin-orders .kpi-grid{
    display:grid; grid-template-columns:repeat(4,1fr); gap:12px;
  }
  .admin-orders .kpi{
    display:flex; align-items:center; gap:12px; padding:12px 14px;
    border:1px solid rgba(100,116,139,.22); border-radius:14px;
    background:linear-gradient(180deg, #0b0e14, #0a0f1e);
  }
  .admin-orders .kpi i{
    width:40px; height:40px; display:grid; place-items:center; font-size:18px;
    border-radius:10px; background:rgba(100,116,139,.20); color:#cbd5e1;
  }
  .admin-orders .kpi h4{ margin:0; font-size:13px; opacity:.8 }
  .admin-orders .kpi b{ font-size:18px }

  .admin-orders .table-wrap{
    border:1px solid rgba(100,116,139,.22);
    border-radius:14px; overflow:hidden; background:#0e1320;
  }
  .admin-orders table{ width:100%; border-collapse:separate; border-spacing:0 }
  .admin-orders thead th{
    position:sticky; top:0; z-index:1;
    background:#0b0f1a;
    border-bottom:1px solid rgba(100,116,139,.22);
    padding:12px; text-align:left; font-weight:700;
    color:#e5e7eb;
  }
  .admin-orders tbody td{
    padding:12px 14px; border-bottom:1px solid rgba(100,116,139,.14);
    color:#e5e7eb;
  }
  .admin-orders tbody tr:hover{ background:rgba(148,163,184,.08) }
  .admin-orders tbody tr:nth-child(even){ background:rgba(148,163,184,.05) }

  .admin-orders .status-select{
    height:34px; border-radius:10px;
    background:#0b1220; color:#e5e7eb;
    border:1px solid rgba(100,116,139,.35); padding:0 10px;
  }
  .admin-orders .actions{ display:flex; gap:8px; align-items:center }
  .admin-orders .btn-sm{ height:34px; padding:0 12px; border-radius:10px }

  .admin-orders .quick-status{
    display:flex; gap:8px; flex-wrap:wrap;
  }
  .admin-orders .chip{
    padding:6px 10px; border-radius:999px;
    border:1px solid rgba(100,116,139,.35);
    background:#0b1220; color:#cbd5e1; cursor:pointer;
  }
  .admin-orders .chip.active{ 
    background:rgba(34,197,94,.12); border-color:rgba(34,197,94,.45); color:#bbf7d0;
  }
  `;

  // ===== normalize =====
  const normalizeOrder = (o) => ({
    id: o.id,
    name: o.name ?? "",
    email: o.email ?? "",
    phone: o.phone ?? "",
    address: o.address ?? "",
    status: Number(o.status ?? 0),
    total: Number(
      o.total ??
        (Array.isArray(o.details)
          ? o.details.reduce((s, d) => s + Number(d.price_buy || 0) * Number(d.qty || 0), 0)
          : 0)
    ),
    created_at: o.created_at ?? o.createdAt ?? "",
    _raw: o,
  });

  // ===== fetch =====
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders(false) });

      if (res.status === 401) { handle401(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json().catch(() => ({}));
      const list =
        (Array.isArray(data) && data) ||
        data?.data ||
        data?.orders ||
        data?.items ||
        [];
      setItems(list.map(normalizeOrder));
    } catch (e) {
      setErr(String(e?.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchOrders(); /* eslint-disable-next-line */ }, []);

  // ===== derived =====
  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const s = q.trim().toLowerCase();
      out = out.filter((o) =>
        [o.id, o.name, o.email, o.phone, o.address].filter(Boolean).join(" ").toLowerCase().includes(s)
      );
    }
    if (status !== "all") out = out.filter((o) => String(o.status) === String(status));
    const dir = sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const ka = a[sort.key]; const kb = b[sort.key];
      if (ka === kb) return 0; return ka > kb ? dir : -dir;
    });
    return out;
  }, [items, q, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const kpi = useMemo(() => {
    const p = items.filter((i) => i.status === 0).length;
    const c = items.filter((i) => i.status === 1).length;
    const x = items.filter((i) => i.status === 2).length;
    const sum = items.reduce((s, i) => s + Number(i.total || 0), 0);
    return { all: items.length, p, c, x, sum };
  }, [items]);

  function StatusBadge({ s }) {
    return <Badge color={COLOR_BY_STATUS[s] || "default"}>{LABEL_BY_STATUS[s] || s}</Badge>;
  }

  const openDetail = async (o) => {
    setSel({ ...o, _loading: true });
    try {
      const res = await fetch(`${API_BASE}/orders/${o.id}`, { headers: authHeaders(false) });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        const items = d?.items || d?.order_details || d?.details || [];
        setSel({ ...normalizeOrder(d.id ? d : o), items, _loading: false });
      } else {
        setSel({ ...o, _loading: false });
      }
    } catch {
      setSel({ ...o, _loading: false });
    }
  };

  async function updateStatus(orderId, nextStatus) {
    try {
      setPendingId(orderId);
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ status: Number(nextStatus) }),
      });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${msg}`);
      }
      setItems((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: Number(nextStatus) } : o)));
      if (sel?.id === orderId) setSel((s) => ({ ...s, status: Number(nextStatus) }));
    } catch (e) {
      alert(`Cập nhật trạng thái thất bại: ${e.message || e}`);
    } finally {
      setPendingId(null);
    }
  }

  const exportCSV = () => {
    const header = ["ID", "Khách", "Email", "Phone", "Tổng", "Trạng thái", "Tạo lúc"];
    const rows = filtered.map((o) => [
      o.id, o.name, o.email, o.phone,
      VND.format(Number(o.total || 0)),
      LABEL_BY_STATUS[o.status] || o.status,
      String(o.created_at),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="admin-orders u-grid" style={{ gap: 16 }}>
      <style>{styles}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Đơn hàng</h1>
        <span className="u-chip">Tổng: {kpi.all}</span>
        {!!err && <span className="u-chip" style={{ borderColor: "rgba(239,68,68,.45)", color: "#fecaca" }}>Lỗi: {String(err)}</span>}
        <div style={{ flex: 1 }} />
        <Button onClick={exportCSV} className="btn-sm">Xuất CSV</Button>
      </div>

      {/* KPI */}
      <div className="kpi-grid">
        <div className="kpi">
          <i>🕒</i>
          <div>
            <h4>Chờ xử lý</h4>
            <b>{kpi.p}</b>
          </div>
        </div>
        <div className="kpi">
          <i style={{ background: "rgba(34,197,94,.15)", color: "#86efac" }}>✅</i>
          <div>
            <h4>Hoàn tất</h4>
            <b>{kpi.c}</b>
          </div>
        </div>
        <div className="kpi">
          <i style={{ background: "rgba(239,68,68,.15)", color: "#fecaca" }}>✖️</i>
          <div>
            <h4>Đã hủy</h4>
            <b>{kpi.x}</b>
          </div>
        </div>
        <div className="kpi">
          <i style={{ background: "rgba(234,179,8,.15)", color: "#fde68a" }}>💰</i>
          <div>
            <h4>Doanh thu</h4>
            <b>{VND.format(kpi.sum)}₫</b>
          </div>
        </div>
      </div>

      {/* Toolbar lọc/sắp xếp */}
      <FilterBar
        q={q}
        setQ={setQ}
        onReset={() => {
          setQ(""); setStatus("all"); setSort({ key: "created_at", dir: "desc" }); setPage(1);
        }}
      >
        <div className="quick-status">
          {[
            { k: "all", label: "Tất cả" },
            { k: "0", label: "Pending" },
            { k: "1", label: "Completed" },
            { k: "2", label: "Cancelled" },
          ].map((s) => (
            <button
              key={s.k}
              className={`chip ${String(status) === String(s.k) ? "active" : ""}`}
              type="button"
              onClick={() => { setStatus(s.k); setPage(1); }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select
          className="u-input"
          value={`${sort.key}:${sort.dir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(":");
            setSort({ key: k, dir: d });
          }}
        >
          <option value="created_at:desc">Mới nhất</option>
          <option value="created_at:asc">Cũ nhất</option>
          <option value="total:desc">Tổng cao → thấp</option>
          <option value="total:asc">Tổng thấp → cao</option>
          <option value="name:asc">Khách A→Z</option>
          <option value="name:desc">Khách Z→A</option>
        </select>
      </FilterBar>

      {/* Bảng */}
      <div className="table-wrap u-hover">
        <table>
          <thead>
            <tr>
              <th style={{ width: 72 }}>ID</th>
              <th>Khách</th>
              <th>Liên hệ</th>
              <th style={{ textAlign: "right" }}>Tổng</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th style={{ width: 230 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}><Skeleton h={44} r={8} /></td>
                </tr>
              ))}

            {!loading && pageItems.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td style={{ fontWeight: 600 }}>{o.name || "—"}</td>
                <td style={{ color: "#aab3cf" }}>
                  {o.email || ""}
                  {o.email && o.phone ? " · " : ""}
                  {o.phone || ""}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {VND.format(Number(o.total || 0))}₫
                </td>
                <td><StatusBadge s={o.status} /></td>
                <td>
                  <span className="u-chip">{String(o.created_at).slice(0, 19).replace("T", " ")}</span>
                </td>
                <td className="actions">
                  <Button variant="outline" onClick={() => openDetail(o)} className="btn-sm">
                    Chi tiết
                  </Button>
                  <select
                    className="status-select"
                    title="Đổi trạng thái"
                    value={o.status}
                    disabled={pendingId === o.id}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    <option value="0">Pending</option>
                    <option value="1">Completed</option>
                    <option value="2">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}

            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "36px 0", color: "#97a2c4" }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ opacity: 0.7 }}>Trang {page}/{totalPages}</span>
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-sm">
          Trước
        </Button>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="btn-sm">
          Sau
        </Button>
        <select
          className="u-input"
          value={pageSize}
          onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}
        >
          {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/trang</option>)}
        </select>
      </div>

      {/* Modal chi tiết */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Đơn #${sel?.id || ""}`}>
        {sel && (
          <div className="u-grid" style={{ gap: 10 }}>
            <div className="u-card u-border" style={{ padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <div className="u-chip">Khách</div><div style={{ fontWeight: 600 }}>{sel.name || "—"}</div>
                <div className="u-chip">Email</div><div>{sel.email || "—"}</div>
                <div className="u-chip">Phone</div><div>{sel.phone || "—"}</div>
                <div className="u-chip">Địa chỉ</div><div>{sel.address || "—"}</div>
                <div className="u-chip">Trạng thái</div><div><StatusBadge s={sel.status} /></div>
                <div className="u-chip">Tổng tiền</div><div style={{ fontWeight: 900 }}>{VND.format(sel.total || 0)}₫</div>
              </div>
            </div>

            {Array.isArray(sel.items) && sel.items.length > 0 && (
              <div className="u-card u-border" style={{ padding: 12 }}>
                <h4 style={{ marginTop: 0 }}>Sản phẩm</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  {sel.items.map((it, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 10, alignItems: "center" }}>
                      <img
                        src={it.thumbnail_url || it.thumbnail || "https://placehold.co/60x40?text=No+Img"}
                        alt="" style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 8 }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{it.name}</div>
                        <div className="u-chip">x{it.qty} · {VND.format(it.price)}₫</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{VND.format((it.qty || 1) * (it.price || 0))}₫</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
