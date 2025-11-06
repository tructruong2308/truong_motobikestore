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

  return (
    <main className="bg-gradient-to-b from-white to-slate-50/70">
      <section className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 pb-12 md:pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 md:mb-8 text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-700 transition">Trang chủ</Link>
          <span className="text-slate-400">›</span>
          <Link to="/blog" className="hover:text-slate-700 transition">Tin tức</Link>
          <span className="text-slate-400">›</span>
          <span className="text-slate-700 line-clamp-1">{post.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
            {post.title}
          </span>
        </h1>

        {/* Meta */}
        <p className="mt-3 md:mt-4 text-slate-600 text-[13.5px] md:text-[15px]">
          {post.source && <span className="mr-2">Nguồn: <b className="text-slate-800">{post.source}</b></span>}
          {post.author && <span className="mx-2">• Tác giả: <b className="text-slate-800">{post.author}</b></span>}
          {post.published_at && (
            <span className="mx-2">
              • {new Date(post.published_at).toLocaleString("vi-VN")}
            </span>
          )}
        </p>

        {/* Article card */}
        <div className="mt-6 md:mt-8 rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(2,6,23,.06)] overflow-hidden">
          {/* Cover */}
          {post.thumbnail_url && (
            <img
              src={post.thumbnail_url}
              alt="thumb"
              className="w-full max-h-[460px] object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          {/* Content */}
          <article className="p-5 md:p-8">
            {/* ==== TINH CSS – giữ nguyên JSX ==== */}
            <style>{`
              /* Cột đọc tối ưu và type scale mềm */
              .reading{
                max-width: 62ch;                  
                margin-inline: auto;
                color:#1f2937;                     
                font-size: clamp(1rem, .96rem + .28vw, 1.08rem);
                line-height: 1.85;
                letter-spacing: .003em;
                word-spacing: .02em;
                font-feature-settings: "kern","liga";
                text-rendering: optimizeLegibility;
              }
              /* Đoạn văn: bỏ justify để tránh rãnh trắng, tăng nhịp đoạn */
              .reading p{
                margin: 0 0 1.25em 0;
                overflow-wrap:anywhere;
                text-align: left;                  
                hyphens: manual;
              }
              /* Drop-cap nhẹ */
              .reading p:first-of-type::first-letter{
                float:left;
                font-size: 2.6em;
                line-height:.9;
                padding:.08em .16em 0 0;
                font-weight:800;
                color:#111827;
              }
              /* Heading */
              .reading h2{
                font-size: clamp(1.25rem, 1.08rem + .7vw, 1.6rem);
                font-weight: 800;
                line-height:1.3;
                margin: 2.1em 0 .9em 0;
                color:#0f172a;
                text-wrap: balance;
              }
              .reading h3{
                font-size: clamp(1.12rem, 1.02rem + .5vw, 1.35rem);
                font-weight: 800;
                line-height:1.35;
                margin: 1.6em 0 .7em 0;
                color:#0f172a;
              }
              /* Ảnh trong nội dung: không méo, chiều cao hợp lý */
              .reading img{
                display:block;
                width:100%;
                height:auto;
                max-height: 360px;
                object-fit: cover;
                object-position: center;
                margin: 1.05rem 0;
                border-radius: 14px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 10px 26px rgba(15,23,42,.08);
              }
              @media (max-width: 768px){
                .reading{ max-width: 58ch; font-size: 1rem; line-height: 1.82; }
                .reading img{ max-height: 260px; }
              }
              .reading figure{ margin:1.05rem 0 }
              .reading figcaption{
                font-size:.86rem; color:#64748b; text-align:center; margin-top:.45rem
              }
              /* List / Blockquote / Table / Code */
              .reading ul, .reading ol{ padding-left:1.1rem; margin:.4rem 0 1rem 0 }
              .reading li{ margin:.22rem 0 }
              .reading blockquote{
                margin:1.2rem 0; padding:.75rem 1rem;
                border-left:4px solid #e5e7eb; background:#f8fafc;
                color:#475569; border-radius:.6rem;
              }
              .reading table{ width:100%; border-collapse:collapse; font-size:.96em; margin:1rem 0 }
              .reading th, .reading td{ border:1px solid #e5e7eb; padding:.6rem .7rem; text-align:left }
              .reading code{
                background:#f8fafc; border:1px solid #e5e7eb;
                padding:.18rem .38rem; border-radius:.38rem; font-size:.92em;
              }
              .reading a{ color:#0ea5e9; text-decoration:none }
              .reading a:hover{ text-decoration:underline }
              .reading *{ max-width:100% }
            `}</style>

            <div
              className="reading"
              dangerouslySetInnerHTML={{
                __html: post.content || post.excerpt || "",
              }}
            />
          </article>
        </div>
      </section>
    </main>
  );
}
