import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/posts/${slug}`);
        if (!r.ok) throw new Error("not found");
        const j = await r.json().catch(() => ({}));
        setPost(j);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // --- ❶ Chuẩn hoá nội dung: tự bọc <p> nếu không có markup ---
  const normalizeHtml = (raw) => {
    const html = (raw || "").trim();
    if (!html) return "";
    // Nếu đã có p/br/heading/list/table/img... coi như đã là HTML
    if (/<(p|br|h[1-6]|ul|ol|table|img|figure)\b/i.test(html)) return html;

    // Có xuống dòng: tách theo block trống
    if (/\n/.test(html)) {
      const blocks = html
        .replace(/\r/g, "")
        .split(/\n{2,}/)             // 1 block = 1–n dòng, cách nhau ≥1 dòng trống
        .map(s => s.trim())
        .filter(Boolean);
      return blocks.map(b => `<p>${b.replace(/\n+/g, " ")}</p>`).join("");
    }

    // Không có xuống dòng → tách theo câu, gom 2–3 câu/đoạn
    const sentences = html.split(/(?<=[\.!?…])\s+(?=[A-ZÀ-Ỹ“0-9])/u);
    const paras = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paras.push(`<p>${sentences.slice(i, i + 3).join(" ")}</p>`);
    }
    return paras.join("");
  };

  if (loading)
    return (
      <main className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="h-8 w-60 bg-slate-100 rounded mb-6 animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-2xl mb-6 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );

  if (!post)
    return (
      <main className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-slate-700">
          Không tìm thấy bài viết
        </div>
      </main>
    );

  const contentHTML = normalizeHtml(post.content || post.excerpt || "");

  return (
    <main className="bg-gradient-to-b from-white to-slate-50/60">
      <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 md:mb-8 text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-700 transition">Trang chủ</Link>
          <span className="text-slate-400">›</span>
          <Link to="/blog" className="hover:text-slate-700 transition">Tin tức</Link>
          <span className="text-slate-400">›</span>
          <span className="text-slate-700 line-clamp-1">{post.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
            {post.title}
          </span>
        </h1>

        {/* Meta */}
        <p className="mt-3 md:mt-4 text-slate-600 text-sm md:text-[15px]">
          {post.source && <span className="mr-2">Nguồn: <b className="text-slate-800">{post.source}</b></span>}
          {post.author && <span className="mx-2">• Tác giả: <b className="text-slate-800">{post.author}</b></span>}
          {post.published_at && (
            <span className="mx-2">• {new Date(post.published_at).toLocaleString("vi-VN")}</span>
          )}
        </p>

        {/* Article */}
        <div className="mt-6 md:mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {post.thumbnail_url && (
            <figure className="rounded-t-2xl overflow-hidden">
              <img
                src={post.thumbnail_url}
                alt="thumb"
                className="w-full max-h-[460px] object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </figure>
          )}

          <article className="p-5 md:p-8">
            {/* ❷ Typography nâng cấp: chiều rộng 74ch, căn đều, khoảng cách đoạn, drop-cap nhẹ */}
            <style>{`
              .news-body{
                color:#0f172a;
                font-size:17.5px;
                line-height:1.85;
                letter-spacing:.1px;
                text-align:justify;
                max-width:74ch;           /* độ rộng dòng lý tưởng */
                margin:0 auto;            /* căn giữa cột chữ */
                word-wrap:break-word;
                text-rendering:optimizeLegibility;
              }
              .news-body p{ margin: 0 0 1.05em; }
              .news-body p + p{ text-indent: 1.25em; }  /* thụt đầu dòng đoạn sau */
              .news-body h2,.news-body h3{
                font-weight:800; color:#0f172a; line-height:1.35;
                margin:1.6em 0 .6em;
                text-indent:0;
              }
              .news-body h2{ font-size:1.35em; }
              .news-body h3{ font-size:1.2em; }
              .news-body strong{ font-weight:800; color:#0f172a; }
              .news-body a{ color:#0ea5e9; text-decoration:none }
              .news-body a:hover{ text-decoration:underline }
              .news-body ul,.news-body ol{ padding-left:1.25em; margin:.8em 0 1.1em; }
              .news-body li{ margin:.35em 0; }
              .news-body blockquote{
                margin:1.2em 0; padding:.9em 1.1em; background:#f8fafc;
                border-left:4px solid #94a3b8; border-radius:.5rem; color:#334155;
              }
              .news-body img{
                max-width:100%; border-radius:1rem; border:1px solid #e2e8f0;
                display:block; margin:1.1em auto;
              }
              .news-body table{
                width:100%; border-collapse:separate; border-spacing:0;
                margin:1.1em 0; font-size:.98em;
              }
              .news-body th,.news-body td{ padding:.7em .8em; border:1px solid #e2e8f0; }
              .news-body th{ background:#f8fafc; font-weight:700; }
              .news-body p:first-of-type::first-letter{
                float:left; font-size:2.6em; line-height:1; padding:.05em .12em 0 .02em;
                font-weight:800; color:#0f172a;
              }
            `}</style>

            <div
              className="news-body"
              dangerouslySetInnerHTML={{ __html: contentHTML }}
            />
          </article>
        </div>
      </section>
    </main>
  );
}
