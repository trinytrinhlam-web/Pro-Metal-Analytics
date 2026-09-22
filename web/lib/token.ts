import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ký và đọc token phiên. Tách riêng khỏi phien.ts để phần này không dính gì
 * tới Next, nhờ vậy kiểm thử chạy thẳng bằng node được.
 */
export type VaiTro = "tho" | "admin";
export type Phien = { thoId: string; ten: string; vaiTro: VaiTro; het: number };

export const HAN_NGAY = 60; // thợ đăng nhập một lần rồi thôi

function bem() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Thiếu SESSION_SECRET. Tạo bằng: openssl rand -base64 32");
  return s;
}

function ky(noiDung: string): string {
  return createHmac("sha256", bem()).update(noiDung).digest("base64url");
}

export function taoToken(p: Omit<Phien, "het">): string {
  const phien: Phien = { ...p, het: Date.now() + HAN_NGAY * 864e5 };
  const than = Buffer.from(JSON.stringify(phien)).toString("base64url");
  return `${than}.${ky(than)}`;
}

export function docToken(token: string | undefined): Phien | null {
  if (!token) return null;
  const [than, chuKy] = token.split(".");
  if (!than || !chuKy) return null;
  // so sánh theo kiểu không lộ thời gian
  const a = Buffer.from(chuKy);
  const b = Buffer.from(ky(than));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(than, "base64url").toString()) as Phien;
    if (!p.thoId || typeof p.het !== "number" || p.het < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
