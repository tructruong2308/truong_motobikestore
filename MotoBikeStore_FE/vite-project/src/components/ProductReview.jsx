// src/pages/Customers/ProductReview.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

/* ========= Helpers cục bộ (fix ReferenceError) ========= */
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
  // Nếu bạn dùng ở trang chi tiết sản phẩm, route của bạn phải là /products/:id
  const { id: productId } = useParams();

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
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
    setComment("");
    setImages([]);
    fetchReviews();
    checkReviewPermission();
  };

  if (loading) return <p>Đang tải đánh giá...</p>;

  return (
    <div className="product-reviews mt-4 border-top pt-4">
      <h5 className="fw-bold mb-3">⭐ Đánh giá sản phẩm</h5>

      {/* danh sách đánh giá */}
      {!reviews.length ? (
        <p className="text-muted">Chưa có đánh giá nào.</p>
      ) : (
        <div className="review-list mb-4">
          {reviews.map((rv) => (
            <div
              key={rv.id}
              className="border-bottom pb-3 mb-3 bg-white rounded p-3 shadow-sm"
            >
              <div className="d-flex justify-content-between align-items-center">
                <strong>{rv.user?.name || "Người dùng ẩn danh"}</strong>
                <div>
                  {"⭐".repeat(rv.rating)}
                  {"☆".repeat(5 - (rv.rating || 0))}
                </div>
              </div>
              <p className="mb-1">{rv.comment}</p>
              {!!rv.images?.length && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {rv.images.map((img, i) => (
                    <img
                      key={i}
                      src={`http://127.0.0.1:8000/${img.image}`}
                      alt=""
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                  ))}
                </div>
              )}
              <small className="text-muted d-block mt-2">
                {rv.created_at
                  ? new Date(rv.created_at).toLocaleString("vi-VN")
                  : ""}
              </small>
            </div>
          ))}
        </div>
      )}

      {/* form đánh giá */}
      {canReview ? (
        <form
          onSubmit={handleSubmit}
          className="review-form bg-light p-3 rounded shadow-sm"
        >
          <div className="mb-2">
            <label className="fw-bold">Chọn số sao:</label>
            <div>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  onClick={() => setRating(s)}
                  style={{
                    cursor: "pointer",
                    fontSize: "1.6rem",
                    color: s <= rating ? "gold" : "#ccc",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Cảm nhận của bạn…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="fw-bold">Thêm hình ảnh (tối đa 5):</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="form-control"
            />
            {!!images.length && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {images.map((img, i) => (
                  <div key={i} className="position-relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 4,
                        border: "none",
                        background: "rgba(0,0,0,.6)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary">
            Gửi đánh giá
          </button>
        </form>
      ) : (
        <p className="text-muted mt-2">
          {message || "Vui lòng đăng nhập để đánh giá."}
        </p>
      )}

      {hasReviewed && canReview && (
        <p className="text-success mt-2">
          ✅ Bạn đã đánh giá, nhưng vẫn có thể đánh giá lại ở đơn hàng khác.
        </p>
      )}
    </div>
  );
}
