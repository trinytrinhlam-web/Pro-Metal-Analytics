import type { KhachHang, Hotline } from "./kieu.ts";
import { hanBaoHanh } from "./ngay.ts";
import { BAO_HANH_MAC_DINH } from "./danh-muc.ts";

/**
 * Toàn bộ phép tính cho phần phân tích. Không đụng database, không đụng React,
 * nên kiểm thử chạy thẳng được.
 *
 * Nguyên tắc xuyên suốt: khách cũ gọi lại KHÔNG tốn đồng quảng cáo nào, nên mọi
 * chỉ số về tiền quảng cáo (giá một khách, giá một đơn, ROAS) chỉ tính trên
 * khách mới. Gộp khách cũ vào là các con số đó rẻ đi một cách giả tạo.
 */

export type Ky = "7" | "30" | "thang" | "truoc";

export function khoangKy(k: Ky, moc = new Date()): [Date, Date] {
  const cuoi = new Date(moc);
  let dau: Date;
  if (k === "7") dau = dauNgay(new Date(moc.getTime() - 6 * 864e5));
  else if (k === "30") dau = dauNgay(new Date(moc.getTime() - 29 * 864e5));
  else if (k === "thang") dau = new Date(moc.getFullYear(), moc.getMonth(), 1);
  else {
    dau = new Date(moc.getFullYear(), moc.getMonth() - 1, 1);
    return [dau, new Date(moc.getFullYear(), moc.getMonth(), 1)];
  }
  return [dau, cuoi];
}

export function dauNgay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function soNgay(k: Ky, moc = new Date()): number {
  const [a, b] = khoangKy(k, moc);
  return Math.max(1, Math.round((dauNgay(b).getTime() - dauNgay(a).getTime()) / 864e5) + 1);
}

/** Kỳ liền trước, cùng độ dài, để so sánh. */
export function kyTruoc(k: Ky, moc = new Date()): [Date, Date] {
  const [a, b] = khoangKy(k, moc);
  const dai = b.getTime() - a.getTime();
  return [new Date(a.getTime() - dai - 864e5), new Date(a.getTime() - 1)];
}

export type TongHop = {
  n: number;
  chot: number;
  ty: number;
  dt: number;
  tb: number;
  chi: number;
  moi: number;
  cu: number;
  dtCu: number;
  dtMoi: number;
  cpl: number;
  cpa: number;
  roas: number;
  thieuTien: number;
  chuaDuyet: number;
};

export function tongHop(ds: KhachHang[], chiPhi: number): TongHop {
  const chot = ds.filter((l) => l.trang_thai === "da_chot");
  const dt = tong(chot);
  const moi = ds.filter((l) => !l.la_khach_cu);
  const chotMoi = moi.filter((l) => l.trang_thai === "da_chot");
  const dtMoi = tong(chotMoi);
  return {
    n: ds.length,
    chot: chot.length,
    ty: phanTram(chot.length, ds.length),
    dt,
    tb: chot.length ? dt / chot.length : 0,
    chi: chiPhi,
    moi: moi.length,
    cu: ds.length - moi.length,
    dtCu: dt - dtMoi,
    dtMoi,
    cpl: moi.length ? chiPhi / moi.length : 0,
    cpa: chotMoi.length ? chiPhi / chotMoi.length : 0,
    roas: chiPhi ? dtMoi / chiPhi : 0,
    thieuTien: chot.filter((l) => !l.doanh_thu).length,
    chuaDuyet: ds.filter((l) => !l.da_duyet).length,
  };
}

const tong = (ds: KhachHang[]) => ds.reduce((s, l) => s + (l.doanh_thu ?? 0), 0);

export function phanTram(a: number, b: number): number {
  return b ? Math.round((a / b) * 1000) / 10 : 0;
}

/** Chi phí quảng cáo của cả kỳ, quy từ ngân sách tháng ra số ngày thực. */
export function chiPhiKy(hotlines: Hotline[], ngay: number, locNguon?: string | null): number {
  return hotlines
    .filter((h) => (locNguon ? h.id === locNguon : true))
    .reduce((s, h) => s + (h.chi_phi_thang / 30) * ngay, 0);
}

export type DongNguon = {
  hotline: Hotline | null;
  n: number;
  cu: number;
  chot: number;
  ty: number;
  dt: number;
  chi: number;
  cpl: number;
  cpa: number;
  roas: number;
};

