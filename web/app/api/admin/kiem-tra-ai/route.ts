import { NextResponse } from "next/server";
import { chanAdmin } from "@/lib/quyen";
import { cauHinhAI, hoiGemini, type KetQuaAI } from "@/lib/giong-noi";
import { dongWav, TAN_SO_GUI } from "@/lib/wav";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Bấm một nút là biết phần đọc bằng giọng nói có chạy thật không — chạy đúng
 * đoạn code thợ dùng, bằng khoá thật trên Vercel. Ba bước, hỏng bước nào nói
 * rõ bước đó và sửa ở đâu:
 *
 *   1. Khoá dùng được và tên model có thật
 *   2. Gemini hiểu đúng một câu thợ đọc mẫu (số điện thoại đọc rời, "bốn triệu tám"…)
 *   3. Gemini nhận file ghi âm WAV — đúng loại file máy thợ gửi lên
 *
 * KHÔNG trả khoá về cho trình duyệt, kể cả một phần.
 */

const CAU_MAU =
  "Chị Lan, không chín không chín, một hai ba, bốn năm sáu. Sửa cửa kéo, ở Gò Vấp, nhà phố. Khách chốt rồi, bốn triệu tám.";

const MONG: { ten: string; o: keyof KetQuaAI; mong: string; chinh: boolean; dung: (k: KetQuaAI) => boolean; hien: (k: KetQuaAI) => string }[] = [
  { ten: "Số điện thoại", o: "so_dien_thoai", mong: "0909123456", chinh: true, dung: (k) => k.so_dien_thoai === "0909123456", hien: (k) => k.so_dien_thoai ?? "(trống)" },
  { ten: "Tiền công", o: "doanh_thu", mong: "4.800.000đ", chinh: true, dung: (k) => k.doanh_thu === 4_800_000, hien: (k) => (k.doanh_thu ? `${k.doanh_thu.toLocaleString("vi-VN")}đ` : "(trống)") },
  { ten: "Dịch vụ", o: "dich_vu", mong: "Sửa cửa kéo", chinh: true, dung: (k) => k.dich_vu.includes("Sửa cửa kéo"), hien: (k) => k.dich_vu.join(", ") || "(trống)" },
  { ten: "Kết quả", o: "trang_thai", mong: "Đã chốt", chinh: true, dung: (k) => k.trang_thai === "da_chot", hien: (k) => ({ da_chot: "Đã chốt", hoi_gia: "Hỏi giá", tu_choi: "Từ chối" })[k.trang_thai] },
  { ten: "Phường / xã", o: "khu_vuc", mong: "Gò Vấp", chinh: false, dung: (k) => k.khu_vuc === "Gò Vấp", hien: (k) => k.khu_vuc ?? "(trống)" },
  { ten: "Tên khách", o: "ten", mong: "Chị Lan", chinh: false, dung: (k) => /lan/i.test(k.ten ?? ""), hien: (k) => k.ten ?? "(trống)" },
  { ten: "Giới tính", o: "gioi_tinh", mong: "Nữ", chinh: false, dung: (k) => k.gioi_tinh === "nu", hien: (k) => (k.gioi_tinh === "nu" ? "Nữ" : k.gioi_tinh === "nam" ? "Nam" : "(trống)") },
  { ten: "Loại công trình", o: "loai_cong_trinh", mong: "Nhà phố", chinh: false, dung: (k) => k.loai_cong_trinh === "Nhà phố", hien: (k) => k.loai_cong_trinh ?? "(trống)" },
];

type Buoc = { ten: string; ok: boolean | null; chu: string };

const giay = (ms: number) => `${(ms / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giây`;

