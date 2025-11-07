import { useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: "system", content: "Bạn là trợ lý bán hàng tiếng Việt. Trả lời súc tích, dùng dữ liệu sản phẩm có trong hệ thống." }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef(null);

  const ask = async () => {
    if (!input.trim() || streaming) return;
    const newMsgs = [...msgs, { role: "user", content: input }];
    setMsgs(newMsgs);
    setInput("");
    setStreaming(true);

    const idx = newMsgs.length;
    setMsgs(prev => [...prev, { role: "assistant", content: "" }]);

    const url = new URL(`${API}/chat/stream`);
    url.searchParams.set("messages", JSON.stringify(newMsgs));
    url.searchParams.set("use_db", "1"); // BẬT đọc DB

    const ev = new EventSource(url.toString());
    ev.onmessage = (e) => {
      if (e.data === "[DONE]") { ev.close(); setStreaming(false); return; }
      setMsgs(prev => {
        const clone = [...prev];
        clone[idx] = { role: "assistant", content: (clone[idx]?.content || "") + e.data };
        return clone;
      });
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    ev.onerror = () => { ev.close(); setStreaming(false); };
  };

  return (
    <>
      {/* Nút bật/tắt chat */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg px-4 py-3 bg-indigo-600 text-white"
        aria-label="Chat AI"
      >
        {open ? "Đóng chat" : "Chat AI"}
      </button>

      {/* Hộp chat nổi */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] max-h-[70vh] bg-white border shadow-xl rounded-xl flex flex-col">
          <div className="px-4 py-3 border-b font-semibold">Trợ lý AI</div>

          <div className="p-3 overflow-y-auto flex-1">
            {msgs.filter(m => m.role !== "system").map((m, i) => (
              <div key={i} className={`mb-2 ${m.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block max-w-[85%] px-3 py-2 rounded-lg leading-relaxed
                                 ${m.role === "user" ? "bg-indigo-100" : "bg-gray-100"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Hỏi về sản phẩm..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" ? ask() : null}
            />
            <button
              onClick={ask}
              disabled={streaming}
              className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
