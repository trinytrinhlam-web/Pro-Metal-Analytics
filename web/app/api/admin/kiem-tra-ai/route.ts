import { NextResponse } from "next/server";
import { chanAdmin } from "@/lib/quyen";

/**
 * Bấm một nút là biết phần đọc bằng giọng nói đã cài đúng chưa.
 *
 * Không có cái này thì cách duy nhất để thử là bảo thợ ghi âm rồi đoán xem vì
 * sao hỏng — khoá sai, tên model sai, hay hết hạn mức đều ra cùng một câu báo
 * lỗi. Ở đây hỏi thẳng Gemini xem model có thật không: nhẹ, không tốn token,
 * và phân biệt được từng nguyên nhân.
 *
 * KHÔNG trả khoá về cho trình duyệt, kể cả một phần.
 */
export async function GET() {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const ver = process.env.GEMINI_API_VERSION || "v1beta";

  if (!key) {
    return NextResponse.json({
      xong: false,
      model,
      chu: "Chưa có khoá GEMINI_API_KEY.",
      chiTiet:
        "Vào Vercel → Settings → Environment Variables, thêm tên biến GEMINI_API_KEY " +
        "và dán khoá vào ô Value, rồi Redeploy. Chưa có khoá thì nút ghi âm của thợ ẩn đi, " +
        "mọi thứ khác vẫn chạy bình thường.",
    });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(model)}`,
      { headers: { "x-goog-api-key": key }, cache: "no-store" }
    );

    if (res.ok) {
      return NextResponse.json({
        xong: true,
        model,
        chu: "Chạy được.",
        chiTiet: `Khoá hợp lệ và model ${model} dùng được. Thợ bấm nút micro là đọc được.`,
      });
    }

    const raw = await res.text().catch(() => "");
    console.error("kiem-tra-ai:", res.status, raw.slice(0, 300));

    const chu =
      res.status === 404
        ? `Không có model tên "${model}".`
        : res.status === 400 || res.status === 403
          ? "Khoá không dùng được."
          : res.status === 429
            ? "Khoá đúng nhưng đang bị chặn vì gọi quá nhiều."
            : "Google trả về lỗi lạ.";

    const chiTiet =
      res.status === 404
        ? "Google đã đổi tên model. Vào Vercel → Settings → Environment Variables, " +
          "sửa biến GEMINI_MODEL thành tên model mới (xem aistudio.google.com), rồi Redeploy. " +
          "Không phải sửa code."
        : res.status === 400 || res.status === 403
          ? "Khoá sai, đã bị xoá, hoặc chưa bật Generative Language API. " +
            "Lấy khoá mới ở aistudio.google.com → Get API key, thay vào Vercel rồi Redeploy."
          : res.status === 429
            ? "Đợi ít phút rồi thử lại. Gói miễn phí có giới hạn số lần gọi mỗi phút."
            : `Mã lỗi ${res.status}. Thử lại sau, hoặc đổi GEMINI_MODEL sang model khác.`;

    return NextResponse.json({ xong: false, model, chu, chiTiet });
  } catch (e) {
    console.error("kiem-tra-ai: khong goi duoc", e);
    return NextResponse.json({
      xong: false,
      model,
      chu: "Không gọi tới Google được.",
      chiTiet: "Mạng của máy chủ đang trục trặc. Thử lại sau ít phút.",
    });
  }
}
