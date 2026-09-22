import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  pw: string | Buffer,
  salt: string | Buffer,
  len: number
) => Promise<Buffer>;

/** Mã PIN không bao giờ lưu dạng trần, kể cả trong database. */
export async function bamPin(pin: string): Promise<string> {
  const muoi = randomBytes(16).toString("hex");
  const bam = await scrypt(pin, muoi, 32);
  return `scrypt$${muoi}$${bam.toString("hex")}`;
}

export async function kiemPin(pin: string, luu: string): Promise<boolean> {
  const [thuatToan, muoi, bam] = String(luu).split("$");
  if (thuatToan !== "scrypt" || !muoi || !bam) return false;
  const thu = await scrypt(pin, muoi, 32);
  const goc = Buffer.from(bam, "hex");
  if (goc.length !== thu.length) return false;
  return timingSafeEqual(goc, thu);
}
