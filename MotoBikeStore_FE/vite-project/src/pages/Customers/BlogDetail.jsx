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
        <div className="max-w-5xl mx-auto px-4 py-12">
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
        <div className="max-w-5xl mx-auto px-4 py-12 text-slate-700">
          Không tìm thấy bài viết
        </div>
      </main>
    );

  return (
    <main className="bg-white">
      <section className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm mb-5 text-slate-500">
          <Link to="/" className="hover:text-slate-700">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link to="/blog" className="hover:text-slate-700">Tin tức</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{post.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          {post.title}
        </h1>
        <p className="text-slate-500 text-sm mb-5">
          {post.source ? `Nguồn: ${post.source}` : ""}{" "}
          {post.author ? `• Tác giả: ${post.author}` : ""}{" "}
          {post.published_at
            ? `• ${new Date(post.published_at).toLocaleString("vi-VN")}`
            : ""}
        </p>

        {/* Cover */}
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt="thumb"
            className="w-full max-h-[440px] object-cover rounded-2xl border border-slate-200 mb-6"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}

        {/* Content */}
        <article className="prose max-w-none prose-slate">
          {/* prose override to luôn nền trắng */}
          <style>{`
            .prose :where(code):not(:where([class~="not-prose"] *)){
              background:#f8fafc;padding:.15rem .35rem;border-radius:.35rem
            }
          `}</style>
          <div
            dangerouslySetInnerHTML={{
              __html: post.content || post.excerpt || "",
            }}
          />
        </article>
      </section>
    </main>
  );
}
