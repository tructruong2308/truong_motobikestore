import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: "system", content: "Bạn là trợ lý bán hàng tiếng Việt. Trả lời như một tư vấn viên thân thiện, súc tích." }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pendingImages, setPendingImages] = useState([]); // [{file, previewUrl, uploadedUrl}]
  const endRef = useRef(null);

  // ====== styles Messenger-like ======
  const z = 10000;
  const btn = {
    position: "fixed", right: 20, bottom: 20, width: 56, height: 56,
    borderRadius: "50%", border: 0, cursor: "pointer",
    background: "#0084ff", color: "#fff", fontWeight: 800, fontSize: 16,
    boxShadow: "0 10px 24px rgba(0,0,0,.2)", zIndex: z
  };
  const panel = {
    position: "fixed", right: 20, bottom: 84, width: 360, maxWidth: "calc(100vw - 24px)",
    maxHeight: "70vh", display: "flex", flexDirection: "column",
    background: "#fff", borderRadius: 16, overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,.22)", zIndex: z
  };
  const header = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px", borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc", fontWeight: 700
  };
  const avatar = {
    width: 28, height: 28, borderRadius: "50%", background: "#e5f3ff",
    display: "grid", placeItems: "center", color: "#0084ff", fontWeight: 800
  };
  const body = { padding: 12, overflowY: "auto", flex: 1, background: "#fff" };
  const inputBar = { padding: 10, borderTop: "1px solid #e5e7eb", display: "flex", gap: 8, alignItems: "center", background: "#fff" };
  const iconBtn = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "8px 10px", cursor: "pointer" };
  const sendBtn = (dis) => ({
    border: 0, borderRadius: 12, padding: "10px 14px",
    background: dis ? "#9ca3af" : "#0084ff", color: "#fff", fontWeight: 700, cursor: dis ? "not-allowed" : "pointer"
  });
  const row = (me) => ({ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 8 });
  const bubble = (me) => ({
    background: me ? "#0084ff" : "#f1f5f9", color: me ? "#fff" : "#0f172a",
    padding: "8px 12px", borderRadius: 18, maxWidth: "80%", lineHeight: 1.5,
    borderTopRightRadius: me ? 4 : 18, borderTopLeftRadius: me ? 18 : 4
  });
  const imgThumb = { width: 160, height: "auto", borderRadius: 10, display: "block" };

  // ====== helpers ======
  const scrollEnd = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const pickImage = async () => {
    const inputEl = document.createElement("input");
    inputEl.type = "file";
    inputEl.accept = "image/*";
    inputEl.onchange = () => {
      const file = inputEl.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { file, previewUrl, uploadedUrl: null }]);
    };
    inputEl.click();
  };

  const uploadOne = async (item) => {
    const fd = new FormData();
    fd.append("file", item.file);
    const res = await fetch(`${API}/chat/upload`, { method: "POST", body: fd });
    const j = await res.json();
    return j?.url;
  };

  // Render content: text có thể chứa ![](url) hoặc URL hình → hiển thị ảnh
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

    // 1) upload ảnh trước (nếu có)
    let uploaded = [];
    if (pendingImages.length) {
      uploaded = await Promise.all(pendingImages.map(async (it) => {
        try { const url = await uploadOne(it); return { ...it, uploadedUrl: url }; }
        catch { return it; }
      }));
    }

    // 2) build contentParts: text + images
    const contentParts = [];
    if (input.trim()) contentParts.push({ type: "text", text: input.trim() });
    for (const it of uploaded) {
      if (it.uploadedUrl) contentParts.push({ type: "image_url", image_url: { url: it.uploadedUrl } });
    }

    const newMsgs = [...msgs, { role: "user", content: input }, { role: "assistant", content: "" }];
    // Lưu “phần ảnh” vào bản ghi user bên cạnh để hiển thị luôn
    if (uploaded.length) {
      const imgMsg = {
        role: "user",
        content: uploaded.map(u => `![](${u.uploadedUrl || u.previewUrl})`).join("\n")
      };
      newMsgs.splice(newMsgs.length - 1, 0, imgMsg);
    }

    setMsgs(newMsgs);
    setInput("");
    setPendingImages([]);
    setStreaming(true);

    // 3) gọi stream (gửi messages; riêng message cuối của user sẽ đi qua contentParts)
    const msgsForApi = [...msgs.filter(m => m.role !== 'system'), { role: "user", contentParts }];
    const url = new URL(`${API}/chat/stream`);
    url.searchParams.set("messages", JSON.stringify(msgsForApi));
    url.searchParams.set("use_db", "1");

    const idx = newMsgs.length - 1; // assistant placeholder
    const ev = new EventSource(url.toString());
    ev.onmessage = (e) => {
      if (e.data === "[DONE]") { ev.close(); setStreaming(false); return; }
      setMsgs(prev => {
        const clone = [...prev];
        clone[idx] = { role: "assistant", content: (clone[idx]?.content || "") + e.data };
        return clone;
      });
      scrollEnd();
    };
    ev.onerror = () => { ev.close(); setStreaming(false); };
  };

  // ESC để đóng
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {open && (
        <div style={panel}>
          <div style={header}>
            <div style={avatar}>AI</div>
            Trợ lý AI
          </div>
          <div style={body}>
            {msgs.filter(m => m.role !== "system").map((m, i) => (
              <div key={i} style={row(m.role === "user")}>
                <div style={bubble(m.role === "user")}>
                  {renderContent(m.content || "")}
                </div>
              </div>
            ))}

            {/* Preview ảnh sắp gửi */}
            {pendingImages.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", margin: "6px 0" }}>
                {pendingImages.map((it, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={it.previewUrl} alt="" style={imgThumb} />
                  </div>
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
              style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 16, padding: "10px 12px", outline: "none" }}
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
