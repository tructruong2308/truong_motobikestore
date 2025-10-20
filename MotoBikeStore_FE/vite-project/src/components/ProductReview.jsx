// src/pages/Customers/ProductReview.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

/* ========= Helpers cục bộ ========= */
function getCustomer() {
  try {
    return JSON.parse(localStorage.getItem("customer_user") || "null");
  } catch {
    return null;
  }
}
function getCustomerToken() {
  return localStorage.getItem("customer_token") || "";
}

/* ========= Wrapper fetch có kèm token ========= */
async function req(
  path,
  { method = "GET", json, formData, headers = {} } = {}
) {
  const token = getCustomerToken();
  const h = { Accept: "application/json", ...headers };
  const init = { method, headers: h };

  if (json) {
    h["Content-Type"] = "application/json";
    init.body = JSON.stringify(json);
  }
  if (formData) {
    init.body = formData; // để browser tự set boundary
  }
  if (token) h.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, init);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default function ProductReview() {
  const { id: productId } = useParams();

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [message, setMessage] = useState("");

  // lấy info khách từ localStorage
  useEffect(() => {
    const u = getCustomer();
    if (u) setUser(u);
  }, []);

  // tải danh sách review
  const fetchReviews = async () => {
    try {
      const { ok, data } = await req(`/products/${productId}/reviews`);
      if (ok) setReviews(data.reviews || data.data || []);
    } finally {
      setLoading(false);
    }
  };

  // kiểm tra quyền review
  const checkReviewPermission = async () => {
    if (!getCustomerToken()) {
      setCanReview(false);
      setMessage("Vui lòng đăng nhập để đánh giá.");
      return;
    }
    const { data } = await req(`/products/${productId}/reviews/can`);
    const allowed = Boolean(data?.can ?? data?.allowed);
    setCanReview(allowed);
    setMessage(
      allowed ? "" : "Bạn chỉ có thể đánh giá khi đã mua và đơn đã hoàn tất."
    );

    const u = getCustomer();
    if (u)
      setHasReviewed((reviews || []).some((r) => String(r.user_id) === String(u.id)));
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  useEffect(() => {
    checkReviewPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, reviews]);

  // chọn/xoá ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) return alert("Tối đa 5 ảnh.");
    setImages((prev) => [...prev, ...files]);
  };
  const handleRemoveImage = (i) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  // gửi review
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!getCustomerToken()) return alert("Vui lòng đăng nhập.");
    if (!canReview) return alert("Bạn chưa đủ điều kiện đánh giá.");
    if (rating === 0) return alert("Vui lòng chọn số sao.");

    // 1) gửi review
    const r = await req(`/products/${productId}/reviews`, {
      method: "POST",
      json: { rating, comment },
    });
    if (!r.ok) return alert(r.data?.message || `Không thể gửi: HTTP ${r.status}`);

    const reviewId = r.data?.review?.id || r.data?.data?.id;

    // 2) upload ảnh
    if (reviewId && images.length > 0) {
      const fd = new FormData();
      images.forEach((img) => fd.append("images[]", img));
      await req(`/reviews/${reviewId}/images`, { method: "POST", formData: fd });
    }

    alert("🎉 Cảm ơn bạn đã đánh giá!");
    setRating(0);
    setHover(0);
    setComment("");
    setImages([]);
    fetchReviews();
    checkReviewPermission();
  };

  /* ===================== CSS (Shopee-like) ===================== */
