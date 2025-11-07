import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
const FILE_BASE = API.replace(/\/api\/?$/, ""); // http://host:port

// ====== Lấy thông tin khách hàng đăng nhập từ localStorage ======
const getCustomer = () => {
  try { return JSON.parse(localStorage.getItem("customer_user") || "null"); }
  catch { return null; }
};
const resolveAvatar = (u) => {
  if (!u) return null;
  if (u.avatar_url) return u.avatar_url; // BE đã trả URL tuyệt đối
  if (typeof u.avatar === "string" && u.avatar.length) {
    if (/^https?:\/\//i.test(u.avatar)) return u.avatar;
    return `${FILE_BASE}/storage/${u.avatar.replace(/^\/+/, "")}`;
  }
  return null;
};

// ====== Visitor ID (ẩn danh) để gắn memory khi chưa login ======
const VISITOR_KEY = "visitor_id";
const getVisitorId = () => {
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) { v = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, v); }
  return v;
};

// ====== Lưu/khôi phục lịch sử chat (client) ======
const LS_CHAT = "ai_chat_messages";
const loadMsgs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_CHAT) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
};
const saveMsgs = (msgs) => {
  // chỉ lưu user/assistant để gọn
  const compact = msgs.filter(m => m.role === "user" || m.role === "assistant");
  localStorage.setItem(LS_CHAT, JSON.stringify(compact));
};

// ====== Avatar AI: dùng ảnh trong public/image/ ======
const AI_AVATAR = "/image/ai.png"; // hãy đặt file vào public/image/ai.png

