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
    <main className="bg-gradient-to-b from-white to-slate-50/60">
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 md:mb-8 text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-700 transition">Trang chủ</Link>
          <span className="text-slate-400">›</span>
          <Link to="/blog" className="hover:text-slate-700 transition">Tin tức</Link>
          <span className="text-slate-400">›</span>
          <span className="text-slate-700 line-clamp-1">{post.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
            {post.title}
          </span>
        </h1>

        {/* Meta */}
        <p className="mt-3 md:mt-4 text-slate-600 text-sm md:text-[15px]">
          {post.source && <span className="mr-2">Nguồn: <b className="text-slate-800">{post.source}</b></span>}
          {post.author && <span className="mx-2">• Tác giả: <b className="text-slate-800">{post.author}</b></span>}
          {post.published_at && (
            <span className="mx-2">
              • {new Date(post.published_at).toLocaleString("vi-VN")}
            </span>
          )}
        </p>

        {/* Card */}
        <div className="mt-6 md:mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Cover */}
          {post.thumbnail_url && (
            <img
              src={post.thumbnail_url}
              alt="thumb"
              className="w-full max-h-[460px] object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          {/* Content */}
          <article className="p-5 md:p-8">
            {/* Typography tuning – giống báo/đọc dài, dễ nhìn */}
            <style>{`
              .reading { 
                max-width: 68ch;               /* chiều rộng dòng ~70 ký tự */
                margin-inline: auto;
                color: #0f172a;
                letter-spacing: .1px;
              }
              @media (min-width: 768px){
                .reading{ font-size: 18px; line-height: 1.9; }
              }
              @media (max-width: 767.9px){
                .reading{ font-size: 16px; line-height: 1.8; }
              }
              .reading p{
                margin: 0 0 1.1em 0;
                text-align: justify;          /* canh đều giống ảnh bạn gửi */
                text-justify: inter-word;
                hyphens: auto;
              }
              .reading h2{
                font-size: 1.45em;
                font-weight: 800;
                color: #0f172a;
                margin: 2.2em 0 .9em 0;
                line-height: 1.3;
                text-wrap: balance;
              }
              .reading h3{
                font-size: 1.25em;
                font-weight: 800;
                margin: 1.8em 0 .7em 0;
                line-height: 1.35;
              }
              .reading img{
                display:block;
                max-width:100%;
                height:auto;
                margin: 1rem auto;
                border-radius: 14px;
                border: 1px solid #e2e8f0;
              }
              .reading figure{ margin: 1rem 0; }
              .reading figcaption{
                font-size: .85rem; color:#64748b; text-align:center; margin-top:.35rem;
              }
              .reading ul, .reading ol{ padding-left: 1.2rem; margin: .75rem 0 1rem 0; }
              .reading li{ margin: .25rem 0; }
              .reading blockquote{
                margin: 1.25rem 0; padding: .5rem 1rem;
                border-left: 4px solid #e2e8f0; background:#f8fafc; color:#475569; border-radius:.5rem;
              }
              .reading code{
                background:#f8fafc; border:1px solid #e2e8f0; padding:.15rem .35rem; border-radius:.35rem;
                font-size: .92em;
              }
              .reading hr{ border:none; border-top:1px solid #e2e8f0; margin:2rem 0; }
              .reading table{
                width:100%; border-collapse:collapse; font-size:.95em; margin:1rem 0;
              }
              .reading th, .reading td{
                border:1px solid #e2e8f0; padding:.6rem .7rem; text-align:left;
              }
              .reading a{ color:#0ea5e9; text-decoration:none }
              .reading a:hover{ text-decoration:underline }
            `}</style>

            {/* Nội dung (giữ nguyên cơ chế render) */}
            <div
              className="reading"
              dangerouslySetInnerHTML={{
                __html: post.content || post.excerpt || "",
              }}
            />
          </article>
        </div>
      </section>
    </main>
  );
}
