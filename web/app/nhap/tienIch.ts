export function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export function ddmm(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function vnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}
export function ngan(n: number) {
  if (!n) return "0đ";
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(".", ",") + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " tr";
  return Math.round(n / 1e3) + "k";
}
/** value cho <input type="datetime-local"> theo giờ máy, không lệch múi giờ. */
export function choInputNgayGio(d: Date) {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function tat(ten: string) {
  const w = String(ten || "").trim().split(/\s+/);
  const a = (w.length > 1 ? w[w.length - 2] : w[0]) || "T";
  const b = w.length > 1 ? w[w.length - 1] : "";
  return ((a[0] || "T") + (b[0] || "")).toUpperCase();
}
