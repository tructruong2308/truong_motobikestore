// src/pages/Admin/Coupon/AdminCoupons.jsx
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

/* ===== Helpers fix timezone ===== */
const pad = (n) => String(n).padStart(2, "0");

// Convert giá trị từ <input type="datetime-local"> (local time) -> chuỗi server "YYYY-MM-DD HH:mm:ss"
function toServerLocal(dtLocal) {
  if (!dtLocal) return null; // để BE nhận null
  // dtLocal ví dụ: "2025-10-20T21:38"
  const d = new Date(dtLocal);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Parse chuỗi server (có thể là "YYYY-MM-DD HH:mm:ss" hoặc ISO) -> giá trị cho input datetime-local "YYYY-MM-DDTHH:mm"
function toInputValue(serverTs) {
  if (!serverTs) return "";
  // Hỗ trợ cả "2025-10-20 21:38:00" và ISO "2025-10-20T21:38:00Z/±hh:mm"
  let d;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(serverTs)) {
    const [date, time] = serverTs.split(" ");
    const [y, m, da] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    d = new Date(y, (m || 1) - 1, da || 1, h || 0, mi || 0, 0);
  } else {
    d = new Date(serverTs);
  }
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Hiển thị đẹp theo giờ VN (tránh lệch timezone)
function fmtDisplay(serverTs) {
  if (!serverTs) return "...";
  // Parse giống toInputValue
  let d;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(serverTs)) {
    const [date, time] = serverTs.split(" ");
    const [y, m, da] = date.split("-").map(Number);
    const [h, mi, s] = time.split(":").map(Number);
    d = new Date(y, (m || 1) - 1, da || 1, h || 0, mi || 0, s || 0);
  } else {
    d = new Date(serverTs);
  }
  if (Number.isNaN(d.getTime())) return serverTs;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
}

