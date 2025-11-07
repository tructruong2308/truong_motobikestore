import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
// Đặt link ảnh avatar AI (có thể để vào /src/assets và import):
const AI_AVATAR = "https://i.imgur.com/FOhT2sO.png"; // đổi link ảnh bạn muốn
const USER_AVATAR = "https://i.pravatar.cc/120?u=user"; // tuỳ chọn

export default function FloatingChat() {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState([
    { role: "system", content: "Bạn là trợ lý bán hàng." }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const endRef = useRef(null);

  const z = 10000;
  const btn = { position:"fixed", right:20, bottom:20, width:56, height:56, borderRadius:"50%", border:0, cursor:"pointer",
    background:"#0084ff", color:"#fff", fontWeight:800, fontSize:16, boxShadow:"0 10px 24px rgba(0,0,0,.2)", zIndex:z };
  const panel = { position:"fixed", right:20, bottom:84, width:360, maxWidth:"calc(100vw - 24px)", maxHeight:"70vh",
    display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, overflow:"hidden",
    boxShadow:"0 20px 40px rgba(0,0,0,.22)", zIndex:z };
  const header = { display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:"1px solid #e5e7eb",
    background:"#f8fafc", fontWeight:700 };
  const avatar = (url)=>({ width:28, height:28, borderRadius:"50%", overflow:"hidden", background:"#e5f3ff",
    display:"grid", placeItems:"center", flex:"0 0 28px" });
  const body = { padding:12, overflowY:"auto", flex:1, background:"#fff" };
  const inputBar = { padding:10, borderTop:"1px solid #e5e7eb", display:"flex", gap:8, alignItems:"center", background:"#fff" };
  const iconBtn = { border:"1px solid #e5e7eb", background:"#fff", borderRadius:12, padding:"8px 10px", cursor:"pointer" };
  const sendBtn = (dis)=>({ border:0, borderRadius:12, padding:"10px 14px", background: dis ? "#9ca3af" : "#0084ff",
    color:"#fff", fontWeight:700, cursor: dis ? "not-allowed" : "pointer" });
  const row = (me)=>({ display:"flex", alignItems:"flex-end", gap:8, justifyContent: me ? "flex-end" : "flex-start", marginBottom:8 });
  const bubble = (me)=>({ background: me ? "#0084ff" : "#f1f5f9", color: me ? "#fff" : "#0f172a",
    padding:"8px 12px", borderRadius:18, maxWidth:"75%", lineHeight:1.55,
    borderTopRightRadius: me ? 4 : 18, borderTopLeftRadius: me ? 18 : 4, whiteSpace:"pre-wrap" });
  const imgThumb = { width: 180, height: "auto", borderRadius: 10, display: "block" };

  const scrollEnd = ()=> endRef.current?.scrollIntoView({ behavior:"smooth" });

  const pickImage = () => {
    const inputEl = document.createElement("input");
    inputEl.type = "file"; inputEl.accept = "image/*";
    inputEl.onchange = ()=>{
      const file = inputEl.files?.[0]; if(!file) return;
      const previewUrl = URL.createObjectURL(file);
      setPendingImages(prev=>[...prev, { file, previewUrl, uploadedUrl:null }]);
    };
    inputEl.click();
  };

  const uploadOne = async (item) => {
    const fd = new FormData(); fd.append("file", item.file);
    const r = await fetch(`${API}/chat/upload`, { method:"POST", body: fd });
    const j = await r.json(); return j?.url;
  };

  const renderContent = (text) => {
    const parts = [];
    const regex = /!\[[^\]]*\]\(([^)]+)\)|https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)/gi;
    let last = 0, m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(<span key={last}>{text.slice(last, m.index)}</span>);
      const url = m[1] || m[0];
      parts.push(<img key={m.index} src={url} alt="" style={{ ...imgThumb, marginTop: 6 }} onError={(e)=>{e.currentTarget.style.display='none'}} />);
      last = regex.lastIndex;
    }
    if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
    return parts.length ? parts : text;
  };

  const ask = async () => {
    if ((!input.trim() && pendingImages.length === 0) || streaming) return;

    // upload ảnh nếu có
    let uploaded = [];
    if (pendingImages.length) {
      uploaded = await Promise.all(pendingImages.map(async (it) => {
        try { const url = await uploadOne(it); return { ...it, uploadedUrl: url }; } catch { return it; }
      }));
    }

    // message hiển thị của người dùng (text + preview ảnh dưới dạng markdown để render)
    const userShowParts = [];
    if (input.trim()) userShowParts.push(input.trim());
    if (uploaded.length) userShowParts.push(
      uploaded.map(u => `![](${u.uploadedUrl || u.previewUrl})`).join("\n")
    );
    const userShowText = userShowParts.filter(Boolean).join("\n");

    // thêm vào UI: user + placeholder assistant
    const newMsgs = [...msgs, { role:"user", content: userShowText }, { role:"assistant", content: "" }];
    setMsgs(newMsgs);
    setInput(""); setPendingImages([]); setStreaming(true);

    // message gửi API: contentParts (để Vision đọc ảnh)
    const contentParts = [];
    if (input.trim()) contentParts.push({ type:"text", text: input.trim() });
    for (const it of uploaded) if (it.uploadedUrl)
      contentParts.push({ type:"image_url", image_url: { url: it.uploadedUrl } });

    const msgsForApi = [...msgs.filter(m => m.role !== "system"), { role:"user", contentParts }];
    const url = new URL(`${API}/chat/stream`);
    url.searchParams.set("messages", JSON.stringify(msgsForApi));
    url.searchParams.set("use_db", "1");
    // bật đính ảnh sản phẩm từ DB cho model nếu muốn “nhìn” ảnh:
    // url.searchParams.set("attach_images", "1");

    const idx = newMsgs.length - 1;

    const ev = new EventSource(url.toString());
    ev.onmessage = (e) => {
      if (e.data === "[DONE]") { ev.close(); setStreaming(false); return; }
      // ← FIX: parse chunk để loại dấu ngoặc kép nếu BE json_encode
      let chunk = e.data;
      try { chunk = JSON.parse(e.data); } catch {}
      if (typeof chunk !== "string") chunk = String(chunk ?? "");

      setMsgs(prev => {
        const clone = [...prev];
        clone[idx] = { role:"assistant", content: (clone[idx]?.content || "") + chunk };
        return clone;
      });
      scrollEnd();
    };
    ev.onerror = () => { ev.close(); setStreaming(false); };
  };

  useEffect(() => {
    const onKey = e => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {open && (
        <div style={panel}>
          <div style={header}>
            <div style={avatar(AI_AVATAR)}>
              <img src={AI_AVATAR} alt="AI" style={{width:"100%",height:"100%",objectFit:"cover"}} />
            </div>
            Trợ lý AI
          </div>

          <div style={body}>
            {msgs.filter(m => m.role !== "system").map((m, i) => {
              const me = m.role === "user";
              return (
                <div key={i} style={row(me)}>
                  {!me && (
                    <div style={avatar(AI_AVATAR)}>
                      <img src={AI_AVATAR} alt="AI" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    </div>
                  )}
                  <div style={bubble(me)}>
                    {renderContent(m.content || "")}
                  </div>
                  {me && (
                    <div style={avatar(USER_AVATAR)}>
                      <img src={USER_AVATAR} alt="Me" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Preview ảnh chờ gửi (nếu có) */}
            {pendingImages.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", margin:"6px 0" }}>
                {pendingImages.map((it, i) => (
                  <img key={i} src={it.previewUrl} alt="" style={imgThumb} />
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div style={inputBar}>
            <button onClick={pickImage} title="Đính kèm ảnh" style={iconBtn}>📎</button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" ? ask() : null}
              placeholder="Nhập tin nhắn..."
              style={{ flex:1, border:"1px solid #e5e7eb", borderRadius:16, padding:"10px 12px", outline:"none" }}
            />
            <button onClick={ask} disabled={streaming} style={sendBtn(streaming)}>Gửi</button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(v => !v)} style={btn} aria-label="Chat AI">
        {open ? "×" : "AI"}
      </button>
    </>
  );
}
