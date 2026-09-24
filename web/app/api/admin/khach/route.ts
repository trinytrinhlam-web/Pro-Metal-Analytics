import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { chanAdmin } from "@/lib/quyen";
import { chuanSdt } from "@/lib/danh-muc";

const COT =
  "id, thoi_diem, ten, so_dien_thoai, gioi_tinh, hotline_id, dich_vu, khu_vuc, loai_cong_trinh, trang_thai, ly_do_tu_choi, doanh_thu, ghi_chu, giay_goi, tu_bao_cao, la_khach_cu, tho_id, da_duyet, tao_luc, sua_luc" as const;

/**
 * Tra cứu bảo hành.
 *   ?sdt=09xx   → mọi lần liên hệ của số đó
 *   ?sap_het=1  → đơn có hạng mục hết hạn trong 60 ngày tới, gấp nhất lên đầu
 */
export async function GET(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;
  const sp = new URL(req.url).searchParams;

  if (sp.get("sap_het") === "1") {
    const homNay = new Date();
    const moc = new Date(homNay.getTime() + 60 * 864e5);
    const { data, error } = await db()
      .from("don_hang_muc")
      .select("id, dich_vu, bh_so_thang, bh_het_han, khach_hang_id")
      .gte("bh_het_han", homNay.toISOString().slice(0, 10))
      .lte("bh_het_han", moc.toISOString().slice(0, 10))
      .order("bh_het_han")
      .limit(500);
    if (error) return loiHeThong("admin/khach: sap het", error);

    const ids = [...new Set((data ?? []).map((r) => r.khach_hang_id))];
    if (!ids.length) return NextResponse.json({ hangMuc: [], don: [] });

    const { data: don, error: loiDon } = await db().from("khach_hang").select(COT).in("id", ids);
    if (loiDon) return loiHeThong("admin/khach: doc don", loiDon);

    // Chỉ đơn đã chốt mới có bảo hành để mà gọi nhắc. Dữ liệu cũ có thể còn
    // hạng mục dính vào đơn mới hỏi giá — lọc ở đây cho danh sách gọi sạch,
    // khỏi phải đi dọn database.
    const daChot = (don ?? []).filter((d) => d.trang_thai === "da_chot");
    const conLai = new Set(daChot.map((d) => d.id));
    return NextResponse.json({
      hangMuc: (data ?? []).filter((h) => conLai.has(h.khach_hang_id)),
      don: daChot,
    });
  }

  const sdt = chuanSdt(sp.get("sdt") || "");
  if (sdt.length < 3) return NextResponse.json({ don: [], hangMuc: [], log: [] });

  // Gõ một phần số cũng ra, để thợ khỏi phải nhớ đủ 10 số.
  const { data: don, error } = await db()
    .from("khach_hang")
    .select(COT)
    .like("so_dien_thoai", `%${sdt}%`)
    .order("thoi_diem", { ascending: false })
    .limit(200);
  if (error) return loiHeThong("admin/khach: tim", error);

  const ids = (don ?? []).map((d) => d.id);
  if (!ids.length) return NextResponse.json({ don: [], hangMuc: [], log: [] });

  const [hm, lg] = await Promise.all([
    db().from("don_hang_muc").select("id, dich_vu, bh_so_thang, bh_het_han, khach_hang_id").in("khach_hang_id", ids),
    db().from("bao_hanh_log").select("id, khach_hang_id, ngay, noi_dung, chi_phi").in("khach_hang_id", ids),
  ]);
  return NextResponse.json({ don, hangMuc: hm.data ?? [], log: lg.data ?? [] });
}
