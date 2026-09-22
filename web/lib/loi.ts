import { NextResponse } from "next/server";

/**
 * Lỗi kỹ thuật ghi vào log của máy chủ, còn thợ chỉ thấy một câu tiếng Việt
 * dễ hiểu. Đừng bao giờ ném thẳng message của database ra màn hình: thợ không
 * làm gì được với nó, mà nó lại để lộ cấu trúc bên trong.
 */
export function loiHeThong(noiDung: string, chiTiet: unknown) {
  console.error(`[${noiDung}]`, chiTiet);
  return NextResponse.json(
    { loi: "Máy chủ đang trục trặc. Thử lại sau ít phút giúp." },
    { status: 500 }
  );
}
