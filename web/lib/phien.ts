import { cookies } from "next/headers";
import { docToken, taoToken, HAN_NGAY, type Phien } from "./token";

export type { Phien } from "./token";
export { taoToken, docToken } from "./token";

const TEN_COOKIE = "csr_phien";

export async function phienHienTai(): Promise<Phien | null> {
  const c = await cookies();
  return docToken(c.get(TEN_COOKIE)?.value);
}

export async function datPhien(p: Omit<Phien, "het">) {
  const c = await cookies();
  c.set(TEN_COOKIE, taoToken(p), {
    httpOnly: true,                                  // JavaScript trên trang không đọc được
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HAN_NGAY * 86400,
  });
}

export async function xoaPhien() {
  const c = await cookies();
  c.delete(TEN_COOKIE);
}
