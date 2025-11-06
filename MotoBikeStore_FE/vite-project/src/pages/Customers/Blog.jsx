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
          /* Skeletons */
          <div className="grid md:grid-cols-3 gap-x-6 gap-y-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl ring-1 ring-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="aspect-[16/9] w-full bg-slate-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-4/5 bg-slate-100 animate-pulse rounded" />
                  <div className="h-4 w-full bg-slate-100 animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-slate-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid bài viết */
          <div className="grid md:grid-cols-3 gap-x-6 gap-y-10">
            {posts.map((p) => (
              <article
                key={p.id || p.slug}
                className="group h-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg hover:ring-slate-300"
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
                  {/* nhãn category nếu có */}
                  {p.category?.name && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {p.category.name}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex h-full flex-col p-5">
                  <h2 className="text-[17px] font-semibold text-slate-900 leading-snug line-clamp-2">
                    {p.title}
                  </h2>

                  {/* Meta line để tách – giúp card thoáng và dễ phân biệt */}
                  {(p.source || p.published_at) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      {p.source && (
                        <span className="inline-flex items-center gap-1">
                          <span>📌</span>
                          <span className="font-medium text-slate-600">
                            {p.source}
                          </span>
                        </span>
                      )}
                      {p.source && p.published_at && <span className="text-slate-300">•</span>}
                      {p.published_at && <span>{fmtDate(p.published_at)}</span>}
                    </div>
                  )}

                  <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">
                    {p.excerpt}
                  </p>

                  {/* Spacer để nút luôn ở đáy – card đều nhau, không dính */}
                  <div className="mt-auto" />

                  <a
                    href={`/blog/${p.slug || p.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 mt-4"
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
