import { NextResponse } from "next/server";
import { phienHienTai } from "@/lib/phien";
import {
  DICH_VU, LOAI_CONG_TRINH, LY_DO_TU_CHOI, KHU_VUC, boDau, chuanSdt,
} from "@/lib/danh-muc";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Thợ đọc → Gemini nghe → trả JSON điền sẵn vào form.
 *
 * File ghi âm KHÔNG được lưu ở đâu cả: nó đi thẳng từ máy thợ qua route này
 * tới Gemini rồi bị bỏ ngay khi trả lời xong. Không có file nào nằm lại trên
 * máy chủ, nên cũng không cần cơ chế dọn dẹp.
 */
const HUONG_DAN = `Bạn đang nghe một người thợ cửa sắt ở TP.HCM đọc lại thông tin khách vừa gọi tới.
Nghe rồi điền vào JSON theo đúng mẫu.

Quy tắc:
- Nghe được gì điền nấy. KHÔNG đoán. Không nghe ra thì để null.
- so_dien_thoai: người Việt đọc số rời từng chữ. Lưu ý dễ lẫn: "năm" và "lăm" đều là 5,
  "không"/"o"/"zero" là 0, "mốt" là 1, "tư" là 4, "bảy"/"bẩy" là 7. Trả về chỉ chữ số,
  bắt đầu bằng 0, đủ 10 số. Không chắc đủ 10 số thì cứ trả phần nghe được.
- doanh_thu: quy ra số đồng. "bốn triệu tám" = 4800000, "tám trăm nghìn" = 800000,
  "hai chậu rưỡi" hay "hai triệu rưỡi" = 2500000.
- dich_vu: chỉ chọn trong danh sách cho sẵn, chọn được nhiều.
- khu_vuc: ghi nguyên tên nơi thợ đọc (phường, xã, hoặc tên quận cũ), không tự sửa.
- trang_thai: "da_chot" nếu khách đồng ý làm, "tu_choi" nếu khách không làm,
  còn lại là "hoi_gia".
- loi_doc: chép lại nguyên văn câu thợ vừa đọc.`;

const SCHEMA = {
  type: "object",
  properties: {
    ten: { type: "string", nullable: true },
    so_dien_thoai: { type: "string", nullable: true },
    gioi_tinh: { type: "string", enum: ["nam", "nu"], nullable: true },
    dich_vu: { type: "array", items: { type: "string", enum: [...DICH_VU] } },
    khu_vuc: { type: "string", nullable: true },
    loai_cong_trinh: { type: "string", enum: [...LOAI_CONG_TRINH], nullable: true },
    trang_thai: { type: "string", enum: ["hoi_gia", "da_chot", "tu_choi"] },
    ly_do_tu_choi: { type: "string", enum: [...LY_DO_TU_CHOI], nullable: true },
    doanh_thu: { type: "number", nullable: true },
    loi_doc: { type: "string" },
  },
  required: ["trang_thai", "loi_doc"],
};

/** Gemini nghe được "gò vấp" thì khớp về đúng tên trong danh mục 168 phường xã. */
function khopKhuVuc(x: string | null | undefined): string | null {
  if (!x) return null;
  const q = boDau(String(x).replace(/^(phường|xã|quận|huyện|p\.|q\.)\s*/i, "").trim());
  if (!q) return null;
  return (
    KHU_VUC.find((k) => boDau(k) === q) ??
    KHU_VUC.find((k) => boDau(k).includes(q)) ??
    null
  );
}

export async function POST(req: Request) {
  const phien = await phienHienTai();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập." }, { status: 401 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      // Thợ không cần biết tên biến môi trường là gì.
      { loi: "Phần đọc bằng giọng nói chưa bật. Nhập tay giúp nhé." },
      { status: 503 }
    );
  }

  const kieu = req.headers.get("content-type") || "audio/webm";
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return NextResponse.json({ loi: "Không nhận được tiếng." }, { status: 400 });
  if (buf.length > 12 * 1024 * 1024) {
    return NextResponse.json({ loi: "Đoạn ghi âm dài quá, đọc ngắn lại giúp." }, { status: 413 });
  }

  // Google đổi tên model xoành xoạch và tên cũ là chết hẳn chứ không chạy tạm.
  // Đổi được bằng biến môi trường GEMINI_MODEL, khỏi phải sửa code deploy lại.
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const ver = process.env.GEMINI_API_VERSION || "v1beta";
  const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent`;

  const goi = (kemSchema: boolean) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: HUONG_DAN },
              { inlineData: { mimeType: kieu.split(";")[0], data: buf.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          ...(kemSchema ? { responseSchema: SCHEMA } : {}),
          temperature: 0,
        },
      }),
    });

  // Một số phiên bản API không nhận responseSchema — hỏng thì thử lại không kèm.
  let res = await goi(true);
  if (!res.ok && res.status === 400) res = await goi(false);
  if (!res.ok) {
    const chiTiet = await res.text().catch(() => "");
    console.error("Gemini lỗi", res.status, chiTiet.slice(0, 400));
    // 400/403/404 là sai khoá hoặc sai tên model — tức là cấu hình sai, chứ
    // không phải mạng chập chờn. Thợ bấm lại mười lần cũng vậy thôi, nên nói
    // khác đi để còn biết đường báo chủ tiệm.
    const saiCauHinh = res.status === 400 || res.status === 403 || res.status === 404;
    return NextResponse.json(
      {
        loi: saiCauHinh
          ? "Phần đọc bằng giọng nói chưa cài đúng. Báo chủ tiệm kiểm tra lại, tạm thời nhập tay giúp."
          : "Máy không nghe được lúc này, bạn nhập tay giúp.",
      },
      { status: 502 }
    );
  }

  const kq = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = kq.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    console.error("Gemini trả về không phải JSON:", raw.slice(0, 300));
    return NextResponse.json({ loi: "Máy nghe xong nhưng trả về khó hiểu, nhập tay giúp." }, { status: 502 });
  }

  const sdt = chuanSdt(String(j.so_dien_thoai ?? ""));
  const dichVu = Array.isArray(j.dich_vu)
    ? (j.dich_vu as string[]).filter((d) => DICH_VU.includes(d))
    : [];

  return NextResponse.json({
    ket_qua: {
      ten: (j.ten as string) || null,
      so_dien_thoai: sdt.length >= 9 ? sdt : null,
      gioi_tinh: j.gioi_tinh === "nam" || j.gioi_tinh === "nu" ? j.gioi_tinh : null,
      dich_vu: dichVu,
      khu_vuc: khopKhuVuc(j.khu_vuc as string),
      loai_cong_trinh: LOAI_CONG_TRINH.includes(j.loai_cong_trinh as string)
        ? (j.loai_cong_trinh as string)
        : null,
      trang_thai: ["hoi_gia", "da_chot", "tu_choi"].includes(j.trang_thai as string)
        ? (j.trang_thai as string)
        : "hoi_gia",
      ly_do_tu_choi: LY_DO_TU_CHOI.includes(j.ly_do_tu_choi as string)
        ? (j.ly_do_tu_choi as string)
        : null,
      doanh_thu: typeof j.doanh_thu === "number" && j.doanh_thu > 0 ? Math.round(j.doanh_thu) : null,
      loi_doc: (j.loi_doc as string) || "",
    },
  });
}
