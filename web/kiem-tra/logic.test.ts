/**
 * Kiểm thử phần logic thuần — chạy được không cần database.
 *   node --experimental-strip-types kiem-tra/logic.test.ts
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { boDau, chuanSdt, dinhDangSdt, KHU_VUC, KHU_VUC_HAY } from "../lib/danh-muc.ts";
import { bamPin, kiemPin } from "../lib/mat-khau.ts";
import { docToken, taoToken } from "../lib/token.ts";
import { hanBaoHanh } from "../lib/ngay.ts";

process.env.SESSION_SECRET ||= "bi-mat-de-kiem-thu";

test("chuẩn hoá số điện thoại", () => {
  assert.equal(chuanSdt("+84935223864"), "0935223864");   // Google Ads trả dạng quốc tế
  assert.equal(chuanSdt("84935223864"), "0935223864");
  assert.equal(chuanSdt("0935 223 864"), "0935223864");
  assert.equal(chuanSdt("0935-223.864"), "0935223864");
  assert.equal(chuanSdt("935223864"), "0935223864");      // thiếu số 0 đầu
  assert.equal(chuanSdt(""), "");
  assert.equal(chuanSdt("abc"), "");
});

test("hiện số theo cụm cho dễ đọc", () => {
  assert.equal(dinhDangSdt("0935223864"), "0935 223 864");
  assert.equal(dinhDangSdt("09352"), "0935 2");
});

test("bỏ dấu để tìm phường xã", () => {
  assert.equal(boDau("Gò Vấp"), "go vap");
  assert.equal(boDau("Thủ Đức"), "thu duc");
  assert.equal(boDau("Đông Hưng Thuận"), "dong hung thuan");
});

test("danh mục phường xã đúng số lượng và không trùng", () => {
  assert.equal(KHU_VUC.length, 168);
  assert.equal(new Set(KHU_VUC).size, 168);
  // Mọi tên quận cũ hay dùng đều còn tồn tại, nên thợ gõ theo thói quen vẫn ra.
  for (const q of ["Gò Vấp", "Bình Tân", "Tân Phú", "Bình Thạnh", "Thủ Đức", "Hóc Môn", "Bình Chánh"]) {
    assert.ok(KHU_VUC.includes(q), `thiếu ${q}`);
  }
  for (const k of KHU_VUC_HAY) assert.ok(KHU_VUC.includes(k), `gợi ý ${k} không có trong danh mục`);
});

test("mã PIN lưu dạng băm, kiểm lại được", async () => {
  const bam = await bamPin("2580");
  assert.ok(!bam.includes("2580"), "không được lưu PIN trần");
  assert.equal(await kiemPin("2580", bam), true);
  assert.equal(await kiemPin("2581", bam), false);
  // cùng một PIN nhưng hai lần băm phải khác nhau (có muối riêng)
  assert.notEqual(bam, await bamPin("2580"));
});

test("phiên đăng nhập: ký đúng thì đọc được, sửa một chữ là hỏng", () => {
  const t = taoToken({ thoId: "abc", ten: "Anh Hùng", vaiTro: "tho" });
  const p = docToken(t);
  assert.equal(p?.thoId, "abc");
  assert.equal(p?.vaiTro, "tho");
  assert.equal(docToken(t.slice(0, -1) + "z"), null, "chữ ký sai phải bị từ chối");
  assert.equal(docToken("linh tinh"), null);
  assert.equal(docToken(undefined), null);
});

test("phiên hết hạn thì không dùng được nữa", () => {
  const than = Buffer.from(
    JSON.stringify({ thoId: "abc", ten: "X", vaiTro: "tho", het: Date.now() - 1000 })
  ).toString("base64url");
  const ky = createHmac("sha256", process.env.SESSION_SECRET!).update(than).digest("base64url");
  assert.equal(docToken(`${than}.${ky}`), null);
});

test("không leo thang quyền bằng cách sửa vai trò trong cookie", () => {
  const t = taoToken({ thoId: "abc", ten: "Thợ", vaiTro: "tho" });
  const [than, ky] = t.split(".");
  const j = JSON.parse(Buffer.from(than, "base64url").toString());
  j.vaiTro = "admin";
  const thanGia = Buffer.from(JSON.stringify(j)).toString("base64url");
  assert.equal(docToken(`${thanGia}.${ky}`), null, "đổi vai trò mà giữ chữ ký cũ phải bị từ chối");
});

test("hạn bảo hành 24 tháng tính đúng, kể cả cuối tháng", () => {
  const ng = (d: Date) => d.toISOString().slice(0, 10);
  assert.equal(ng(hanBaoHanh(new Date(2026, 8, 22), 24)), "2028-09-22");
  assert.equal(ng(hanBaoHanh(new Date(2026, 0, 31), 1)), "2026-02-28");   // không có 31/02
  assert.equal(ng(hanBaoHanh(new Date(2024, 0, 31), 1)), "2024-02-29");   // năm nhuận
  assert.equal(ng(hanBaoHanh(new Date(2026, 11, 15), 24)), "2028-12-15"); // qua hai lần đổi năm
});
