import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { phienHienTai } from "@/lib/phien";

const COT = "id, so, kenh, mau, chi_phi_thang, thu_tu, dang_dung";

async function chanNeuKhongPhaiAdmin() {
  const p = await phienHienTai();
  if (!p) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });
  if (p.vaiTro !== "admin") return NextResponse.json({ loi: "Chỉ admin." }, { status: 403 });
  return null;
}

export async function GET() {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;
  const { data, error } = await db().from("hotline").select(COT).order("thu_tu");
  if (error) return loiHeThong("admin/hotline", error);
  return NextResponse.json({ ds: data ?? [] });
}

export async function POST(req: Request) {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;
  const b = (await req.json().catch(() => ({}))) as { so?: string; kenh?: string; mau?: string };
  const so = String(b.so || "").trim();
  const kenh = String(b.kenh || "").trim();
  if (!so) return NextResponse.json({ loi: "Chưa điền số điện thoại." }, { status: 400 });
  if (!kenh) return NextResponse.json({ loi: "Chưa điền kênh này dùng cho gì." }, { status: 400 });

  const { data, error } = await db()
    .from("hotline")
    .insert({ so, kenh, mau: b.mau || "var(--s1)" })
    .select(COT)
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ loi: `Số ${so} đã có trong danh sách.` }, { status: 409 });
    }
    return loiHeThong("admin/hotline: them", error);
  }
  return NextResponse.json({ hotline: data });
}

/**
 * Sửa tại chỗ. Đơn gắn với id của hotline chứ không chép dãy số vào đơn,
 * nên đổi số của một kênh thì toàn bộ lịch sử giữ nguyên.
 */
export async function PATCH(req: Request) {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;
  const b = (await req.json().catch(() => ({}))) as {
    id?: string; so?: string; kenh?: string; mau?: string;
    chi_phi_thang?: number; dang_dung?: boolean;
  };
  if (!b.id) return NextResponse.json({ loi: "Thiếu id." }, { status: 400 });

  const capNhat: Record<string, unknown> = {};
  if (b.so !== undefined) {
    const so = b.so.trim();
    if (!so) return NextResponse.json({ loi: "Số điện thoại không được để trống." }, { status: 400 });
    capNhat.so = so;
  }
  if (b.kenh !== undefined) {
    const k = b.kenh.trim();
    if (!k) return NextResponse.json({ loi: "Tên kênh không được để trống." }, { status: 400 });
    capNhat.kenh = k;
  }
  if (b.mau !== undefined) capNhat.mau = b.mau;
  if (b.chi_phi_thang !== undefined) capNhat.chi_phi_thang = Math.max(0, b.chi_phi_thang | 0);

  if (b.dang_dung === false) {
    const { count } = await db()
      .from("hotline")
      .select("id", { count: "exact", head: true })
      .eq("dang_dung", true);
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ loi: "Phải còn ít nhất một hotline đang dùng." }, { status: 400 });
    }
  }
  if (b.dang_dung !== undefined) capNhat.dang_dung = b.dang_dung;

  if (!Object.keys(capNhat).length) {
    return NextResponse.json({ loi: "Không có gì để sửa." }, { status: 400 });
  }

  const { data, error } = await db().from("hotline").update(capNhat).eq("id", b.id).select(COT).single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ loi: "Số này đang dùng cho kênh khác rồi." }, { status: 409 });
    }
    return loiHeThong("admin/hotline: sua", error);
  }
  return NextResponse.json({ hotline: data });
}

/** Chỉ xoá được hotline chưa có đơn nào gắn vào — xoá là mất nguồn của đơn cũ. */
export async function DELETE(req: Request) {
  const chan = await chanNeuKhongPhaiAdmin();
  if (chan) return chan;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ loi: "Thiếu id." }, { status: 400 });

  const { count } = await db()
    .from("khach_hang")
    .select("id", { count: "exact", head: true })
    .eq("hotline_id", id);
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { loi: `Đã có ${count} đơn gắn với hotline này. Cho nghỉ thay vì xoá.` },
      { status: 409 }
    );
  }

  const { error } = await db().from("hotline").delete().eq("id", id);
  if (error) return loiHeThong("admin/hotline", error);
  return NextResponse.json({ xong: true });
}
