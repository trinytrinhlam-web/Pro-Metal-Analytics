import { db } from "./db";
import { BAO_HANH_MAC_DINH } from "./danh-muc";
import { hanBaoHanh } from "./ngay";

/**
 * Hạn bảo hành ghi sẵn vào từng hạng mục ngay lúc tạo đơn, để tra cứu về sau
 * chỉ việc đọc chứ không phải tính lại theo cấu hình hiện thời.
 */
export async function ghiHangMuc(khachId: string, dichVu: string[], moc: Date) {
  if (!dichVu.length) return;
  const { data: cf } = await db().from("bao_hanh_dich_vu").select("dich_vu, so_thang");
  const thang = new Map<string, number>((cf ?? []).map((r) => [r.dich_vu, r.so_thang]));

  const rows = dichVu.map((dv) => {
    const n = thang.get(dv) ?? BAO_HANH_MAC_DINH;
    const het = hanBaoHanh(moc, n);
    return {
      khach_hang_id: khachId,
      dich_vu: dv,
      bh_so_thang: n,
      bh_het_han: het.toISOString().slice(0, 10),
    };
  });
  await db().from("don_hang_muc").insert(rows);
}
