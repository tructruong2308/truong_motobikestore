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
    <main className="bg-white">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600">
            📰 Tin tức / Blog
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
            Bài viết mới
          </h1>
          <p className="mt-2 text-slate-600">
            Cập nhật xu hướng xe máy, kinh nghiệm vận hành, bảo dưỡng và ưu đãi.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((p) => (
              <article
                key={p.id || p.slug}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {p.thumbnail_url && (
                  <img
                    src={p.thumbnail_url}
                    alt="thumb"
                    className="w-full h-44 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-900 line-clamp-2">
                    {p.title}
                  </h2>
                  <p className="text-sm text-slate-600 line-clamp-3 mt-2">
                    {p.excerpt}
                  </p>
                  <a
                    href={`/blog/${p.slug || p.id}`}
                    className="inline-block mt-3 text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Đọc tiếp →
                  </a>
                </div>
              </article>
            ))}
            {!posts.length && (
              <div className="col-span-full text-center text-slate-500">
                Chưa có bài viết.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
