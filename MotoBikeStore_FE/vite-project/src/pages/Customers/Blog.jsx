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

  // format ngày nếu BE có published_at
  const fmtDate = (s) => {
    try { return new Date(s).toLocaleDateString("vi-VN"); } catch { return ""; }
  };

  return (
    <main className="bg-white">
      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
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
          <div className="mx-auto mt-6 h-[3px] w-24 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
        </div>

        {loading ? (
          // Skeletons
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="relative">
                  <div className="aspect-[16/9] w-full bg-slate-100 animate-pulse" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="h-4 w-4/5 bg-slate-100 animate-pulse rounded" />
                  <div className="h-4 w-full bg-slate-100 animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-slate-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid bài viết
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((p) => (
              <article
                key={p.id || p.slug}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-[2px]"
              >
                {/* Cover */}
                <div className="relative overflow-hidden">
                  {p.thumbnail_url ? (
                    <img
                      src={p.thumbnail_url}
                      alt="thumb"
                      className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-slate-100 to-slate-200" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {p.category?.name && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {p.category.name}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5">
                  <h2 className="text-[17px] font-semibold text-slate-900 line-clamp-2 leading-snug">
                    {p.title}
                  </h2>

                  {/* Meta */}
                  {(p.source || p.published_at) && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                      {p.source && (
                        <span className="inline-flex items-center gap-1">
                          <span className="i">📌</span>
                          <span className="font-medium text-slate-600">{p.source}</span>
                        </span>
                      )}
                      {p.source && p.published_at && <span>•</span>}
                      {p.published_at && <span>{fmtDate(p.published_at)}</span>}
                    </div>
                  )}

                  <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                    {p.excerpt}
                  </p>

                  <a
                    href={`/blog/${p.slug || p.id}`}
                    className="inline-flex items-center gap-1 mt-3 font-semibold text-indigo-600 group-hover:text-indigo-700"
                  >
                    Đọc tiếp
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
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
