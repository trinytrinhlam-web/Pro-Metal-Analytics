import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { phienHienTai } from "@/lib/phien";
import { chuanSdt } from "@/lib/danh-muc";

/**
 * Tra số điện thoại xem có phải khách cũ không — thợ gõ đủ số là hiện ngay
 * lịch sử, báo giá tự tin hơn.
 */
export async function GET(req: Request) {
  const phien = await phienHienTai();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });

  const sdt = chuanSdt(new URL(req.url).searchParams.get("sdt") || "");
  if (sdt.length < 9) return NextResponse.json({ cu: null });

  const { data, error } = await db()
    .from("khach_hang")
    .select("id, thoi_diem, ten, gioi_tinh, dich_vu, trang_thai, doanh_thu, khu_vuc")
    .eq("so_dien_thoai", sdt)
    .order("thoi_diem", { ascending: false })
    .limit(20);
  if (error) return loiHeThong("khach: tra sdt", error);

  const ds = (data ?? []) as {
    thoi_diem: string; ten: string | null; gioi_tinh: string | null;
    dich_vu: string[]; trang_thai: string; doanh_thu: number | null; khu_vuc: string | null;
  }[];
  if (!ds.length) return NextResponse.json({ cu: null });

  const chot = ds.filter((d) => d.trang_thai === "da_chot");
  return NextResponse.json({
    cu: {
      soLan: ds.length,
      soDon: chot.length,
      tong: chot.reduce((s, d) => s + (d.doanh_thu ?? 0), 0),
      ten: ds.find((d) => d.ten)?.ten ?? null,
      gioiTinh: ds.find((d) => d.gioi_tinh)?.gioi_tinh ?? null,
      khuVuc: ds.find((d) => d.khu_vuc)?.khu_vuc ?? null,
      lanGanNhat: ds[0].thoi_diem,
      dichVuGanNhat: ds[0].dich_vu ?? [],
    },
  });
}