export function theoNguon(ds: KhachHang[], hotlines: Hotline[], ngay: number): DongNguon[] {
  const rows: DongNguon[] = hotlines.map((h) => {
    const s = ds.filter((l) => l.hotline_id === h.id);
    const chi = (h.chi_phi_thang / 30) * ngay;
    return dongNguon(h, s, chi);
  });
  const chuaRo = ds.filter((l) => !l.hotline_id);
  if (chuaRo.length) rows.push(dongNguon(null, chuaRo, 0));
  return rows.filter((r) => r.n || r.chi);
}

function dongNguon(h: Hotline | null, s: KhachHang[], chi: number): DongNguon {
  const chot = s.filter((l) => l.trang_thai === "da_chot");
  const moi = s.filter((l) => !l.la_khach_cu);
  const chotMoi = moi.filter((l) => l.trang_thai === "da_chot");
  return {
    hotline: h,
    n: s.length,
    cu: s.length - moi.length,
    chot: chot.length,
    ty: phanTram(chot.length, s.length),
    dt: tong(chot),
    chi,
    cpl: moi.length ? chi / moi.length : 0,
    cpa: chotMoi.length ? chi / chotMoi.length : 0,
    roas: chi ? tong(chotMoi) / chi : 0,
  };
}

/** Lưới giờ × thứ. Hàng 0 là Thứ 2, hàng 6 là Chủ nhật. */
export function luoiGioThu(ds: KhachHang[], gio: number[]): { luoi: number[][]; max: number } {
  const luoi = Array.from({ length: 7 }, () => gio.map(() => 0));
  let max = 0;
  for (const l of ds) {
    const d = new Date(l.thoi_diem);
    const hang = (d.getDay() + 6) % 7; // Chủ nhật 0 → cuối tuần
    const cot = gio.indexOf(d.getHours());
    if (cot < 0) continue;
    luoi[hang][cot]++;
    if (luoi[hang][cot] > max) max = luoi[hang][cot];
  }
  return { luoi, max };
}

export function demTheo(ds: KhachHang[], lay: (l: KhachHang) => string | string[] | null) {
  const m = new Map<string, number>();
  for (const l of ds) {
    const v = lay(l);
    for (const k of Array.isArray(v) ? v : [v]) {
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/** Doanh thu theo dịch vụ — đơn nhiều hạng mục thì chia đều tiền cho các hạng mục. */
export function doanhThuTheoDichVu(ds: KhachHang[]): [string, number][] {
  const m = new Map<string, number>();
  for (const l of ds) {
    if (l.trang_thai !== "da_chot" || !l.doanh_thu || !l.dich_vu?.length) continue;
    const phan = l.doanh_thu / l.dich_vu.length;
    for (const d of l.dich_vu) m.set(d, (m.get(d) ?? 0) + phan);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function theoNgay(ds: KhachHang[], tu: Date, ngay: number) {
  const d0 = dauNgay(tu).getTime();
  const out = Array.from({ length: ngay }, (_, i) => ({
    ngay: new Date(d0 + i * 864e5),
    n: 0,
    dt: 0,
  }));
  for (const l of ds) {
    const i = Math.floor((dauNgay(new Date(l.thoi_diem)).getTime() - d0) / 864e5);
    if (i >= 0 && i < out.length) {
      out[i].n++;
      if (l.trang_thai === "da_chot") out[i].dt += l.doanh_thu ?? 0;
    }
  }
  return out;
}

/** Hạn bảo hành của một đơn, gộp các hạng mục cùng thời hạn thành một dòng. */
export type HangMucBH = { dichVu: string; thang: number; hetHan: Date; conLai: number };

export function baoHanhCuaDon(
  moc: Date,
  dichVu: string[],
  thangTheoDichVu?: Map<string, number>,
  homNay = new Date()
): HangMucBH[] {
  const nhom = new Map<string, { dv: string[]; thang: number; het: Date }>();
  for (const dv of dichVu.length ? dichVu : ["Khác"]) {
    const thang = thangTheoDichVu?.get(dv) ?? BAO_HANH_MAC_DINH;
    const het = hanBaoHanh(moc, thang);
    const khoa = `${thang}|${het.getTime()}`;
    const g = nhom.get(khoa) ?? { dv: [], thang, het };
    g.dv.push(dv);
    nhom.set(khoa, g);
  }
  return [...nhom.values()].map((g) => ({
    dichVu: g.dv.join(", "),
    thang: g.thang,
    hetHan: g.het,
    conLai: Math.ceil((g.het.getTime() - homNay.getTime()) / 864e5),
  }));
}

export type TrangThaiBH = "con" | "sap" | "het";

export function trangThaiBH(conLai: number): TrangThaiBH {
  if (conLai < 0) return "het";
  if (conLai <= 60) return "sap";
  return "con";
}
