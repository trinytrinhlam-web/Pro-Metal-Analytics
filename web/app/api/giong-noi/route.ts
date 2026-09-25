import { NextResponse } from "next/server";
import { phienHienTai } from "@/lib/phien";
import { cauHinhAI, hoiGemini } from "@/lib/giong-noi";
import { docDauWav } from "@/lib/wav";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Thợ đọc → Gemini nghe → trả JSON điền sẵn vào form.
 *
 * File ghi âm KHÔNG được lưu ở đâu cả: nó đi thẳng từ máy thợ qua route này
 * tới Gemini rồi bị bỏ ngay khi trả lời xong. Không có file nào nằm lại trên
 * máy chủ, nên cũng không cần cơ chế dọn dẹp.
 */

// Vercel chặn thân request trên 4,5 MB. Máy thợ ghi WAV 16 kHz, 60 giây chưa tới 2 MB.
const TOI_DA = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const phien = await phienHienTai();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });

  const ch = cauHinhAI();
  if (!ch) {
    // Thợ không cần biết tên biến môi trường là gì.
    return NextResponse.json({ loi: "Phần đọc bằng giọng nói chưa bật. Nhập tay giúp nhé." }, { status: 503 });
  }

  const kieu = (req.headers.get("content-type") || "audio/wav").split(";")[0].trim();
  const buf = new Uint8Array(await req.arrayBuffer());
  if (!buf.length) return NextResponse.json({ loi: "Không nhận được tiếng." }, { status: 400 });
  if (buf.length > TOI_DA) {
    return NextResponse.json({ loi: "Đoạn ghi âm dài quá, đọc ngắn lại giúp." }, { status: 413 });
  }
  if (kieu === "audio/wav") {
    const dau = docDauWav(buf);
    if (!dau) return NextResponse.json({ loi: "File ghi âm bị hỏng, thử đọc lại giúp." }, { status: 400 });
    // Bấm rồi thả ngay: chẳng có gì để nghe, gửi đi chỉ tốn lượt.
    if (dau.giay < 0.6) return NextResponse.json({ loi: "Chưa nghe được gì — bấm micro rồi đọc, xong mới bấm dừng." }, { status: 400 });
  }

  const tl = await hoiGemini(ch, { amThanh: { mime: kieu, b64: Buffer.from(buf).toString("base64") } });
  if (!tl.ok) {
    console.error("Gemini lỗi", tl.loai, tl.status, tl.chiTiet);
    // Sai khoá hay sai tên model là lỗi cấu hình, thợ bấm lại mười lần cũng
    // vậy — nói khác đi để thợ biết đường báo chủ tiệm thay vì thử mãi.
    const loi =
      tl.loai === "cau-hinh"
        ? "Phần đọc bằng giọng nói chưa cài đúng. Báo chủ tiệm kiểm tra lại, tạm thời nhập tay giúp."
        : tl.loai === "kho-hieu"
          ? "Máy nghe xong nhưng trả về khó hiểu, nhập tay giúp."
          : "Máy không nghe được lúc này, bạn nhập tay giúp.";
    return NextResponse.json({ loi }, { status: 502 });
  }
  return NextResponse.json({ ket_qua: tl.ket_qua });
}
