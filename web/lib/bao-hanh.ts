import { db } from "./db";
import { BAO_HANH_MAC_DINH } from "./danh-muc";
import { hanBaoHanh } from "./ngay";
import type { TrangThai } from "./kieu";

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

/**
 * Đồng bộ hạng mục bảo hành của một đơn.
 *
 * Chỉ đơn **đã chốt** mới có bảo hành — khách mới hỏi giá hay đã từ chối thì
 * chưa làm gì, không có gì để bảo hành. Ghi hạng mục cho cả những đơn đó là
 * hai tháng nữa danh sách "sắp hết hạn" đầy người chưa từng mua, gọi vừa mất
 * công vừa mất mặt.
 *
 * Gọi sau mỗi lần trạng thái hoặc danh sách dịch vụ của đơn đổi. Xoá trước rồi
 * ghi lại, nên đơn từ "đã chốt" đổi về "hỏi giá" là hạng mục biến mất theo.
 */
export async function dongBoHangMuc(
  khachId: string,
  trangThai: TrangThai,
  dichVu: string[],
  moc: Date
) {
  await db().from("don_hang_muc").delete().eq("khach_hang_id", khachId);
  if (trangThai !== "da_chot") return;
  await ghiHangMuc(khachId, dichVu, moc);
}
