import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/posts?per_page=20`);
        const j = await r.json();
        setPosts(j?.data || j || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tin tức / Blog</h1>
            <p className="text-slate-500">Cập nhật thông tin mới nhất từ MotoBikeStore</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
            Đang tải…
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="h-40 w-full bg-slate-200 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-800">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tin tức / Blog</h1>
          <p className="text-slate-500">Câu chuyện, hướng dẫn và cập nhật sản phẩm.</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
          {posts.length} bài viết
        </span>
      </div>

      {/* Empty state */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <img
            alt=""
            src="https://cdn-icons-png.flaticon.com/512/5043/5043015.png"
            className="w-16 h-16 mx-auto mb-4 opacity-80"
          />
          <p className="text-slate-600">Hiện chưa có bài viết nào.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article
              key={p.id || p.slug}
              className="group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {p.thumbnail_url && (
                <a href={`/blog/${p.slug || p.id}`} className="block">
                  <img
                    src={p.thumbnail_url}
                    alt={p.title}
                    className="w-full h-40 object-cover group-hover:scale-[1.01] transition"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </a>
              )}

              <div className="p-5">
                <a href={`/blog/${p.slug || p.id}`} className="block">
                  <h2 className="text-lg font-bold leading-snug text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition">
                    {p.title}
                  </h2>
                </a>

                {(p.author || p.published_at) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {p.author && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                        {p.author}
                      </span>
                    )}
                    {p.published_at && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                        {new Date(p.published_at).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-3 text-sm text-slate-600 line-clamp-3">
                  {p.excerpt || ""}
                </p>

                <a
                  href={`/blog/${p.slug || p.id}`}
                  className="mt-4 inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  Đọc tiếp →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
