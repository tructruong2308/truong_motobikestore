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

  if (loading)
    return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-100">Đang tải…</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-6">Tin tức / Blog</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article
            key={p.id || p.slug}
            className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden"
          >
            {p.thumbnail_url && (
              <img src={p.thumbnail_url} alt="thumb" className="w-full h-40 object-cover" />
            )}
            <div className="p-5">
              <h2 className="text-lg font-semibold mb-2">{p.title}</h2>
              <p className="text-sm text-slate-300 line-clamp-3">{p.excerpt}</p>
              <a
                href={`/blog/${p.slug || p.id}`}
                className="inline-block mt-3 text-emerald-400 hover:text-emerald-300"
              >
                Đọc tiếp →
              </a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
