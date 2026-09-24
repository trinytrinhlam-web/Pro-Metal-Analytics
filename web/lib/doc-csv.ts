import { chuanSdt } from "./danh-muc.ts";

/**
 * Đọc báo cáo "Chi tiết cuộc gọi" tải từ giao diện Google Ads.
 *
 * Google Ads API không trả số điện thoại người gọi (chính sách riêng tư), nhưng
 * báo cáo tải tay thì có — nên đây là đường duy nhất để gán nguồn hàng loạt mà
 * không phải mua tổng đài.
 *
 * Bộ đọc cố ý dễ tính: file Google xuất ra có mấy dòng tiêu đề thừa ở đầu, dòng
 * tổng cộng ở cuối, tên cột thay đổi theo ngôn ngữ, và ngày giờ có hai kiểu.
 */
export type DongGoi = { sdt: string; luc: Date | null; giay: number; trangThai: string };

export function tachCsv(t: string): string[][] {
  const hang: string[][] = [];
  let o: string[] = [], c = "", trongNgoac = false;
  t = t.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (trongNgoac) {
      if (ch === '"') {
        if (t[i + 1] === '"') { c += '"'; i++; } else trongNgoac = false;
      } else c += ch;
    } else if (ch === '"') trongNgoac = true;
    else if (ch === "," || ch === "\t") { o.push(c); c = ""; }
    else if (ch === "\n") { o.push(c); hang.push(o); o = []; c = ""; }
    else c += ch;
  }
  o.push(c);
  if (o.length > 1 || o[0] !== "") hang.push(o);
  return hang;
}

const RE = {
  sdt: /s(ố|o)\s*(đi|di)(ệ|e)n\s*tho(ạ|a)i|caller|phone/i,
  luc: /th(ờ|o)i\s*gian\s*b(ắ|a)t\s*(đ|d)(ầ|a)u|call\s*start|start\s*time|ng(à|a)y/i,
  giay: /th(ờ|o)i\s*l(ượ|uo)ng|duration/i,
  tt: /tr(ạ|a)ng\s*th(á|a)i|status/i,
};

export function timCot(hang: string[][]) {
  for (let i = 0; i < Math.min(hang.length, 12); i++) {
    const h = hang[i];
    const m: { hang: number; sdt?: number; luc?: number; giay?: number; tt?: number } = { hang: i };
    h.forEach((o, j) => {
      const v = String(o ?? "").trim();
      if (m.sdt == null && RE.sdt.test(v)) m.sdt = j;
      else if (m.luc == null && RE.luc.test(v)) m.luc = j;
      else if (m.giay == null && RE.giay.test(v)) m.giay = j;
      else if (m.tt == null && RE.tt.test(v)) m.tt = j;
    });
    if (m.sdt != null) return m;
  }
  return null;
}

export function docGio(x: string): Date | null {
  const v = String(x ?? "").trim();
  let m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +(m[6] || 0));
  m = v.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function docBaoCao(raw: string): { loi: string } | { ds: DongGoi[] } {
  const hang = tachCsv(raw).filter((r) => r.some((c) => String(c).trim() !== ""));
  if (!hang.length) return { loi: "File rỗng." };
  const m = timCot(hang);
  if (!m || m.sdt == null) {
    return { loi: "Không tìm thấy cột số điện thoại. Khi tải báo cáo nhớ bật cột “Số điện thoại người gọi”." };
  }

  const ds: DongGoi[] = [];
  const daThay = new Set<string>();
  for (let i = m.hang + 1; i < hang.length; i++) {
    const r = hang[i];
    const sdt = chuanSdt(r[m.sdt]);
    if (sdt.length < 9) continue;                       // bỏ dòng tổng cộng và dòng rỗng
    const luc = m.luc != null ? docGio(r[m.luc]) : null;
    const khoa = `${sdt}|${luc ? luc.getTime() : i}`;
    if (daThay.has(khoa)) continue;
    daThay.add(khoa);
    ds.push({
      sdt,
      luc,
      giay: m.giay != null ? parseInt(String(r[m.giay]).replace(/\D/g, ""), 10) || 0 : 0,
      trangThai: m.tt != null ? String(r[m.tt] ?? "").trim() : "",
    });
  }
  if (!ds.length) return { loi: "Đọc được tiêu đề nhưng không có dòng dữ liệu nào." };
  return { ds };
}

export type Khop = { goi: DongGoi; donId: string | null; sdtCu?: string; viec: "gan" | "sua" | "moi" | "bo" };

/**
 * Ghép từng cuộc gọi với đơn đã có.
 *
 * Khớp hụt vì thợ gõ sai một chữ số thì vẫn nhận ra được: số di động Việt Nam
 * là 0 + 9 số nên so 9 số cuối là đủ, và báo cáo của Google mới là số đúng.
 */
export function khopVoiDon(
  ds: DongGoi[],
  don: { id: string; so_dien_thoai: string; thoi_diem: string; hotline_id: string | null }[]
): Khop[] {
  const duoi = (x: string) => x.slice(-9);
  return ds.map((g): Khop => {
    const chon = (hop: (d: (typeof don)[number]) => boolean) => {
      let u = don.filter(hop);
      if (g.luc) {
        const t = g.luc.getTime();
        u = u.filter((d) => Math.abs(new Date(d.thoi_diem).getTime() - t) < 24 * 36e5);
        u.sort((a, b) =>
          Math.abs(new Date(a.thoi_diem).getTime() - t) - Math.abs(new Date(b.thoi_diem).getTime() - t));
      } else {
        u.sort((a, b) => new Date(b.thoi_diem).getTime() - new Date(a.thoi_diem).getTime());
      }
      return u[0] ?? null;
    };

    const dung = chon((d) => chuanSdt(d.so_dien_thoai) === g.sdt);
    if (dung) return { goi: g, donId: dung.id, viec: dung.hotline_id ? "bo" : "gan" };

    const gan = chon((d) => {
      const s = chuanSdt(d.so_dien_thoai);
      return s.length >= 9 && duoi(s) === duoi(g.sdt);
    });
    if (gan) {
      return { goi: g, donId: gan.id, sdtCu: chuanSdt(gan.so_dien_thoai), viec: gan.hotline_id ? "bo" : "sua" };
    }
    return { goi: g, donId: null, viec: "moi" };
  });
}

/**
 * Một dòng ghi chú cho đơn dựng từ báo cáo cuộc gọi, để người duyệt biết ngay
 * đây không phải thợ nhập tay mà là cuộc gọi quảng cáo chưa ai ghi nhận.
 *
 * Cuộc không kết nối thì chỉ ghi số giây, không ghi "nói" — máy có đổ chuông
 * chứ có ai nói câu nào đâu.
 */
export function ghiChuCuoc(
  tinhTrang: string | null | undefined,
  giay: number | null | undefined
): string {
  const tt = tinhTrang?.trim() ?? "";
  const ketNoi = tt !== "" && !/kh(ô|o)ng|missed|not\s*connect/i.test(tt);
  const phan = ["Dựng từ báo cáo cuộc gọi Google Ads"];
  if (tt) phan.push(tt);
  if (typeof giay === "number" && giay > 0) phan.push(`${ketNoi ? "nói " : ""}${giay} giây`);
  return phan.join(" · ") + ".";
}
