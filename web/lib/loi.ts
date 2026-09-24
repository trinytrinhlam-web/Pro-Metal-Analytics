import { NextResponse } from "next/server";

/**
 * Mã lỗi nghĩa là "database chưa có cột / bảng mà code đang cần" — tức là đã
 * deploy code mới mà quên chạy file migration.
 *   PGRST204 / PGRST205 — PostgREST không thấy cột / bảng trong schema cache
 *   42703 / 42P01       — Postgres: undefined_column / undefined_table
 */
export const MA_THIEU_MIGRATION = new Set(["PGRST204", "PGRST205", "42703", "42P01"]);

/** Lỗi này có phải do database chưa chạy migration không. */
export function laThieuMigration(x: unknown): boolean {
  return MA_THIEU_MIGRATION.has(maLoi(x));
}

function maLoi(x: unknown): string {
  return typeof x === "object" && x !== null && "code" in x ? String((x as { code: unknown }).code) : "";
}

/**
 * Lỗi kỹ thuật ghi vào log của máy chủ, còn thợ chỉ thấy một câu tiếng Việt
 * dễ hiểu. Đừng bao giờ ném thẳng message của database ra màn hình: thợ không
 * làm gì được với nó, mà nó lại để lộ cấu trúc bên trong.
 *
 * Riêng lỗi thiếu migration thì phải nói thẳng ra. Câu "máy chủ trục trặc"
 * khiến người ta ngồi đợi, mà đợi bao lâu cũng không tự hết — phải có người
 * vào Supabase chạy file SQL. Một ngày thợ không lưu được đơn nào là mất dữ
 * liệu thật, nên ở đây nói rõ hơn quan trọng hơn là giấu chi tiết kỹ thuật.
 */
export function loiHeThong(noiDung: string, chiTiet: unknown) {
  console.error(`[${noiDung}]`, chiTiet);

  if (laThieuMigration(chiTiet)) {
    return NextResponse.json(
      {
        loi:
          "Phần mềm vừa lên bản mới nhưng database chưa cập nhật theo. " +
          "Báo chủ tiệm chạy file 0002_phan_tich.sql trong Supabase giúp — " +
          "xong là lưu được ngay, không mất đơn nào.",
        thieuMigration: true,
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { loi: "Máy chủ đang trục trặc. Thử lại sau ít phút giúp." },
    { status: 500 }
  );
}
