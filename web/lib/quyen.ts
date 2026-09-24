import { NextResponse } from "next/server";
import { phienHienTai, type Phien } from "./phien";

/** Dùng ở đầu mọi route của admin. Trả về phiên, hoặc câu trả lời từ chối. */
export async function chanAdmin(): Promise<{ phien: Phien } | { tra: NextResponse }> {
  const phien = await phienHienTai();
  if (!phien) return { tra: NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 }) };
  if (phien.vaiTro !== "admin") {
    return { tra: NextResponse.json({ loi: "Phần này chỉ dành cho admin." }, { status: 403 }) };
  }
  return { phien };
}
