import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { phienHienTai } from "@/lib/phien";
import { bamPin, kiemPin } from "@/lib/mat-khau";

async function chanNeuKhongPhaiAdmin() {
  const p = await phienHienTai();
  if (!p) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });
  if (p.vaiTro !== "admin") return NextResponse.json({ loi: "Chỉ admin." }, { status: 403 });
  return null;
}

export async function GET() {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;
  const { data, error } = await db()
    .from("tho")
    .select("id, ten, vai_tro, dang_dung, tao_luc")
    .order("tao_luc");
  if (error) return loiHeThong("admin/tho", error);
  return NextResponse.json({ ds: data ?? [] });
}

/** Mã PIN không được trùng, vì đăng nhập chỉ dựa vào mã. */
async function pinDaCoNguoiDung(pin: string, boQuaId?: string) {
  const { data } = await db().from("tho").select("id, pin_bam");
  for (const t of (data ?? []) as { id: string; pin_bam: string }[]) {
    if (t.id === boQuaId) continue;
    if (await kiemPin(pin, t.pin_bam)) return true;
  }
  return false;
}

export async function POST(req: Request) {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;

  const b = (await req.json().catch(() => ({}))) as { ten?: string; pin?: string; vai_tro?: string };
  const ten = String(b.ten || "").trim();
  const pin = String(b.pin || "").replace(/\D/g, "");
  if (!ten) return NextResponse.json({ loi: "Chưa điền tên thợ." }, { status: 400 });
  if (pin.length < 4) return NextResponse.json({ loi: "Mã PIN phải đủ 4 số." }, { status: 400 });
  if (await pinDaCoNguoiDung(pin)) {
    return NextResponse.json({ loi: `Mã ${pin} đã có thợ khác dùng.` }, { status: 409 });
  }

  const { data, error } = await db()
    .from("tho")
    .insert({
      ten,
      pin_bam: await bamPin(pin),
      vai_tro: b.vai_tro === "admin" ? "admin" : "tho",
    })
    .select("id, ten, vai_tro, dang_dung, tao_luc")
    .single();
  if (error) return loiHeThong("admin/tho", error);
  return NextResponse.json({ tho: data });
}

export async function PATCH(req: Request) {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;

  const b = (await req.json().catch(() => ({}))) as {
    id?: string; ten?: string; pin?: string; dang_dung?: boolean;
  };
  if (!b.id) return NextResponse.json({ loi: "Thiếu id." }, { status: 400 });

  const capNhat: Record<string, unknown> = {};
  if (b.ten !== undefined) {
    const t = b.ten.trim();
    if (!t) return NextResponse.json({ loi: "Tên thợ không được để trống." }, { status: 400 });
    capNhat.ten = t;
  }
  if (b.dang_dung !== undefined) capNhat.dang_dung = b.dang_dung;
  if (b.pin !== undefined) {
    const pin = b.pin.replace(/\D/g, "");
    if (pin.length < 4) return NextResponse.json({ loi: "Mã PIN phải đủ 4 số." }, { status: 400 });
    if (await pinDaCoNguoiDung(pin, b.id)) {
      return NextResponse.json({ loi: `Mã ${pin} đã có thợ khác dùng.` }, { status: 409 });
    }
    capNhat.pin_bam = await bamPin(pin);
  }
  if (!Object.keys(capNhat).length) {
    return NextResponse.json({ loi: "Không có gì để sửa." }, { status: 400 });
  }

  const { data, error } = await db()
    .from("tho")
    .update(capNhat)
    .eq("id", b.id)
    .select("id, ten, vai_tro, dang_dung, tao_luc")
    .single();
  if (error) return loiHeThong("admin/tho", error);
  return NextResponse.json({ tho: data });
}
