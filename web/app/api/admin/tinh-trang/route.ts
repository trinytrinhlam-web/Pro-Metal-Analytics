import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chanAdmin } from "@/lib/quyen";
import { laThieuMigration } from "@/lib/loi";

/**
 * Database đã chạy đủ migration chưa.
 *
 * Người thấy lỗi là thợ, người sửa được lại là chủ tiệm — nên nếu chỉ báo ở
 * màn thợ thì phải chờ thợ gọi điện mách. Kiểm ở đây để chủ tiệm mở admin lên
 * là thấy ngay.
 *
 * Cách kiểm: đọc thử đúng một dòng có cột mà migration thêm vào. Cột chưa có
 * thì PostgREST trả lỗi ngay, không đụng gì tới dữ liệu.
 */
const CAN_CO: { cot: string; file: string; them: string }[] = [
  { cot: "la_khach_cu", file: "0002_phan_tich.sql", them: "phân biệt khách mới / khách cũ" },
];

export async function GET() {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const thieu: { file: string; them: string }[] = [];
  for (const m of CAN_CO) {
    const { error } = await db().from("khach_hang").select(m.cot).limit(1);
    if (!error) continue;
    console.error("tinh-trang:", m.cot, error);
    // Chỉ lỗi "không có cột" mới là thiếu migration. Mất mạng hay Supabase
    // đang sập cũng trả về lỗi ở đây — bắt nhầm là dựng cảnh báo đỏ bảo người
    // ta đi chạy SQL trong khi chẳng có gì để chạy.
    if (laThieuMigration(error)) thieu.push({ file: m.file, them: m.them });
    else return NextResponse.json({ oK: true, thieu: [], khongKiemDuoc: true });
  }
  return NextResponse.json({ oK: thieu.length === 0, thieu });
}
