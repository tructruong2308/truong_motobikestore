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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-7 w-48 rounded-lg bg-slate-200 animate-pulse mb-4" />
        <div className="h-9 w-3/4 rounded-lg bg-slate-200 animate-pulse mb-6" />
        <div className="h-64 w-full rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-slate-600">
        Không tìm thấy bài viết
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-slate-800">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-slate-500">
        <Link to="/" className="hover:text-slate-700 transition">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-slate-700 transition">Tin tức</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 line-clamp-1">{post.title}</span>
      </nav>

      {/* Card bài viết */}
      <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full max-h-[440px] object-cover"
          />
        )}

        <div className="px-5 md:px-8 py-6">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Meta */}
          {(post.source || post.author || post.published_at) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {post.source && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">
                  Nguồn: {post.source}
                </span>
              )}
              {post.author && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">
                  Tác giả: {post.author}
                </span>
              )}
              {post.published_at && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">
                  {new Date(post.published_at).toLocaleString("vi-VN")}
                </span>
              )}
            </div>
          )}

          {/* Nội dung */}
          <div className="mt-6 prose prose-slate max-w-none prose-img:rounded-xl prose-a:text-indigo-600 hover:prose-a:underline">
            <div
              dangerouslySetInnerHTML={{
                __html: post.content || post.excerpt || "",
              }}
            />
          </div>

          {/* Footer nhỏ */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <Link
              to="/blog"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-[.99] transition"
            >
              ← Quay lại tin tức
            </Link>
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
              <span>Chia sẻ:</span>
              <a
                className="rounded-lg px-3 py-1.5 border border-slate-200 hover:bg-slate-100"
                target="_blank"
                rel="noreferrer"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              >
                Facebook
              </a>
              <a
                className="rounded-lg px-3 py-1.5 border border-slate-200 hover:bg-slate-100"
                target="_blank"
                rel="noreferrer"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
              >
                Twitter/X
              </a>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
