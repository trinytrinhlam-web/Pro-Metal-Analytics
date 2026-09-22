"use client";

/**
 * Giữ lại đơn thợ đang gõ dở. Điện thoại thợ hay bị hệ điều hành dọn app nền
 * để lấy bộ nhớ; không có cái này thì mở lại là mất trắng những gì vừa gõ.
 */
const KHOA = "csr_ban_nhap_v1";
const HAN = 12 * 3600e3; // quá nửa ngày thì coi như đơn cũ, bỏ đi

export type BanNhap = Record<string, unknown> & { thoiDiem: string; luuLuc: number };

export function luuBanNhap(f: Record<string, unknown> & { thoiDiem: Date }) {
  try {
    const { ai: _bo, ...conLai } = f as Record<string, unknown>;
    localStorage.setItem(
      KHOA,
      JSON.stringify({ ...conLai, thoiDiem: f.thoiDiem.toISOString(), luuLuc: Date.now() })
    );
  } catch {
    /* trình duyệt chặn hoặc hết chỗ — không làm hỏng luồng nhập */
  }
}

export function docBanNhap(): BanNhap | null {
  try {
    const s = localStorage.getItem(KHOA);
    if (!s) return null;
    const b = JSON.parse(s) as BanNhap;
    if (!b.luuLuc || Date.now() - b.luuLuc > HAN) {
      localStorage.removeItem(KHOA);
      return null;
    }
    return b;
  } catch {
    return null;
  }
}

export function xoaBanNhap() {
  try {
    localStorage.removeItem(KHOA);
  } catch {
    /* kệ */
  }
}

/** Bản nháp rỗng thì đừng khôi phục, khỏi làm thợ bối rối. */
export function coGiDangKe(b: BanNhap): boolean {
  const dv = b.dichVu;
  return Boolean(
    b.sdt || b.ten || b.doanhThu || b.khuVuc || b.ghiChu || b.trangThai ||
    (Array.isArray(dv) && dv.length)
  );
}
