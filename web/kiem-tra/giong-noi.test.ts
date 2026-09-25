/** node --experimental-strip-types --test kiem-tra/giong-noi.test.ts */
import assert from "node:assert/strict";
import test from "node:test";
import { cauHinhAI, chuanHoa, docTraLoi, khopKhuVuc, SCHEMA } from "../lib/giong-noi.ts";
import { docDauWav, dongWav, haTanSo } from "../lib/wav.ts";

test("WAV đóng đúng khuôn: RIFF/WAVE, PCM 16 bit, một kênh, 16 kHz", () => {
  const f = dongWav(new Float32Array(16000));
  assert.equal(f.length, 44 + 32000);
  assert.deepEqual(docDauWav(f), { tanSo: 16000, kenh: 1, bit: 16, giay: 1 });
});

test("WAV: mẫu vượt ngưỡng bị kẹp, không tràn số", () => {
  const f = dongWav(new Float32Array([2, -2, 0.5]));
  const v = new DataView(f.buffer);
  assert.equal(v.getInt16(44, true), 32767);
  assert.equal(v.getInt16(46, true), -32768);
  assert.equal(v.getInt16(48, true), Math.trunc(0.5 * 0x7fff));
});

test("hạ tần số 48 kHz → 16 kHz: độ dài chia 3, giữ nguyên mức tín hiệu", () => {
  const vao = new Float32Array(48000).fill(0.25);
  const ra = haTanSo(vao, 48000);
  assert.equal(ra.length, 16000);
  assert.ok(ra.every((x) => Math.abs(x - 0.25) < 1e-6));
  assert.equal(haTanSo(new Float32Array(44100), 44100).length, 16000);
});

test("đọc đầu WAV: file rác, file cụt đều trả null", () => {
  assert.equal(docDauWav(new Uint8Array(10)), null);
  assert.equal(docDauWav(new TextEncoder().encode("x".repeat(60))), null);
});

test("khuôn gửi Gemini viết HOA kiểu dữ liệu, đúng tài liệu REST", () => {
  assert.equal(SCHEMA.type, "OBJECT");
  for (const [k, v] of Object.entries(SCHEMA.properties)) {
    assert.match((v as { type: string }).type, /^[A-Z]+$/, `ô ${k}`);
  }
  assert.equal(SCHEMA.properties.dich_vu.items.type, "STRING");
});

test("bóc JSON khỏi câu trả lời có bọc ```json", () => {
  assert.deepEqual(docTraLoi('```json\n{"ten":"Chị Lan"}\n```'), { ten: "Chị Lan" });
  assert.deepEqual(docTraLoi(' {"a":1} '), { a: 1 });
  assert.equal(docTraLoi("xin lỗi, tôi không nghe rõ"), null);
  assert.equal(docTraLoi("[1,2]"), null);
});

test("chuẩn hoá: không tin gì Gemini trả về, mọi ô kiểm lại theo danh mục", () => {
  const k = chuanHoa({
    ten: "  Chị Lan ",
    so_dien_thoai: "0909 123 456",
    gioi_tinh: "female",
    dich_vu: ["Sửa cửa kéo", "Sửa cửa kéo", "Sơn nhà"],
    khu_vuc: "quận gò vấp",
    loai_cong_trinh: "Biệt thự",
    trang_thai: "chot",
    ly_do_tu_choi: "Giá cao",
    doanh_thu: "4.800.000",
    loi_doc: "chị Lan...",
  });
  assert.equal(k.ten, "Chị Lan");
  assert.equal(k.so_dien_thoai, "0909123456");
  assert.equal(k.gioi_tinh, null, "giá trị ngoài danh mục thì bỏ");
  assert.deepEqual(k.dich_vu, ["Sửa cửa kéo"], "bỏ trùng, bỏ dịch vụ lạ");
  assert.equal(k.khu_vuc, "Gò Vấp");
  assert.equal(k.loai_cong_trinh, null);
  assert.equal(k.trang_thai, "hoi_gia", "trạng thái lạ thì về hỏi giá");
  assert.equal(k.doanh_thu, 4_800_000, "tiền dạng chữ có dấu chấm vẫn đọc được");
});

test("chuẩn hoá: số điện thoại quá ngắn và tiền âm thì bỏ trống", () => {
  const k = chuanHoa({ so_dien_thoai: "0909", doanh_thu: -5, trang_thai: "da_chot", loi_doc: 3 });
  assert.equal(k.so_dien_thoai, null);
  assert.equal(k.doanh_thu, null);
  assert.equal(k.trang_thai, "da_chot");
  assert.equal(k.loi_doc, "");
});

test("khớp phường xã: gõ tắt, không dấu, kèm chữ 'phường' vẫn ra", () => {
  assert.equal(khopKhuVuc("phường Bến Thành"), "Bến Thành");
  assert.equal(khopKhuVuc("go vap"), "Gò Vấp");
  assert.equal(khopKhuVuc(""), null);
  assert.equal(khopKhuVuc("sao hoả"), null);
});

test("cấu hình: không khoá thì tắt, có khoá thì dùng model mặc định", () => {
  assert.equal(cauHinhAI({}), null);
  assert.equal(cauHinhAI({ GEMINI_API_KEY: "   " }), null);
  const c = cauHinhAI({ GEMINI_API_KEY: " k ", GEMINI_API_BASE: "http://x/" });
  assert.deepEqual(c, { key: "k", model: "gemini-3.8-flash", ver: "v1beta", goc: "http://x" });
  assert.equal(cauHinhAI({ GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-3.5-flash" })?.model, "gemini-3.5-flash");
});
