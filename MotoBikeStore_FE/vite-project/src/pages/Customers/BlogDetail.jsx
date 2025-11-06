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
            <img
              src={post.thumbnail_url}
              alt="thumb"
              className="w-full max-h-[460px] object-cover rounded-t-2xl"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          {/* Content */}
          <article className="p-5 md:p-8">
            {/* Tinh chỉnh prose cho đẹp & dễ đọc */}
            <style>{`
              .prose :where(a):not(:where([class~="not-prose"] *)){
                color:#0ea5e9; text-decoration:none
              }
              .prose :where(a:hover):not(:where([class~="not-prose"] *)){
                text-decoration:underline
              }
              .prose :where(code):not(:where([class~="not-prose"] *)){
                background:#f8fafc;padding:.15rem .35rem;border-radius:.4rem;border:1px solid #e2e8f0
              }
              .prose :where(img):not(:where([class~="not-prose"] *)){
                border-radius:1rem;border:1px solid #e2e8f0
              }
              .prose :where(h2,h3){
                scroll-margin-top:80px
              }
            `}</style>

            <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7">
              <div
                dangerouslySetInnerHTML={{
                  __html: post.content || post.excerpt || "",
                }}
              />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