const css = `
.rv-wrap{margin-top:14px}
.rv-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.rv-title{font-weight:800;font-size:16px}
.rv-badge{padding:1px 8px;border-radius:999px;font-size:11px;border:1px solid #e2e8f0;color:#16a34a;background:#ecfdf5}

.rv-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 4px 16px rgba(2,6,23,.06);padding:10px}
.rv-list{display:grid;gap:10px}
.rv-item{border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:#fff}

.rv-user{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.rv-avatar{width:28px;height:28px;border-radius:50%;background:#f1f5f9;display:grid;place-items:center;font-weight:800;color:#475569;font-size:12px}
.rv-name{font-weight:700;color:#0f172a;font-size:14px}
.rv-stars{display:flex;align-items:center;gap:1px}
.rv-star{font-size:14px;color:#f59e0b}
.rv-star.muted{color:#cbd5e1}

.rv-comment{color:#0f172a;margin:4px 0;font-size:13px;line-height:1.4}
.rv-time{font-size:11px;color:#64748b}

.rv-images{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:6px}
.rv-img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb}

.rv-empty{padding:12px;border-radius:10px;background:#f8fafc;border:1px dashed #e2e8f0;color:#475569;text-align:center;font-size:13px}

.rv-form{margin-top:12px}
.rv-form .rv-card{background:#f8fafc;border-color:#e2e8f0}

.rv-stars-select{display:flex;gap:2px;margin:4px 0 6px 0}
.rv-stars-btn{cursor:pointer;font-size:22px;line-height:1}
.rv-stars-btn.on{color:#f59e0b}
.rv-stars-btn.off{color:#cbd5e1}

.rv-textarea{width:100%;min-height:84px;padding:8px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;font-size:13px}
.rv-textarea:focus{border-color:#a5b4fc;box-shadow:0 0 0 3px rgba(99,102,241,.10)}

.rv-upload{display:flex;align-items:center;gap:8px;margin-top:6px}
.rv-file{appearance:none;border:1px dashed #cbd5e1;border-radius:8px;padding:6px 8px;background:#fff;cursor:pointer;font-size:12px}
.rv-previews{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.rv-thumb{position:relative}
.rv-thumb>img{width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0}
.rv-x{position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;border:none;background:rgba(15,23,42,.7);color:#fff;cursor:pointer;font-size:12px;line-height:18px}

.rv-actions{display:flex;justify-content:flex-end;margin-top:8px}
.rv-btn{height:34px;padding:0 14px;border-radius:9px;border:1px solid #16a34a;background:#16a34a;color:#fff;font-weight:800;cursor:pointer;font-size:13px}
.rv-btn:disabled{opacity:.7;cursor:not-allowed}

.rv-info{font-size:12px;color:#475569;margin-top:6px}
.rv-tag{background:#fef3c7;color:#b45309;border:1px solid #fde68a;border-radius:999px;padding:1px 8px;font-weight:700;font-size:11px}
@media (max-width: 560px){
  .rv-images{grid-template-columns:repeat(3,1fr)}
  .rv-title{font-size:15px}
}
`;

  if (loading) return <p>Đang tải đánh giá...</p>;

  return (
    <div className="rv-wrap">
      <style>{css}</style>

      <div className="rv-head">
        <div className="rv-title">Đánh giá sản phẩm</div>
        <span className="rv-badge">{reviews.length} đánh giá</span>
      </div>

      {/* Danh sách đánh giá */}
      {!reviews.length ? (
        <div className="rv-empty">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
      ) : (
        <div className="rv-list">
          {reviews.map((rv) => {
            const displayName = rv.user?.name || "Người dùng";
            const initials = displayName.trim().charAt(0).toUpperCase();
            const rate = Number(rv.rating || 0);
            const empty = Math.max(0, 5 - rate);

            return (
              <div key={rv.id} className="rv-item">
                <div className="rv-user">
                  <div className="rv-avatar">{initials}</div>
                  <div>
                    <div className="rv-name">{displayName}</div>
                    <div className="rv-stars" title={`${rate}/5`}>
                      {Array.from({ length: rate }).map((_, i) => (
                        <span key={"f"+i} className="rv-star">★</span>
                      ))}
                      {Array.from({ length: empty }).map((_, i) => (
                        <span key={"e"+i} className="rv-star muted">★</span>
                      ))}
                    </div>
                  </div>
                </div>

                {rv.comment && <div className="rv-comment">{rv.comment}</div>}

                {!!rv.images?.length && (
                  <div className="rv-images">
                    {rv.images.map((img, i) => (
                      <img
                        key={i}
                        className="rv-img"
                        src={`http://127.0.0.1:8000/${img.image}`}
                        alt=""
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ))}
                  </div>
                )}

                <div className="rv-time">
                  {rv.created_at
                    ? new Date(rv.created_at).toLocaleString("vi-VN")
                    : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form đánh giá */}
      {canReview ? (
        <div className="rv-form">
          <div className="rv-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="rv-tag">Đánh giá của bạn</span>
              <span className="rv-info">Đánh giá & chia sẻ ảnh (tối đa 5)</span>
            </div>

            {/* Chọn sao (hover/active) */}
            <div className="rv-stars-select">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`rv-stars-btn ${
                    s <= (hover || rating) ? "on" : "off"
                  }`}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              className="rv-textarea"
              rows="3"
              placeholder="Chia sẻ cảm nhận thực tế của bạn về sản phẩm…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="rv-upload">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="rv-file"
                title="Chọn tối đa 5 ảnh"
              />
              <span className="rv-info">
                Chỉ nhận .jpg .jpeg .png .webp (tối đa 4MB/ảnh)
              </span>
            </div>

            {!!images.length && (
              <div className="rv-previews">
                {images.map((img, i) => (
                  <div key={i} className="rv-thumb">
                    <img src={URL.createObjectURL(img)} alt="" />
                    <button type="button" className="rv-x" onClick={() => handleRemoveImage(i)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rv-actions">
              <button className="rv-btn" onClick={handleSubmit}>
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="rv-info" style={{ marginTop: 8 }}>
          {message || "Vui lòng đăng nhập để đánh giá."}
        </p>
      )}

      {hasReviewed && canReview && (
        <p className="rv-info" style={{ color: "#16a34a" }}>
          ✅ Bạn đã đánh giá, nhưng vẫn có thể đánh giá lại ở đơn hàng khác.
        </p>
      )}
    </div>
  );
}
