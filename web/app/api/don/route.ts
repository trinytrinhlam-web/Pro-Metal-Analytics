import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { phienHienTai } from "@/lib/phien";
import { chuanSdt, DICH_VU } from "@/lib/danh-muc";
import { ghiHangMuc } from "@/lib/bao-hanh";
import type { DonMoi } from "@/lib/kieu";

const COT = "id, thoi_diem, ten, so_dien_thoai, gioi_tinh, hotline_id, dich_vu, khu_vuc, loai_cong_trinh, trang_thai, ly_do_tu_choi, doanh_thu, ghi_chu, giay_goi, tu_bao_cao, tho_id, da_duyet, tao_luc, sua_luc" as const;

/** Đơn thợ nhập trong N ngày gần đây — màn "Hôm nay" và sửa đơn cũ. */
export async function GET(req: Request) {
  const phien = await phienHienTai();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });

  const ngay = Math.min(30, Math.max(1, Number(new URL(req.url).searchParams.get("ngay")) || 7));
  const tu = new Date(Date.now() - ngay * 864e5);
  tu.setHours(0, 0, 0, 0);

  let q = db().from("khach_hang").select(COT).gte("thoi_diem", tu.toISOString());
  // Thợ chỉ thấy đơn của chính mình; admin thấy hết.
  if (phien.vaiTro !== "admin") q = q.eq("tho_id", phien.thoId);

  const { data, error } = await q.order("thoi_diem", { ascending: false }).limit(300);
  if (error) return loiHeThong("don: doc/ghi", error);
  return NextResponse.json({ ds: data ?? [] });
}

/** Lưu một đơn mới. */
export async function POST(req: Request) {
  const phien = await phienHienTai();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as DonMoi;
  const sdt = chuanSdt(b.so_dien_thoai || "");
  if (sdt.length < 9) {
    return NextResponse.json(
      { loi: "Số điện thoại chưa đủ — đây là thứ duy nhất bắt buộc." },
      { status: 400 }
    );
  }

  // Máy thợ gửi lại sau khi mất sóng: nếu đã có đơn cùng khoá thì trả về đơn cũ,
  // không tạo thêm bản trùng.
  if (b.khoa_client) {
    const { data: cu } = await db()
      .from("khach_hang")
      .select(COT)
      .eq("khoa_client", b.khoa_client)
      .maybeSingle();
    if (cu) return NextResponse.json({ don: cu, daCo: true });
  }

  const dichVu = (b.dich_vu ?? []).filter((d) => DICH_VU.includes(d));
  const thoiDiem = b.thoi_diem ? new Date(b.thoi_diem) : new Date();
  const trangThai = b.trang_thai ?? "hoi_gia";

  const { data, error } = await db()
    .from("khach_hang")
    .insert({
      thoi_diem: thoiDiem.toISOString(),
      ten: b.ten?.trim() || null,
      so_dien_thoai: sdt,
      gioi_tinh: b.gioi_tinh ?? null,
      hotline_id: null, // thợ không gán nguồn — admin làm ở màn Duyệt đơn
      dich_vu: dichVu,
      khu_vuc: b.khu_vuc || null,
      loai_cong_trinh: b.loai_cong_trinh || null,
      trang_thai: trangThai,
      ly_do_tu_choi: trangThai === "tu_choi" ? b.ly_do_tu_choi || null : null,
      doanh_thu: typeof b.doanh_thu === "number" ? b.doanh_thu : null,
      ghi_chu: b.ghi_chu?.trim() || null,
      khoa_client: b.khoa_client ?? null,
      tho_id: phien.thoId,
      da_duyet: false,
    })
    .select(COT)
    .single();

  if (error) return loiHeThong("don: doc/ghi", error);

  await ghiHangMuc(data!.id as string, dichVu, thoiDiem);
  return NextResponse.json({ don: data });
}
