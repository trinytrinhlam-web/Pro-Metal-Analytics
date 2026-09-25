import {
  DICH_VU, LOAI_CONG_TRINH, LY_DO_TU_CHOI, KHU_VUC, boDau, chuanSdt,
} from "./danh-muc.ts";

/**
 * Hỏi Gemini: nghe (hoặc đọc) lời thợ kể rồi trả về các ô của form.
 *
 * Dùng chung cho hai chỗ: thợ ghi âm ở màn nhập, và nút "Kiểm tra" ở màn admin
 * — để bài kiểm tra chạy đúng đoạn code thợ đang dùng, không phải một bản sao.
 */

export type CauHinhAI = { key: string; model: string; ver: string; goc: string };

export function cauHinhAI(env: Record<string, string | undefined> = process.env): CauHinhAI | null {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  return {
    key,
    // Google đổi tên model xoành xoạch và tên cũ là chết hẳn chứ không chạy tạm.
    // Đổi được bằng biến môi trường GEMINI_MODEL, khỏi phải sửa code deploy lại.
    model: env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
    ver: env.GEMINI_API_VERSION?.trim() || "v1beta",
    // Chỉ để kiểm thử trên máy dev: trỏ sang một máy chủ giả thay cho Google.
    goc: (env.GEMINI_API_BASE?.trim() || "https://generativelanguage.googleapis.com").replace(/\/+$/, ""),
  };
}

