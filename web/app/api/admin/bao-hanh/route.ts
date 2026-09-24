import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { chanAdmin } from "@/lib/quyen";

/** Ghi nhận một lần đi bảo hành. */
export async function POST(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const b = (await req.json().catch(() => ({}))) as {
    khach_hang_id?: string; noi_dung?: string; chi_phi?: number;
  };
  if (!b.khach_hang_id) return NextResponse.json({ loi: "Thiếu đơn." }, { status: 400 });

  const { data, error } = await db()
    .from("bao_hanh_log")
    .insert({
      khach_hang_id: b.khach_hang_id,
      noi_dung: b.noi_dung?.trim() || null,
      chi_phi: typeof b.chi_phi === "number" ? b.chi_phi : null,
      nguoi_di: g.phien.thoId,
    })
    .select("id, khach_hang_id, ngay, noi_dung, chi_phi")
    .single();
  if (error) return loiHeThong("admin/bao-hanh: ghi", error);
  return NextResponse.json({ log: data });
}

export async function DELETE(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ loi: "Thiếu id." }, { status: 400 });
  const { error } = await db().from("bao_hanh_log").delete().eq("id", id);
  if (error) return loiHeThong("admin/bao-hanh: xoa", error);
  return NextResponse.json({ xong: true });
}
