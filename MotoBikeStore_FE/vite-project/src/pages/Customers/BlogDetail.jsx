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

  if (loading)
    return <div className="max-w-5xl mx-auto px-4 py-12 text-slate-700">Đang tải…</div>;
  if (!post)
    return <div className="max-w-5xl mx-auto px-4 py-12 text-slate-700">Không tìm thấy bài viết</div>;

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="max-w-5xl mx-auto px-4 py-12">
        {/* breadcrumb */}
        <nav className="text-sm mb-6 text-slate-500">
          <Link to="/" className="hover:text-slate-700">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link to="/blog" className="hover:text-slate-700">Tin tức</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{post.title}</span>
        </nav>

        {/* title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">{post.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {post.source ? `Nguồn: ${post.source}` : ""}{" "}
          {post.author ? `• Tác giả: ${post.author}` : ""}{" "}
          {post.published_at ? `• ${new Date(post.published_at).toLocaleString("vi-VN")}` : ""}
        </p>

        {/* cover */}
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt="thumb"
            className="w-full max-h-[440px] object-cover rounded-2xl border border-slate-200 shadow-sm mt-6"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}

        {/* content */}
        <article className="prose max-w-none mt-8 prose-headings:scroll-mt-24 prose-img:rounded-xl prose-img:border prose-img:border-slate-200">
          {/* BE trả HTML -> render an toàn theo yêu cầu */}
          <div dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }} />
        </article>
      </section>
    </main>
  );
}
