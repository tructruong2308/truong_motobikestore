import { useEffect, useMemo, useRef, useState } from "react";

/* ====== Config ====== */
const API_ROOT = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
const ADMIN_API = `${API_ROOT}/admin`;
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY  = "admin_user";

/* ====== CSS ====== */
const styles = `
.admin-screen .toolbar{ display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap }
.admin-screen .toolbar input, .admin-screen .toolbar select{ height:36px; padding:0 10px; border-radius:10px; border:1px solid var(--line); background:var(--panel); color:var(--text); min-width:220px }
.admin-screen .toolbar .btn{ padding:8px 12px; border-radius:10px; border:1px solid var(--line); background:#1f2937; color:var(--text); font-weight:600; cursor:pointer }
:root[data-theme="light"] .admin-screen .toolbar .btn{ background:#fff }
.admin-screen .table-wrap{ border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--panel); margin-top:12px }
.admin-screen table{ width:100%; border-collapse:separate; border-spacing:0; font-size:14px }
.admin-screen thead th{ position:sticky; top:0; z-index:1; background:var(--panel-2); border-bottom:1px solid var(--line); padding:12px; text-align:left; font-weight:700; color:var(--text) }
.admin-screen tbody td{ padding:12px 14px; border-bottom:1px solid var(--line-soft); color:var(--text); vertical-align:middle }
.admin-screen tbody tr:hover{ background:rgba(148,163,184,.08) }
.admin-screen .badge{ border-radius:999px; padding:3px 9px; font-size:12px; border:1px solid transparent }
.admin-screen .badge.pub{ background:rgba(16,185,129,.18); color:#059669; border-color:rgba(16,185,129,.35) }
.admin-screen .badge.draft{ background:rgba(59,130,246,.14); color:#2563eb; border-color:rgba(59,130,246,.35) }
.admin-screen .btn-danger{ background:#ef4444; color:white; border:none; border-radius:8px; padding:6px 10px; font-size:12px; cursor:pointer }
.admin-screen .btn-danger:hover{ filter:brightness(1.05) }
.admin-screen .btn-text{ cursor:pointer; border:none; background:transparent; color:#93c5fd; font-weight:700 }
.admin-screen .pager{ display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px }
.modal{ position:fixed; inset:0; background:rgba(2,6,23,.45); display:flex; align-items:center; justify-content:center; z-index:50 }
.modal .card{ width:min(900px,95vw); max-height:90vh; overflow:auto; border:1px solid var(--line); background:var(--panel); border-radius:14px; }
.modal .hd{ display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border-bottom:1px solid var(--line); background:var(--panel-2) }
.modal .bd{ padding:14px }
.form-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px }
.form-grid .col-span-2{ grid-column:1/-1 }
.input{ width:100%; height:38px; padding:0 10px; border-radius:10px; border:1px solid var(--line); background:var(--panel); color:var(--text) }
.textarea{ width:100%; min-height:220px; padding:10px; border-radius:10px; border:1px solid var(--line); background:var(--panel); color:var(--text); resize:vertical }
label{ font-size:12px; opacity:.9; display:block; margin-bottom:4px }
.preview{ width:100%; max-height:220px; object-fit:cover; border:1px solid var(--line-soft); border-radius:10px }
.tools{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px }
`;

/* ====== Helpers ====== */
const normalize = (p) => ({
  id: p.id,
  title: p.title ?? "",
  slug: p.slug ?? "",
  excerpt: p.excerpt ?? "",
  content: p.content ?? "",
  thumbnail: p.thumbnail_url ?? p.thumbnail ?? "",
  published_at: p.published_at ?? null,
  created_at: p.created_at ?? p.createdAt ?? "",
  source: p.source ?? "",
  author: p.author ?? "",
});

const slugify = (s="") => s
  .toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/(^-|-$)+/g,"")
  .slice(0,220);