export async function GET() {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const ch = cauHinhAI();
  if (!ch) {
    return NextResponse.json({
      xong: false,
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      chu: "Chưa có khoá GEMINI_API_KEY.",
      chiTiet:
        "Vào Vercel → Settings → Environment Variables, thêm tên biến GEMINI_API_KEY " +
        "và dán khoá vào ô Value, rồi Redeploy. Chưa có khoá thì nút ghi âm của thợ ẩn đi, " +
        "mọi thứ khác vẫn chạy bình thường.",
      buoc: [],
    });
  }

  const buoc: Buoc[] = [];
  const ket = (chu: string, chiTiet: string, them: Record<string, unknown> = {}) =>
    NextResponse.json({ xong: false, model: ch.model, chu, chiTiet, buoc, ...them });

  // ── 1. khoá + model ──
  try {
    const res = await fetch(`${ch.goc}/${ch.ver}/models/${encodeURIComponent(ch.model)}`, {
      headers: { "x-goog-api-key": ch.key },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      console.error("kiem-tra-ai: model", res.status, raw.slice(0, 300));
      buoc.push({ ten: "Khoá và tên model", ok: false, chu: `Google trả mã ${res.status}` });
      if (res.status === 404) {
        return ket(`Không có model tên "${ch.model}".`,
          "Google đã đổi tên model. Vào Vercel → Settings → Environment Variables, sửa biến " +
          "GEMINI_MODEL thành tên model mới (xem aistudio.google.com), rồi Redeploy. Không phải sửa code.");
      }
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return ket("Khoá không dùng được.",
          "Khoá sai, đã bị xoá, hoặc chưa bật Generative Language API. Lấy khoá mới ở " +
          "aistudio.google.com → Get API key, thay vào Vercel rồi Redeploy. Nhớ: ô Key là tên biến " +
          "GEMINI_API_KEY, khoá dán vào ô Value.");
      }
      if (res.status === 429) {
        return ket("Khoá đúng nhưng đang bị chặn vì gọi quá nhiều.",
          "Đợi ít phút rồi thử lại. Gói miễn phí có giới hạn số lần gọi mỗi phút.");
      }
      return ket("Google trả về lỗi lạ.", `Mã lỗi ${res.status}. Thử lại sau vài phút.`);
    }
    buoc.push({ ten: "Khoá và tên model", ok: true, chu: `Khoá hợp lệ, model ${ch.model} có thật` });
  } catch (e) {
    console.error("kiem-tra-ai: khong goi duoc", e);
    buoc.push({ ten: "Khoá và tên model", ok: false, chu: "Không gọi tới Google được" });
    return ket("Không gọi tới Google được.", "Mạng của máy chủ đang trục trặc. Thử lại sau ít phút.");
  }

  // ── 2. hiểu lời thợ đọc ──
  const t2 = await hoiGemini(ch, { chu: CAU_MAU });
  if (!t2.ok) {
    console.error("kiem-tra-ai: doc cau mau", t2.loai, t2.status, t2.chiTiet);
    buoc.push({ ten: "Hiểu lời thợ đọc", ok: false, chu: t2.loai === "kho-hieu" ? "Gemini trả lời nhưng không ra dạng dữ liệu" : `Google trả mã ${t2.status}` });
    return ket(
      t2.loai === "tam-thoi" ? "Gemini đang quá tải hoặc hết lượt." : "Gemini không làm được việc điền form.",
      t2.loai === "tam-thoi"
        ? "Thử lại sau vài phút."
        : "Thử đổi GEMINI_MODEL sang một model Flash khác trên Vercel rồi Redeploy, sau đó bấm kiểm tra lại."
    );
  }
  const cot = MONG.map((m) => ({ ten: m.ten, mong: m.mong, duoc: m.hien(t2.ket_qua), dung: m.dung(t2.ket_qua), chinh: m.chinh }));
  const saiChinh = cot.filter((c) => c.chinh && !c.dung);
  const saiPhu = cot.filter((c) => !c.chinh && !c.dung);
  buoc.push({
    ten: "Hiểu lời thợ đọc",
    ok: saiChinh.length === 0,
    chu: saiChinh.length
      ? `Điền sai ${saiChinh.map((c) => c.ten.toLowerCase()).join(", ")}`
      : `Điền đúng ${cot.filter((c) => c.dung).length}/${cot.length} ô, trả lời trong ${giay(t2.ms)}` +
        (t2.duPhong ? " (đang chạy chế độ dự phòng)" : ""),
  });

  // ── 3. nhận file ghi âm WAV ──
  const im = dongWav(new Float32Array(TAN_SO_GUI)); // 1 giây im lặng, đúng khuôn máy thợ gửi
  const t3 = await hoiGemini(ch, { amThanh: { mime: "audio/wav", b64: Buffer.from(im).toString("base64") } });
  const nhanFile = t3.ok || t3.loai === "kho-hieu";
  if (!t3.ok) console.error("kiem-tra-ai: file wav", t3.loai, t3.status, t3.chiTiet);
  buoc.push({
    ten: "Nhận file ghi âm",
    ok: nhanFile,
    chu: nhanFile ? `Nhận file WAV, trả lời trong ${giay(t3.ms)}` : `Google trả mã ${t3.status} khi gửi file ghi âm`,
  });

  const xong = saiChinh.length === 0 && nhanFile;
  return NextResponse.json({
    xong,
    model: ch.model,
    chu: xong ? "Chạy được." : !nhanFile ? "Gemini không nhận file ghi âm." : "Gemini điền sai câu mẫu.",
    chiTiet: xong
      ? `Thợ bấm micro là đọc được.${saiPhu.length ? ` Mấy ô phụ (${saiPhu.map((c) => c.ten.toLowerCase()).join(", ")}) đôi khi điền chưa đúng — thợ soát lại trước khi lưu là được.` : ""}`
      : !nhanFile
        ? "Thử đổi GEMINI_MODEL sang một model Flash khác trên Vercel rồi Redeploy, sau đó bấm kiểm tra lại."
        : "Model này nghe số điện thoại hoặc số tiền chưa chuẩn. Thử đổi GEMINI_MODEL sang model Flash mới hơn rồi kiểm tra lại.",
    buoc,
    mau: { cau: CAU_MAU, cot },
  });
}
