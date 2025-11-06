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
    return <div className="max-w-5xl mx-auto px-4 py-10 text-slate-600">Đang tải…</div>;
  if (!post)
    return <div className="max-w-5xl mx-auto px-4 py-10 text-slate-600">Không tìm thấy bài viết</div>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-slate-800">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-slate-500">
        <Link to="/" className="hover:text-slate-700">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-slate-700">Tin tức</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {post.source && <>Nguồn: {post.source} • </>}
          {post.author && <>Tác giả: {post.author} • </>}
          {post.published_at &&
            new Date(post.published_at).toLocaleString("vi-VN")}
        </p>
      </header>

      {post.thumbnail_url && (
        <img
          src={post.thumbnail_url}
          alt="thumb"
          className="w-full max-h-[460px] object-cover rounded-2xl border border-slate-200 shadow-sm mb-6"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}

      {/* Nội dung */}
      <article className="prose max-w-none prose-slate">
        {/* Nếu backend đã render HTML, giữ nguyên: */}
        {post.content ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p>{post.excerpt}</p>
        )}
      </article>

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="/blog"
          className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-slate-700 hover:bg-slate-50"
        >
          ← Quay lại danh sách
        </a>
        <a
          href="#top"
          className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-slate-700 hover:bg-slate-50"
        >
          Lên đầu trang ↑
        </a>
      </div>
    </main>
  );
}
