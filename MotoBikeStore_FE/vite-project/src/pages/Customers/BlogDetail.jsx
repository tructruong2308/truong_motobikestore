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
    return (
      <main className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="h-8 w-60 bg-slate-100 rounded mb-6 animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-2xl mb-6 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );

  if (!post)
    return (
      <main className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-slate-700">
          Không tìm thấy bài viết
        </div>
      </main>
    );

  return (
    <main className="bg-white">
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 md:mb-8 text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-700 transition">Trang chủ</Link>
          <span className="text-slate-400">›</span>
          <Link to="/blog" className="hover:text-slate-700 transition">Tin tức</Link>
          <span className="text-slate-400">›</span>
          <span className="text-slate-700 line-clamp-1">{post.title}</span>
        </nav>

        {/* Title + Meta (nằm trong vùng đọc hẹp) */}
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-[2.15rem] font-extrabold tracking-tight text-slate-900">
            {post.title}
          </h1>
          <p className="mt-3 text-slate-600 text-[15px]">
            {post.source && <>Nguồn: <b className="text-slate-800">{post.source}</b></>}
            {post.author && <> • Tác giả: <b className="text-slate-800">{post.author}</b></>}
            {post.published_at && <> • {new Date(post.published_at).toLocaleString("vi-VN")}</>}
          </p>
        </div>

        {/* Cover (full width trong container, bo góc) */}
        {post.thumbnail_url && (
          <div className="mx-auto max-w-4xl mt-6">
            <img
              src={post.thumbnail_url}
              alt="thumb"
              className="w-full max-h-[520px] object-cover rounded-2xl border border-slate-200"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}

        {/* Content – vùng đọc hẹp, chữ lớn, line-height cao */}
        <article className="mx-auto max-w-3xl mt-8 md:mt-10">
          {/* Fine-tune prose */}
          <style>{`
            .reading :where(p){
              margin: 0 0 1.05em 0;
              text-align: justify;
            }
            .reading :where(h2){ margin-top:2.2em;margin-bottom:.9em }
            .reading :where(h3){ margin-top:1.8em;margin-bottom:.7em }
            .reading :where(img){ border-radius:1rem;border:1px solid #e2e8f0; margin:1rem auto }
            .reading :where(blockquote){
              border-left:4px solid #e2e8f0; padding:.2rem 1rem; color:#475569; background:#f8fafc; border-radius:.5rem
            }
            .reading :where(code){
              background:#f8fafc; border:1px solid #e2e8f0; padding:.15rem .35rem; border-radius:.4rem
            }
            .reading :where(ul){ list-style:disc; padding-left:1.2rem }
            .reading :where(ol){ list-style:decimal; padding-left:1.2rem }
            @media (min-width: 768px){
              .reading{ font-size:17px; line-height:1.85 }
            }
          `}</style>

          <div
            className="reading text-slate-800 leading-[1.75] text-[16px]"
            dangerouslySetInnerHTML={{
              __html: post.content || post.excerpt || "",
            }}
          />
        </article>
      </section>
    </main>
  );
}
