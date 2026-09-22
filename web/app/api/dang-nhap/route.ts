import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { kiemPin } from "@/lib/mat-khau";
import { datPhien } from "@/lib/phien";
import type { VaiTro } from "@/lib/kieu";

type DongTho = { id: string; ten: string; pin_bam: string; vai_tro: VaiTro };

export async function POST(req: Request) {
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  const so = String(pin || "").replace(/\D/g, "");
  if (so.length < 4) {
    return NextResponse.json({ loi: "Mã PIN phải đủ 4 số." }, { status: 400 });
  }

  const { data, error } = await db()
    .from("tho")
    .select("id, ten, pin_bam, vai_tro")
    .eq("dang_dung", true);
  if (error) return loiHeThong("dang-nhap: doc bang tho", error);

  // Phải thử hết mọi thợ vì PIN lưu dạng đã băm, không tra thẳng được.
  for (const t of (data ?? []) as unknown as DongTho[]) {
    if (await kiemPin(so, t.pin_bam)) {
      await datPhien({ thoId: t.id, ten: t.ten, vaiTro: t.vai_tro });
      return NextResponse.json({ tho: { id: t.id, ten: t.ten, vai_tro: t.vai_tro } });
    }
  }
  return NextResponse.json({ loi: "Mã không đúng, thử lại." }, { status: 401 });
}
