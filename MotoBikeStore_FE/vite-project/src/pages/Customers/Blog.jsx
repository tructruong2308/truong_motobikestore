import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/posts?per_page=20`);
        const j = await r.json().catch(() => ({}));
        setPosts(j?.data || j || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-800">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Tin tức / Blog
        </h1>
        <p className="mt-2 text-slate-600">Cập nhật thông tin mới nhất từ MotoBikeStore.</p>
      </header>

      {/* skeleton */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="h-40 bg-slate-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-100 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <section className="grid md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article
              key={p.id || p.slug}
              className="group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {p.thumbnail_url && (
                <a href={`/blog/${p.slug || p.id}`} className="block">
                  <img
                    src={p.thumbnail_url}
                    alt="thumb"
                    className="w-full h-44 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </a>
              )}
              <div className="p-5">
                <a
                  href={`/blog/${p.slug || p.id}`}
                  className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 line-clamp-2"
                >
                  {p.title}
                </a>

                {p.published_at && (
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(p.published_at).toLocaleDateString("vi-VN")}
                  </div>
                )}

                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{p.excerpt}</p>

                <a
                  href={`/blog/${p.slug || p.id}`}
                  className="inline-flex items-center gap-1 mt-3 text-emerald-600 font-medium"
                >
                  Đọc tiếp <span aria-hidden>→</span>
                </a>
              </div>
            </article>
          ))}

          {!posts.length && (
            <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              Hiện chưa có bài viết.
            </div>
          )}
        </section>
      )}
    </main>
  );
}