export default function Posts(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [qView,setQView]=useState(""); const [q,setQ]=useState("");

  const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState(10);
  const [lastPage,setLastPage]=useState(1);

  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);

  // ref để chèn ảnh vào vị trí con trỏ trong nội dung
  const contentRef = useRef(null);

  /* ===== Auth ===== */
  const authHeader=()=>{ const t=localStorage.getItem(ADMIN_TOKEN_KEY)||""; return t?{Authorization:`Bearer ${t}`}:{}}; 
  const authFail=(st)=>{ if(st===401||st===403){ localStorage.removeItem(ADMIN_TOKEN_KEY); localStorage.removeItem(ADMIN_USER_KEY); location.href="/admin/login"; return true;} return false; };

  /* ===== API endpoints ===== */
  const listEP = `${ADMIN_API}/posts`;
  const oneEP  = (id) => `${ADMIN_API}/posts/${id}`;
  const uploadEP = `${ADMIN_API}/posts/upload`;

  /* ===== Load list ===== */
  async function load(){
    try{
      setLoading(true); setErr("");
      const url = new URL(listEP);
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(pageSize));
      const r=await fetch(url.toString(), { headers:{ Accept:"application/json", ...authHeader() }});
      if (authFail(r.status)) return;
      if (!r.ok) throw new Error("Không tải được danh sách");
      const j=await r.json().catch(()=> ({}));
      const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
      setItems(arr.map(normalize));
      setLastPage(Number(j?.last_page || 1));
    }catch(e){ setErr(e.message || "Lỗi"); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); /*eslint-disable*/ }, [page, pageSize, q]);
  useEffect(()=>{ const t=setTimeout(()=> setQ(qView), 300); return ()=> clearTimeout(t); }, [qView]);

  const list = useMemo(()=> items, [items]);

  /* ===== CRUD ===== */
  function openNew(){
    setEditing({ id:0, title:"", slug:"", excerpt:"", content:"", thumbnail:"", published_at:null, source:"", author:"" });
  }
  function openEdit(it){ setEditing({...it}); }

  async function save(){
    if (!editing) return;
    try{
      setSaving(true);
      const payload = {
        title: editing.title?.trim(),
        slug: (editing.slug?.trim() || slugify(editing.title || "")),
        excerpt: editing.excerpt?.trim() || "",
        content: editing.content ?? "",
        thumbnail_url: editing.thumbnail ?? "",
        published_at: editing.published_at || null,
        source: editing.source ?? "",
        author: editing.author ?? "",
      };
      let r;
      if (editing.id){
        r = await fetch(oneEP(editing.id), {
          method:"PUT",
          headers:{ "Content-Type":"application/json", Accept:"application/json", ...authHeader() },
          body: JSON.stringify(payload),
        });
      } else {
        r = await fetch(listEP, {
          method:"POST",
          headers:{ "Content-Type":"application/json", Accept:"application/json", ...authHeader() },
          body: JSON.stringify(payload),
        });
      }
      if (authFail(r.status)) return;
      if (!r.ok) throw new Error("Lưu bài viết thất bại");
      await load(); setEditing(null);
    }catch(e){ alert(e.message || "Lỗi lưu"); }
    finally{ setSaving(false); }
  }

  async function remove(id){
    if (!confirm("Xoá bài viết này?")) return;
    try{
      const r=await fetch(oneEP(id), { method:"DELETE", headers:{ Accept:"application/json", ...authHeader() }});
      if (authFail(r.status)) return;
      if (!r.ok) throw new Error("Xoá thất bại");
      setItems(prev => prev.filter(x => x.id !== id));
    }catch(e){ alert(e.message || "Lỗi"); }
  }

  async function setPublished(it, publish){
    try{
      const ep = `${oneEP(it.id)}/${publish ? "publish" : "unpublish"}`;
      const r  = await fetch(ep, { method:"PATCH", headers:{ Accept:"application/json", ...authHeader() }});
      if (authFail(r.status)) return;
      if (!r.ok) throw new Error("Cập nhật trạng thái thất bại");
      setItems(prev => prev.map(x => x.id === it.id ? { ...x, published_at: publish ? new Date().toISOString() : null } : x));
    }catch(e){ alert(e.message || "Lỗi"); }
  }

  /* ===== Upload thumbnail ===== */
  async function handleUploadThumb(e){
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Ảnh quá 4MB"); return; }

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(uploadEP, { method:"POST", headers:{ ...authHeader() }, body: fd });
      if (authFail(res.status)) return;
      if (!res.ok) throw new Error("Upload thất bại");
      const j = await res.json();
      setEditing(v => ({ ...v, thumbnail: j.url }));
    } catch (err) { alert(err.message || "Upload lỗi"); }
  }

  /* ===== Chèn ảnh vào nội dung ===== */
  function insertHtmlIntoContent(html){
    setEditing(prev=>{
      if (!contentRef.current) return { ...prev, content: (prev.content || "") + html };
      const ta = contentRef.current;
      const start = ta.selectionStart ?? (prev.content?.length || 0);
      const end   = ta.selectionEnd ?? start;
      const before = (prev.content || "").slice(0, start);
      const after  = (prev.content || "").slice(end);
      const next = before + html + after;
      requestAnimationFrame(()=>{
        ta.focus();
        const pos = start + html.length;
        ta.setSelectionRange(pos, pos);
      });
      return { ...prev, content: next };
    });
  }

  async function handleUploadContentImg(e){
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024){ alert("Ảnh quá 4MB"); return; }

    const fd = new FormData();
    fd.append("file", file);
    try{
      const res = await fetch(uploadEP, { method:"POST", headers:{ ...authHeader() }, body: fd });
      if (authFail(res.status)) return;
      if (!res.ok) throw new Error("Upload ảnh thất bại");
      const j = await res.json();
      insertHtmlIntoContent(`\n<figure><img src="${j.url}" alt="" /></figure>\n`);
    }catch(err){ alert(err.message || "Upload lỗi"); }
  }

  /* ===== Render ===== */
  return (
    <section className="admin-screen">
      <style>{styles}</style>

      <div className="toolbar">
        <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Tin tức (Posts)</h1>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <input value={qView} onChange={e=> setQView(e.target.value)} placeholder="Tìm theo tiêu đề, slug…" />
          <button className="btn" onClick={openNew}>+ Bài viết mới</button>
        </div>
      </div>

      {err && <p style={{ color:"#fecaca" }}>{err}</p>}
      {loading && <p style={{ color:"var(--muted)" }}>Đang tải…</p>}

      {!loading && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề</th>
                  <th>Slug</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th style={{ textAlign:"center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {list.map(it => (
                  <tr key={it.id}>
                    <td>{it.id}</td>
                    <td>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        {it.thumbnail && (
                          <img
                            src={it.thumbnail}
                            alt=""
                            style={{ width:56, height:36, objectFit:"cover", borderRadius:6, border:"1px solid var(--line-soft)" }}
                            onError={(e)=> (e.currentTarget.style.display="none")}
                          />
                        )}
                        <div style={{ fontWeight:700 }}>{it.title}</div>
                      </div>
                      <div style={{ opacity:.7, fontSize:12, marginTop:4, maxWidth:520, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {it.excerpt}
                      </div>
                    </td>
                    <td><code>{it.slug}</code></td>
                    <td>
                      {it.published_at ? (
                        <span className="badge pub">Đang xuất bản</span>
                      ) : (
                        <span className="badge draft">Nháp</span>
                      )}
                    </td>
                    <td>{it.created_at ? new Date(it.created_at).toLocaleString("vi-VN") : ""}</td>
                    <td align="center">
                      <button className="btn-text" onClick={()=> openEdit(it)}>Sửa</button>
                      <span style={{ opacity:.35, margin:"0 6px" }}>|</span>
                      {it.published_at ? (
                        <button className="btn-text" onClick={()=> setPublished(it, false)}>Gỡ xuống</button>
                      ) : (
                        <button className="btn-text" onClick={()=> setPublished(it, true)}>Xuất bản</button>
                      )}
                      <span style={{ opacity:.35, margin:"0 6px" }}>|</span>
                      <button className="btn-danger" onClick={()=> remove(it.id)}>Xoá</button>
                    </td>
                  </tr>
                ))}
                {!list.length && (
                  <tr>
                    <td colSpan={6} align="center" style={{ padding:18, color:"var(--muted)" }}>Chưa có bài viết</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <span style={{ opacity:.7 }}>Trang {page}/{lastPage}</span>
            <button className="btn" onClick={()=> setPage(p=> Math.max(1, p-1))}>Trước</button>
            <button className="btn" onClick={()=> setPage(p=> Math.min(lastPage, p+1))}>Sau</button>
            <select value={pageSize} onChange={e=> { setPageSize(+e.target.value); setPage(1); }}>
              {[10,20,50].map(n => <option key={n} value={n}>{n}/trang</option>)}
            </select>
          </div>
        </>
      )}

      {editing && (
        <div className="modal" onClick={()=> setEditing(null)}>
          <div className="card" onClick={(e)=> e.stopPropagation()}>
            <div className="hd">
              <b>{editing.id ? `Sửa bài #${editing.id}` : "Thêm bài viết"}</b>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={save} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</button>
                <button className="btn" onClick={()=> setEditing(null)}>Đóng</button>
              </div>
            </div>
            <div className="bd">
              <div className="form-grid">
                <div className="col-span-2">
                  <label>Tiêu đề</label>
                  <input className="input" value={editing.title} onChange={e=> setEditing(v=> ({...v, title:e.target.value}))}/>
                </div>
                <div>
                  <label>Slug (để trống sẽ tự tạo)</label>
                  <input className="input" value={editing.slug} onChange={e=> setEditing(v=> ({...v, slug:e.target.value}))}/>
                </div>
                <div>
                  <label>Nguồn</label>
                  <input className="input" value={editing.source} onChange={e=> setEditing(v=> ({...v, source:e.target.value}))}/>
                </div>
                <div>
                  <label>Tác giả</label>
                  <input className="input" value={editing.author} onChange={e=> setEditing(v=> ({...v, author:e.target.value}))}/>
                </div>
                <div>
                  <label>Thời điểm xuất bản</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={editing.published_at ? new Date(editing.published_at).toISOString().slice(0,16) : ""}
                    onChange={e=> setEditing(v=> ({...v, published_at: e.target.value ? new Date(e.target.value).toISOString() : null}))}
                  />
                </div>
                <div className="col-span-2">
                  <label>Mô tả ngắn</label>
                  <input className="input" value={editing.excerpt} onChange={e=> setEditing(v=> ({...v, excerpt:e.target.value}))}/>
                </div>

                <div className="col-span-2">
                  <label>Ảnh thumbnail (URL)</label>
                  <input className="input" value={editing.thumbnail} onChange={e=> setEditing(v=> ({...v, thumbnail:e.target.value}))}/>
                  <div className="tools">
                    <input id="thumb-file" type="file" accept="image/*" onChange={handleUploadThumb} style={{ display:"none" }} />
                    <button className="btn" type="button" onClick={()=> document.getElementById('thumb-file').click()}>Chọn ảnh…</button>
                    <small style={{ opacity:.7 }}>JPG/PNG/WEBP/AVIF ≤ 4MB</small>
                  </div>
                  {editing.thumbnail && <img className="preview" src={editing.thumbnail} alt="" onError={(e)=> (e.currentTarget.style.display="none")} />}
                </div>

                <div className="col-span-2">
                  <label>Nội dung (HTML/Markdown)</label>
                  <div className="tools">
                    <input id="content-file" type="file" accept="image/*" onChange={handleUploadContentImg} style={{ display:"none" }}/>
                    <button className="btn" type="button" onClick={()=> document.getElementById("content-file").click()}>
                      📷 Chèn ảnh vào nội dung
                    </button>
                    <small style={{ opacity:.7 }}>Ảnh sẽ upload & chèn ngay vị trí con trỏ</small>
                  </div>
                  <textarea
                    ref={contentRef}
                    className="textarea"
                    value={editing.content}
                    onChange={e=> setEditing(v=> ({...v, content:e.target.value}))}
                    placeholder="Bạn có thể dán HTML hoặc Markdown…"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
