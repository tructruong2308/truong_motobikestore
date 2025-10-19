// src/utils/time.js

/**
 * Chuẩn hoá thời gian sang giờ Việt Nam (Asia/Ho_Chi_Minh).
 * - Nếu input là "YYYY-MM-DD HH:mm:ss" (không có timezone), coi là UTC rồi convert về VN.
 * - Nếu input là ISO (có 'T' hoặc timezone), Date sẽ tự hiểu.
 * - Nếu parse lỗi, trả lại nguyên chuỗi.
 */
export function toVNDateTime(input) {
  if (!input) return "";
  let d;

  // ISO/has timezone => Date hiểu được
  if (/\dT\d/.test(input)) {
    d = new Date(input);
  } else {
    // "YYYY-MM-DD HH:mm:ss" => thêm 'T' + 'Z' để coi là UTC
    d = new Date(String(input).replace(" ", "T") + "Z");
  }

  if (isNaN(d.getTime())) return String(input); // fallback khi parse lỗi

  return d.toLocaleString("vi-VN", {
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/** Chỉ ngày (theo VN) */
export function toVNDate(input) {
  if (!input) return "";
  const d = /\dT\d/.test(input)
    ? new Date(input)
    : new Date(String(input).replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

/** Chỉ giờ (theo VN) */
export function toVNTimeOnly(input) {
  if (!input) return "";
  const d = /\dT\d/.test(input)
    ? new Date(input)
    : new Date(String(input).replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleTimeString("vi-VN", {
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