export default function AdminCoupons() {
  /* ====== STYLE ONLY (không đổi cấu trúc) ====== */
  const css = `
.ac-wrap{display:grid; gap:12px}
.ac-title{display:flex;align-items:center;gap:10px}
.ac-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid rgba(148,163,184,.25);border-radius:999px;background:rgba(2,6,23,.35);font-size:12px;color:#cbd5e1;font-weight:700}
.ac-card{border:1px solid rgba(148,163,184,.18);border-radius:14px;background:#0b1320}
.ac-card-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(2,6,23,.35);border-top-left-radius:14px;border-top-right-radius:14px}
.ac-card-bd{padding:12px 14px}
.ac-grid4{display:grid;gap:8px;grid-template-columns:repeat(4,1fr)}
.ac-grid2{display:grid;gap:8px;grid-template-columns:repeat(2,1fr)}
.ac-row{display:flex;gap:8px;flex-wrap:wrap}
.ac-actions{display:flex;gap:6px}
.ac-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;border:1px solid rgba(148,163,184,.18);font-size:12px}
.ac-chip.on{color:#10b981;background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.25)}
.ac-chip.off{color:#f87171;background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.25)}
.ac-table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:12px}
.ac-table thead th{padding:12px;border-bottom:1px solid rgba(148,163,184,.16);text-align:left;background:rgba(2,6,23,.25);font-weight:800;color:#e2e8f0}
.ac-table tbody td{padding:12px;border-bottom:1px dashed rgba(148,163,184,.14);vertical-align:middle}
.ac-table tbody tr:hover{background:rgba(2,6,23,.35)}
.u-btn{height:36px;padding:0 12px;border-radius:10px;border:1px solid rgba(148,163,184,.25);background:#0f172a;color:#e2e8f0;font-weight:800;cursor:pointer}
.u-btn.outline{background:rgba(2,6,23,.45)}
.u-btn.ghost{background:transparent}
.u-input{height:36px;padding:0 10px;border-radius:10px;border:1px solid rgba(148,163,184,.25);background:#0f172a;color:#e2e8f0}
.u-border{border:1px solid rgba(148,163,184,.18)}
@media (max-width: 1080px){ .ac-grid4{grid-template-columns:1fr 1fr}; .ac-grid2{grid-template-columns:1fr} }
  `;

  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    code: "", type: "percent", value: 10,
    min_order: 0, max_discount: 0,
    usage_limit: "", per_user_limit: "",
    starts_at: "", ends_at: "", is_active: true,
  };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // id

  const token = localStorage.getItem("admin_token");

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/coupons?q=${encodeURIComponent(q)}`, { headers });
      const js = await res.json().catch(() => ({}));
      const items = js?.data?.data || js?.data || [];
      setList(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // lần đầu
  const reload = () => load();

  const save = async () => {
    try {
      const body = { ...form };

      // Convert number fields
      ["max_discount","usage_limit","per_user_limit","min_order"].forEach(k=>{
        if (body[k] === "" || body[k] === null) body[k] = null;
        else body[k] = Number(body[k] || 0);
      });

      // IMPORTANT: convert datetime-local -> server string
      body.starts_at = toServerLocal(body.starts_at); // null nếu rỗng
      body.ends_at   = toServerLocal(body.ends_at);

      const url = editing ? `${API}/admin/coupons/${editing}` : `${API}/admin/coupons`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const js = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(js?.message || "Lưu thất bại");
      alert("✅ Đã lưu coupon");
      setForm(emptyForm); setEditing(null);
      reload();
    } catch (e) {
      alert("❌ " + (e.message || e));
    }
  };

  const edit = (c) => {
    setEditing(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      min_order: c.min_order || 0,
      max_discount: c.max_discount ?? "",
      usage_limit: c.usage_limit ?? "",
      per_user_limit: c.per_user_limit ?? "",
      // IMPORTANT: map server ts -> input value
      starts_at: toInputValue(c.starts_at),
      ends_at: toInputValue(c.ends_at || c.expires_at), // phòng khi field tên khác
      is_active: !!c.is_active,
    });
  };

  const del = async (id) => {
    if (!confirm("Xoá coupon này?")) return;
    const res = await fetch(`${API}/admin/coupons/${id}`, { method:"DELETE", headers });
    if (!res.ok) return alert("Xoá thất bại");
    reload();
  };

  const toggle = async (id) => {
    const res = await fetch(`${API}/admin/coupons/${id}/toggle`, { method:"PATCH", headers });
    if (!res.ok) return alert("Không đổi trạng thái được");
    reload();
  };

  return (
    <div className="ac-wrap">
      <style>{css}</style>

      <div className="ac-title">
        <h2 style={{ margin: 0 }}>Mã giảm giá</h2>
        <span className="ac-badge">Tổng: {list.length}</span>
      </div>

      {/* Form tạo/sửa */}
      <div className="ac-card">
        <div className="ac-card-hd">
          <b>{editing ? "Cập nhật coupon" : "Tạo coupon mới"}</b>
        </div>
        <div className="ac-card-bd">
          <div className="ac-grid4">
            <input
              className="u-input"
              placeholder="Mã (CODE)"
              value={form.code}
              onChange={(e)=>setForm({...form, code:e.target.value.toUpperCase().replace(/\s+/g,'')})}
            />
            <select
              className="u-input"
              value={form.type}
              onChange={(e)=>setForm({...form, type:e.target.value})}
            >
              <option value="percent">% phần trăm</option>
              <option value="fixed">Số tiền cố định</option>
            </select>
            <input
              className="u-input" type="number"
              placeholder={form.type==='percent'?'%':'Số tiền'}
              value={form.value}
              onChange={(e)=>setForm({...form, value:+e.target.value || 0})}
            />
            <input
              className="u-input" type="number"
              placeholder="Đơn tối thiểu"
              value={form.min_order}
              onChange={(e)=>setForm({...form, min_order:e.target.value})}
            />
          </div>

          <div className="ac-grid4" style={{ marginTop: 8 }}>
            <input
              className="u-input" type="number"
              placeholder="Trần giảm (nếu %)"
              value={form.max_discount}
              onChange={(e)=>setForm({...form, max_discount:e.target.value})}
            />
            <input
              className="u-input" type="number"
              placeholder="Tổng lượt (rỗng = ∞)"
              value={form.usage_limit}
              onChange={(e)=>setForm({...form, usage_limit:e.target.value})}
            />
            <input
              className="u-input" type="number"
              placeholder="Lượt mỗi user (rỗng = ∞)"
              value={form.per_user_limit}
              onChange={(e)=>setForm({...form, per_user_limit:e.target.value})}
            />
            <label className="ac-row" style={{ alignItems:"center" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e)=>setForm({...form, is_active:e.target.checked})}
              />
              Kích hoạt
            </label>
          </div>

          <div className="ac-grid2" style={{ marginTop: 8 }}>
            <input
              className="u-input" type="datetime-local"
              value={form.starts_at}
              onChange={(e)=>setForm({...form, starts_at:e.target.value})}
            />
            <input
              className="u-input" type="datetime-local"
              value={form.ends_at}
              onChange={(e)=>setForm({...form, ends_at:e.target.value})}
            />
          </div>

          <div className="ac-row" style={{ marginTop: 10 }}>
            <button className="u-btn" onClick={save}>
              {editing ? "Cập nhật" : "Tạo mới"}
            </button>
            {editing && (
              <button
                className="u-btn ghost"
                onClick={()=>{ setForm(emptyForm); setEditing(null); }}
              >
                Huỷ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách */}
      <div className="ac-card">
        <div className="ac-card-bd">
          <div className="ac-row" style={{ marginBottom: 8 }}>
            <input
              className="u-input"
              placeholder="Tìm theo mã…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <button className="u-btn" onClick={reload}>Tải lại</button>
          </div>

          {loading ? (
            <div className="ac-badge">Đang tải…</div>
          ) : (
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Tối thiểu</th>
                  <th>Giới hạn</th>
                  <th>Hiệu lực</th>
                  <th>TT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((c)=>(
                  <tr key={c.id}>
                    <td><b>{c.code}</b></td>
                    <td>{c.type}</td>
                    <td>
                      {c.type==='percent' ? `${c.value}%` : `${VND.format(c.value)}₫`}
                      {c.max_discount ? ` (max ${VND.format(c.max_discount)}₫)` : ""}
                    </td>
                    <td>{VND.format(c.min_order||0)}₫</td>
                    <td> Tổng: {c.usage_limit??'∞'} | Mỗi user: {c.per_user_limit??'∞'} </td>
                    <td>
                      {(c.starts_at || c.ends_at || c.expires_at)
                        ? `${fmtDisplay(c.starts_at)} → ${fmtDisplay(c.ends_at || c.expires_at)}`
                        : 'Luôn hiệu lực'}
                    </td>
                    <td>
                      <span className={`ac-chip ${c.is_active ? 'on' : 'off'}`}>
                        {c.is_active ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <div className="ac-actions">
                        <button className="u-btn outline" onClick={()=>edit(c)}>Sửa</button>
                        <button className="u-btn" onClick={()=>toggle(c.id)}>{c.is_active ? 'Tắt' : 'Bật'}</button>
                        <button className="u-btn ghost" onClick={()=>del(c.id)}>Xoá</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!list.length && (
                  <tr>
                    <td colSpan={8} style={{ textAlign:'center', opacity:.7 }}>
                      Chưa có mã
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
