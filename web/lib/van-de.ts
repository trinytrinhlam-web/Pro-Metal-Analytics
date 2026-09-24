import type { KhachHang } from "./kieu.ts";
import { chuanSdt } from "./danh-muc.ts";

export type Muc = "crit" | "warn" | "info";
export type VanDe = { muc: Muc; chu: string; ma?: "nguon" | "trung" | "cu" };

/** Đơn gần nhất trước đó của cùng số điện thoại. */
export function donTruoc(l: KhachHang, tatCa: KhachHang[]): KhachHang | null {
  const s = chuanSdt(l.so_dien_thoai);
  if (s.length < 9) return null;
  const t = new Date(l.thoi_diem).getTime();
  const truoc = tatCa
    .filter((x) => x.id !== l.id && chuanSdt(x.so_dien_thoai) === s && new Date(x.thoi_diem).getTime() <= t)
    .sort((a, b) => new Date(b.thoi_diem).getTime() - new Date(a.thoi_diem).getTime());
  return truoc[0] ?? null;
}

export function gioCach(a: KhachHang, b: KhachHang): number {
  return Math.abs(new Date(a.thoi_diem).getTime() - new Date(b.thoi_diem).getTime()) / 36e5;
}

/**
 * Soi trước từng đơn để admin không phải tự dò.
 *
 * "Chưa gán nguồn" cố ý KHÔNG tính là lỗi nặng — đơn nào mới vào cũng vậy, tính
 * vào thì thẻ nào cũng đỏ và cảnh báo mất tác dụng.
 */
export function vanDeCuaDon(l: KhachHang, tatCa: KhachHang[]): VanDe[] {
  const v: VanDe[] = [];
  const s = chuanSdt(l.so_dien_thoai);

  if (s.length < 10) v.push({ muc: "crit", chu: `Số điện thoại thiếu số (${s.length}/10)` });
  else if (!s.startsWith("0")) v.push({ muc: "crit", chu: "Số điện thoại sai đầu số" });
  else {
    const p = donTruoc(l, tatCa);
    if (p) {
      const gio = gioCach(l, p);
      const ngay = new Date(p.thoi_diem).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      v.push(gio < 12
        ? { muc: "crit", ma: "trung", chu: `Trùng số với đơn ${ngay} — cách nhau ${Math.round(gio)} tiếng, nhiều khả năng nhập hai lần` }
        : { muc: "crit", ma: "cu", chu: `KHÁCH CŨ GỌI LẠI — đã có đơn ${ngay}, không tốn chi phí quảng cáo` });
    }
  }

  if (!l.hotline_id) v.push({ muc: "warn", ma: "nguon", chu: "Chưa gán nguồn quảng cáo" });
  if (l.trang_thai === "da_chot" && !l.doanh_thu) v.push({ muc: "warn", chu: "Đã chốt nhưng chưa có tiền công" });
  if (l.giay_goi && l.giay_goi < 15) {
    v.push({ muc: "info", chu: `Cuộc gọi chỉ ${l.giay_goi} giây — nhiều khả năng là số rác hoặc bấm nhầm` });
  }
  if (l.trang_thai === "tu_choi" && !l.ly_do_tu_choi) v.push({ muc: "info", chu: "Thiếu lý do từ chối" });
  if (!l.khu_vuc) v.push({ muc: "info", chu: "Thiếu phường xã" });
  if (!l.dich_vu?.length) v.push({ muc: "info", chu: "Thiếu dịch vụ" });
  if (!l.ten) v.push({ muc: "info", chu: "Thiếu tên khách" });
  return v;
}

/** Chỉ lỗi thật mới làm thẻ nổi lên. */
export function loiThat(v: VanDe[]): number {
  return v.filter((x) => x.muc !== "info" && x.ma !== "nguon").length;
}