export default function FloatingChat() {
  const [open, setOpen] = useState(true);

  // Khôi phục lịch sử client
  const [msgs, setMsgs] = useState(() => {
    const restored = loadMsgs();
    return [{ role: "system", content: "Bạn là trợ lý bán hàng." }, ...restored];
  });

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [remember, setRemember] = useState(true); // Toggle "Nhớ tôi"

  // User avatar từ localStorage
  const [userObj, setUserObj] = useState(() => getCustomer());
  const [userAvatar, setUserAvatar] = useState(() => resolveAvatar(getCustomer()));
  const userInitial = (userObj?.name || "?").trim().charAt(0).toUpperCase();

  // Scroll
  const endRef = useRef(null);
  const scrollEnd = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  // Đồng bộ user info khi login/logout
  useEffect(() => {
    const sync = () => {
      const u = getCustomer();
      setUserObj(u);
      setUserAvatar(resolveAvatar(u));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("user:refresh", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("user:refresh", sync);
    };
  }, []);

  // ESC để đóng
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // typing indicator css
  useEffect(() => {
    if (document.getElementById("pulse-anim")) return;
    const s = document.createElement("style"); s.id = "pulse-anim";
    s.innerHTML = "@keyframes pulse{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}";
    document.head.appendChild(s);
  }, []);

  // Lưu lịch sử chat mỗi khi thay đổi (bỏ system)
  useEffect(() => { saveMsgs(msgs); }, [msgs]);

  // ====== styles ======
  const z = 10000;
  const btn = {
    position: "fixed", right: 20, bottom: 20, width: 56, height: 56,
    borderRadius: "50%", border: "3px solid #fff",
    background: "#0084ff", color: "#fff", fontWeight: 800, fontSize: 16,
    boxShadow: "0 10px 24px rgba(0,0,0,.2)", cursor: "pointer", zIndex: z,
    overflow: "hidden", padding: 0
  };
  const panel = {
    position: "fixed", right: 20, bottom: 84, width: 360,
    maxWidth: "calc(100vw - 24px)", maxHeight: "70vh",
    display: "flex", flexDirection: "column", background: "#fff",
    borderRadius: 16, overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,.22)", zIndex: z
  };
  const header = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc", fontWeight: 700
  };
  const rightCtl = { marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#64748b" };
  const avatar = { width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#e5f3ff", flex: "0 0 28px" };
  const body = { padding: 12, overflowY: "auto", flex: 1, background: "#fff" };
  const inputBar = { padding: 10, borderTop: "1px solid #e5e7eb", display: "flex", gap: 8, alignItems: "center", background: "#fff" };
  const iconBtn = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "8px 10px", cursor: "pointer" };
  const sendBtn = (dis) => ({ border: 0, borderRadius: 12, padding: "10px 14px", background: dis ? "#9ca3af" : "#0084ff", color: "#fff", fontWeight: 700, cursor: dis ? "not-allowed" : "pointer" });
  const row = (me) => ({ display: "flex", alignItems: "flex-end", gap: 8, justifyContent: me ? "flex-end" : "flex-start", marginBottom: 8 });
  const bubble = (me) => ({
    background: me ? "#0084ff" : "#f1f5f9", color: me ? "#fff" : "#0f172a",
    padding: "8px 12px", borderRadius: 18, maxWidth: "75%", lineHeight: 1.55,
    borderTopRightRadius: me ? 4 : 18, borderTopLeftRadius: me ? 18 : 4, whiteSpace: "pre-wrap"
  });
  const imgThumb = { width: 180, height: "auto", borderRadius: 10, display: "block" };

  // ====== render content: text + ảnh Markdown/link ảnh ======
  const renderContent = (text) => {
    const parts = [];
    const regex = /!\[[^\]]*\]\(([^)]+)\)|https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)/gi;
    let last = 0, m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(<span key={last}>{text.slice(last, m.index)}</span>);
      const url = m[1] || m[0];
      parts.push(
        <img
          key={m.index}
          src={url}
          alt=""
          style={{ ...imgThumb, marginTop: 6 }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      );
      last = regex.lastIndex;
    }
    if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
    return parts.length ? parts : text;
  };

  // ====== chọn & upload ảnh ======
  const pickImage = () => {
    const inputEl = document.createElement("input");
    inputEl.type = "file"; inputEl.accept = "image/*";
    inputEl.onchange = () => {
      const file = inputEl.files?.[0]; if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { file, previewUrl, uploadedUrl: null }]);
    };
    inputEl.click();
  };
  const uploadOne = async (item) => {
    const fd = new FormData(); fd.append("file", item.file);
    const r = await fetch(`${API}/chat/upload`, { method: "POST", body: fd });
    const j = await r.json(); return j?.url;
  };

  // ====== làm sạch chunk stream (nếu BE từng json_encode) ======
  const cleanChunk = (raw) => {
    try { const s = JSON.parse(raw); if (typeof s === "string") return s; } catch {}
    return String(raw).replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/\\n/g, "\n");
  };

  // ====== gửi tin ======
  const ask = async () => {
    if ((!input.trim() && pendingImages.length === 0) || streaming) return;

    // upload ảnh nếu có
    let uploaded = [];
    if (pendingImages.length) {
      uploaded = await Promise.all(
        pendingImages.map(async (it) => {
          try { const url = await uploadOne(it); return { ...it, uploadedUrl: url }; }
          catch { return it; }
        })
      );
    }

    // hiển thị cho user (text + markdown ảnh)
    const userShowParts = [];
    if (input.trim()) userShowParts.push(input.trim());
    if (uploaded.length) userShowParts.push(uploaded.map((u) => `![](${u.uploadedUrl || u.previewUrl})`).join("\n"));
    const userShowText = userShowParts.filter(Boolean).join("\n");

    const newMsgs = [...msgs, { role: "user", content: userShowText }, { role: "assistant", content: "" }];
    setMsgs(newMsgs);
    setInput(""); setPendingImages([]); setStreaming(true);

    // gửi lên API: contentParts để Vision đọc ảnh
    const contentParts = [];
    if (input.trim()) contentParts.push({ type: "text", text: input.trim() });
    for (const it of uploaded) if (it.uploadedUrl) contentParts.push({ type: "image_url", image_url: { url: it.uploadedUrl } });

    // bỏ system khi gửi (server sẽ tự thêm system + memory + catalog)
    const msgsForApi = [...msgs.filter((m) => m.role !== "system"), { role: "user", contentParts }];

    const visitorId = getVisitorId();
    const url = new URL(`${API}/chat/stream`);
    url.searchParams.set("messages", JSON.stringify(msgsForApi));
    url.searchParams.set("use_db", remember ? "1" : "0");
    url.searchParams.set("attach_images", remember ? "1" : "0"); // cho model “nhìn” ảnh sản phẩm từ DB
    url.searchParams.set("visitor_id", visitorId);

    const idx = newMsgs.length - 1;

    const ev = new EventSource(url.toString());
    ev.onmessage = (e) => {
      if (e.data === "[DONE]") { ev.close(); setStreaming(false); return; }
      const chunk = cleanChunk(e.data);
      setMsgs((prev) => {
        const clone = [...prev];
        clone[idx] = { role: "assistant", content: (clone[idx]?.content || "") + chunk };
        return clone;
      });
      scrollEnd();
    };
    ev.onerror = () => { ev.close(); setStreaming(false); };
  };

  // ====== xoá bộ nhớ cơ bản (client trigger) ======
  const clearMemory = async () => {
    try {
      const v = getVisitorId();
      await fetch(`${API}/chat/memory/preference`, { method: "DELETE", headers: { "X-Visitor": v } });
      alert("Đã yêu cầu xoá ghi nhớ cơ bản (preference).");
    } catch {
      alert("Không xoá được memory. Kiểm tra API.");
    }
  };

  return (
    <>
      {open && (
        <div style={panel}>
          <div style={header}>
            <div style={avatar}>
              <img src={AI_AVATAR} alt="AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            Trợ lý AI
            <div style={rightCtl}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Nhớ tôi
              </label>
              <button onClick={clearMemory} style={{ border: 0, background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                Xoá nhớ
              </button>
            </div>
          </div>

          <div style={body}>
            {msgs.filter((m) => m.role !== "system").map((m, i) => {
              const me = m.role === "user";
              return (
                <div key={i} style={row(me)}>
                  {!me && (
                    <div style={avatar}>
                      <img src={AI_AVATAR} alt="AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={bubble(me)}>{renderContent(m.content || "")}</div>
                  {me && (
                    <div style={avatar}>
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="Me"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontWeight: 800 }}>
                          {userInitial}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {streaming && (
              <div style={{ display: "flex", gap: 6, margin: "6px 0 2px 34px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1", animation: "pulse 1s infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1", animation: "pulse 1s .15s infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1", animation: "pulse 1s .3s infinite" }} />
              </div>
            )}

            {/* Preview ảnh chuẩn bị gửi */}
            {pendingImages.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0" }}>
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
              onKeyDown={(e) => (e.key === "Enter" ? ask() : null)}
              placeholder="Nhập tin nhắn..."
              style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 16, padding: "10px 12px", outline: "none" }}
            />
            <button onClick={ask} disabled={streaming} style={sendBtn(streaming)}>Gửi</button>
          </div>
        </div>
      )}

      {/* FAB: hiển thị ảnh AI khi đóng, dấu × khi đang mở */}
      <button onClick={() => setOpen((v) => !v)} style={btn} aria-label="Chat AI">
        {open ? "×" : (
          <img
            src={AI_AVATAR}
            alt="AI"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
          />
        )}
      </button>
    </>
  );
}
