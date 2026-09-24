import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { phienHienTai } from "@/lib/phien";
import { chuanSdt, DICH_VU } from "@/lib/danh-muc";
import { dongBoHangMuc } from "@/lib/bao-hanh";
import type { DonMoi, TrangThai } from "@/lib/kieu";

const COT = "id, thoi_diem, ten, so_dien_thoai, gioi_tinh, hotline_id, dich_vu, khu_vuc, loai_cong_trinh, trang_thai, ly_do_tu_choi, doanh_thu, ghi_chu, giay_goi, tu_bao_cao, tho_id, da_duyet, tao_luc, sua_luc" as const;

/** Sửa đơn — chủ yếu để bổ sung tiền công sau khi làm xong việc. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const phien = await phienHienTai();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });
  const { id } = await ctx.params;

  const { data: cu, error: loiDoc } = await db()
    .from("khach_hang")
    .select("id, tho_id, thoi_diem, dich_vu, trang_thai")
    .eq("id", id)
    .maybeSingle();
  if (loiDoc) return loiHeThong("don/[id]: doc don", loiDoc);
  if (!cu) return NextResponse.json({ loi: "Không tìm thấy đơn." }, { status: 404 });

  // Thợ chỉ sửa được đơn của mình, và chỉ trong 7 ngày. Quá hạn thì báo admin.
  if (phien.vaiTro !== "admin") {
    if (cu.tho_id !== phien.thoId) {
      return NextResponse.json({ loi: "Đơn này của thợ khác." }, { status: 403 });
    }
    if (Date.now() - new Date(cu.thoi_diem as string).getTime() > 7 * 864e5) {
      return NextResponse.json(
        { loi: "Đơn quá 7 ngày rồi, nhờ admin sửa giúp." },
        { status: 403 }
      );
    }
  }

  const b = (await req.json().catch(() => ({}))) as Partial<DonMoi>;
  const capNhat: Record<string, unknown> = {};

  if (b.so_dien_thoai !== undefined) {
    const sdt = chuanSdt(b.so_dien_thoai);
    if (sdt.length < 9) {
      return NextResponse.json({ loi: "Số điện thoại chưa đủ." }, { status: 400 });
    }
    capNhat.so_dien_thoai = sdt;
  }
  if (b.thoi_diem !== undefined) capNhat.thoi_diem = new Date(b.thoi_diem).toISOString();
  if (b.ten !== undefined) capNhat.ten = b.ten.trim() || null;
  if (b.gioi_tinh !== undefined) capNhat.gioi_tinh = b.gioi_tinh ?? null;
  if (b.khu_vuc !== undefined) capNhat.khu_vuc = b.khu_vuc || null;
  if (b.loai_cong_trinh !== undefined) capNhat.loai_cong_trinh = b.loai_cong_trinh || null;
  if (b.doanh_thu !== undefined) capNhat.doanh_thu = b.doanh_thu ?? null;
  if (b.ghi_chu !== undefined) capNhat.ghi_chu = b.ghi_chu?.trim() || null;
  if (b.trang_thai !== undefined) {
    capNhat.trang_thai = b.trang_thai;
    capNhat.ly_do_tu_choi = b.trang_thai === "tu_choi" ? b.ly_do_tu_choi || null : null;
  } else if (b.ly_do_tu_choi !== undefined) {
    capNhat.ly_do_tu_choi = b.ly_do_tu_choi || null;
  }

  let dichVuMoi: string[] | null = null;
  if (b.dich_vu !== undefined) {
    dichVuMoi = b.dich_vu.filter((d) => DICH_VU.includes(d));
    capNhat.dich_vu = dichVuMoi;
  }

  if (!Object.keys(capNhat).length) {
    return NextResponse.json({ loi: "Không có gì để sửa." }, { status: 400 });
  }

  const { data, error } = await db()
    .from("khach_hang")
    .update(capNhat)
    .eq("id", id)
    .select(COT)
    .single();
  if (error) return loiHeThong("don/[id]: cap nhat", error);

  // Đổi hạng mục hoặc đổi trạng thái thì hạn bảo hành phải ghi lại theo đúng
  // ngày làm gốc. Đơn quay về "hỏi giá" / "từ chối" là hạng mục bị gỡ luôn.
  const doiDichVu = dichVuMoi !== null;
  const doiTrangThai = b.trang_thai !== undefined && b.trang_thai !== cu.trang_thai;
  if (doiDichVu || doiTrangThai) {
    await dongBoHangMuc(
      id,
      (b.trang_thai ?? cu.trang_thai) as TrangThai,
      dichVuMoi ?? ((cu.dich_vu as string[] | null) ?? []),
      new Date(cu.thoi_diem as string)
    );
  }
  return NextResponse.json({ don: data });
}
