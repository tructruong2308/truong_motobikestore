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
            <span className="mx-2">
              • {new Date(post.published_at).toLocaleString("vi-VN")}
            </span>
          )}
        </p>

        {/* Article card */}
        <div className="mt-6 md:mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Cover */}
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

          {/* Content */}
          <article className="p-5 md:p-8">
            {/* TYPOGRAPHY UPGRADE */}
            <style>{`
              /* Vùng bài viết */
              .news-body{
                color:#0f172a;
                font-size:17.5px;                /* cỡ chữ đọc báo */
                line-height:1.85;                 /* giãn dòng thoáng */
                letter-spacing:.1px;
                text-align:justify;               /* căn đều hai bên */
                -webkit-hyphens:auto; hyphens:auto;
              }
              .news-body p{ margin: 0 0 1.05em; }
              .news-body p + p{ text-indent: 1.25em; } /* thụt đầu dòng các đoạn sau */
              .news-body h2, .news-body h3{
                font-weight:800; color:#0f172a; line-height:1.35;
                margin:1.6em 0 .6em;
              }
              .news-body h2{ font-size:1.35em; }
              .news-body h3{ font-size:1.2em; }
              .news-body strong{ font-weight:800; color:#0f172a; }
              .news-body a{ color:#0ea5e9; text-decoration:none }
              .news-body a:hover{ text-decoration:underline }
              .news-body ul, .news-body ol{ padding-left:1.25em; margin: .8em 0 1.1em; }
              .news-body li{ margin:.35em 0; }
              .news-body blockquote{
                margin:1.2em 0; padding: .9em 1.1em; background:#f8fafc;
                border-left:4px solid #94a3b8; border-radius:.5rem; color:#334155;
              }
              .news-body img{
                max-width:100%; border-radius:1rem; border:1px solid #e2e8f0;
                display:block; margin:1.1em auto;
              }
              .news-body figure{ margin:1.2em 0; }
              .news-body figcaption{
                text-align:center; font-size:.9rem; color:#64748b; margin-top:.4rem;
              }
              /* Bảng */
              .news-body table{
                width:100%; border-collapse:separate; border-spacing:0;
                margin:1.1em 0; font-size:.98em;
              }
              .news-body th, .news-body td{
                padding:.7em .8em; border:1px solid #e2e8f0;
              }
              .news-body th{ background:#f8fafc; font-weight:700; }
            `}</style>

            <div
              className="news-body"
              // BE có thể trả content là HTML; fallback sang excerpt
              dangerouslySetInnerHTML={{ __html: post.content || post.excerpt || "" }}
            />
          </article>
        </div>
      </section>
    </main>
  );
}
