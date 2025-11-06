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
        const j = await r.json();
        setPost(j);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <div className="max-w-5xl mx-auto py-10">Đang tải…</div>;
  if (!post) return <div className="max-w-5xl mx-auto py-10">Không tìm thấy bài viết</div>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-slate-100">
      <nav className="text-sm mb-6 text-slate-400">
        <Link to="/" className="hover:text-slate-200">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-slate-200">Tin tức</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-300">{post.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-slate-400 text-sm mb-4">
        {post.source ? `Nguồn: ${post.source}` : ""}{" "}
        {post.author ? `• Tác giả: ${post.author}` : ""}{" "}
        {post.published_at ? `• ${new Date(post.published_at).toLocaleString("vi-VN")}` : ""}
      </p>

      {post.thumbnail_url && (
        <img
          src={post.thumbnail_url}
          alt="thumb"
          className="w-full max-h-[420px] object-cover rounded-2xl border border-slate-700 mb-6"
        />
      )}

      <article className="prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }} />
      </article>
    </main>
  );
}