export const HUONG_DAN = `Bạn đang nghe một người thợ cửa sắt ở TP.HCM đọc lại thông tin khách vừa gọi tới.
Nghe rồi điền vào JSON theo đúng mẫu.

Quy tắc:
- Nghe được gì điền nấy. KHÔNG đoán. Không nghe ra thì để null.
- ten: tên khách, giữ cả cách gọi nếu thợ đọc ("Chị Lan", "Anh Hùng").
- gioi_tinh: "anh", "chú", "ông" là nam; "chị", "cô", "bà" là nu. Không rõ thì null.
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

// Kiểu viết HOA theo đúng tài liệu REST của Gemini. Enum chuỗi kèm format "enum"
// như ví dụ trong tài liệu.
const chuoi = (extra: Record<string, unknown> = {}) => ({ type: "STRING", ...extra });
const chon = (ds: readonly string[], nullable = true) =>
  chuoi({ format: "enum", enum: [...ds], ...(nullable ? { nullable: true } : {}) });

export const SCHEMA = {
  type: "OBJECT",
  properties: {
    ten: chuoi({ nullable: true }),
    so_dien_thoai: chuoi({ nullable: true }),
    gioi_tinh: chon(["nam", "nu"]),
    dich_vu: { type: "ARRAY", items: chon(DICH_VU, false) },
    khu_vuc: chuoi({ nullable: true }),
    loai_cong_trinh: chon(LOAI_CONG_TRINH),
    trang_thai: chon(["hoi_gia", "da_chot", "tu_choi"], false),
    ly_do_tu_choi: chon(LY_DO_TU_CHOI),
    doanh_thu: { type: "NUMBER", nullable: true },
    loi_doc: chuoi(),
  },
  required: ["trang_thai", "loi_doc"],
};

export type KetQuaAI = {
  ten: string | null;
  so_dien_thoai: string | null;
  gioi_tinh: "nam" | "nu" | null;
  dich_vu: string[];
  khu_vuc: string | null;
  loai_cong_trinh: string | null;
  trang_thai: "hoi_gia" | "da_chot" | "tu_choi";
  ly_do_tu_choi: string | null;
  doanh_thu: number | null;
  loi_doc: string;
};

export type TraLoiAI =
  | { ok: true; ket_qua: KetQuaAI; duPhong: boolean; ms: number }
  /** cau-hinh: sai khoá / sai tên model — bấm lại mấy cũng vậy.
   *  tam-thoi: mạng, quá tải, hết lượt — lát thử lại được.
   *  kho-hieu: Gemini trả lời nhưng không ra JSON. */
  | { ok: false; loai: "cau-hinh" | "tam-thoi" | "kho-hieu"; status: number; chiTiet: string; ms: number };

/** Gemini nghe được "gò vấp" thì khớp về đúng tên trong danh mục 168 phường xã. */
export function khopKhuVuc(x: string | null | undefined): string | null {
  if (!x) return null;
  const q = boDau(String(x).replace(/^(phường|xã|quận|huyện|p\.|q\.)\s*/i, "").trim());
  if (!q) return null;
  return KHU_VUC.find((k) => boDau(k) === q) ?? KHU_VUC.find((k) => boDau(k).includes(q)) ?? null;
}

/** Bóc JSON khỏi câu trả lời — đôi khi model bọc thêm ```json ... ```. */
export function docTraLoi(raw: string): Record<string, unknown> | null {
  try {
    const j = JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "").trim());
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Không tin gì Gemini trả về: mọi ô đều kiểm lại theo danh mục trước khi điền vào form. */
export function chuanHoa(j: Record<string, unknown>): KetQuaAI {
  const sdt = chuanSdt(String(j.so_dien_thoai ?? ""));
  const trong = <T extends string>(ds: readonly T[], v: unknown): T | null =>
    ds.includes(v as T) ? (v as T) : null;
  const tien = typeof j.doanh_thu === "number" ? j.doanh_thu : Number(String(j.doanh_thu ?? "").replace(/\D/g, ""));
  return {
    ten: typeof j.ten === "string" && j.ten.trim() ? j.ten.trim() : null,
    so_dien_thoai: sdt.length >= 9 ? sdt : null,
    gioi_tinh: trong(["nam", "nu"] as const, j.gioi_tinh),
    dich_vu: Array.isArray(j.dich_vu) ? [...new Set((j.dich_vu as unknown[]).filter((d): d is string => DICH_VU.includes(d as string)))] : [],
    khu_vuc: khopKhuVuc(j.khu_vuc as string),
    loai_cong_trinh: trong(LOAI_CONG_TRINH, j.loai_cong_trinh),
    trang_thai: trong(["hoi_gia", "da_chot", "tu_choi"] as const, j.trang_thai) ?? "hoi_gia",
    ly_do_tu_choi: trong(LY_DO_TU_CHOI, j.ly_do_tu_choi),
    doanh_thu: Number.isFinite(tien) && tien > 0 ? Math.round(tien) : null,
    loi_doc: typeof j.loi_doc === "string" ? j.loi_doc.trim() : "",
  };
}

export async function hoiGemini(
  ch: CauHinhAI,
  vao: { amThanh?: { mime: string; b64: string }; chu?: string },
  hetGio = 45_000
): Promise<TraLoiAI> {
  const batDau = Date.now();
  const url = `${ch.goc}/${ch.ver}/models/${encodeURIComponent(ch.model)}:generateContent`;
  const parts: Record<string, unknown>[] = [{ text: HUONG_DAN }];
  if (vao.chu) parts.push({ text: `Lời thợ đọc (đã chép ra chữ): ${vao.chu}` });
  if (vao.amThanh) parts.push({ inlineData: { mimeType: vao.amThanh.mime, data: vao.amThanh.b64 } });

  const goi = (kemSchema: boolean) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": ch.key },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(kemSchema ? { responseSchema: SCHEMA } : {}),
          temperature: 0,
        },
      }),
      signal: AbortSignal.timeout(hetGio),
    });

  let res: Response;
  let duPhong = false;
  try {
    res = await goi(true);
    // Phòng khi Google đổi luật về khuôn mẫu: thử lại không kèm khuôn, vẫn ra
    // JSON nhờ responseMimeType. Ghi log để còn biết mà sửa.
    if (res.status === 400) {
      const loi400 = await res.text().catch(() => "");
      const lai = await goi(false);
      if (lai.ok) {
        console.error("Gemini từ chối responseSchema, đang chạy không khuôn:", loi400.slice(0, 300));
        duPhong = true;
      }
      res = lai.ok ? lai : new Response(loi400, { status: 400 });
    }
  } catch (e) {
    return { ok: false, loai: "tam-thoi", status: 0, chiTiet: String(e).slice(0, 200), ms: Date.now() - batDau };
  }

  if (!res.ok) {
    const chiTiet = (await res.text().catch(() => "")).slice(0, 400);
    const cauHinh = [400, 401, 403, 404].includes(res.status);
    return { ok: false, loai: cauHinh ? "cau-hinh" : "tam-thoi", status: res.status, chiTiet, ms: Date.now() - batDau };
  }

  const kq = (await res.json().catch(() => null)) as
    | { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] }
    | null;
  const raw = kq?.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
  const j = docTraLoi(raw);
  if (!j) return { ok: false, loai: "kho-hieu", status: 200, chiTiet: raw.slice(0, 300), ms: Date.now() - batDau };
  return { ok: true, ket_qua: chuanHoa(j), duPhong, ms: Date.now() - batDau };
}
