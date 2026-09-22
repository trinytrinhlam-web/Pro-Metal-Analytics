"use client";
import type { DonMoi } from "@/lib/kieu";

/**
 * Hàng đợi đơn chưa gửi được. Thợ đứng ở công trình sóng chập chờn vẫn bấm
 * Lưu bình thường; đơn nằm lại trên máy và tự gửi khi có sóng.
 */
const KHOA = "csr_hang_doi_v1";

export type DonCho = DonMoi & { khoa_client: string; luc: number };

function doc(): DonCho[] {
  try {
    const s = localStorage.getItem(KHOA);
    return s ? (JSON.parse(s) as DonCho[]) : [];
  } catch {
    return [];
  }
}

function ghi(ds: DonCho[]) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds));
  } catch {
    /* hết chỗ hoặc trình duyệt chặn — không làm hỏng luồng nhập */
  }
}

export function themVaoHangDoi(don: DonCho) {
  ghi([...doc(), don]);
}

export function soDonCho(): number {
  return doc().length;
}

/** Gửi lại những đơn còn nằm trên máy. Trả về số đơn gửi được. */
export async function guiLai(): Promise<number> {
  const ds = doc();
  if (!ds.length) return 0;
  const conLai: DonCho[] = [];
  let xong = 0;

  for (const d of ds) {
    try {
      const r = await fetch("/api/don", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(d),
      });
      if (r.ok) {
        xong++;
      } else if (r.status >= 400 && r.status < 500 && r.status !== 401 && r.status !== 429) {
        // Dữ liệu sai thì gửi lại bao nhiêu lần cũng hỏng — bỏ ra khỏi hàng đợi.
        xong++;
      } else {
        conLai.push(d);
      }
    } catch {
      conLai.push(d);
    }
  }
  ghi(conLai);
  return xong;
}

export function taoKhoa(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `k${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
