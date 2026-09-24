/** node --experimental-strip-types --test kiem-tra/van-de.test.ts */
import assert from "node:assert/strict";
import test from "node:test";
import { loiThat, vanDeCuaDon } from "../lib/van-de.ts";
import type { KhachHang } from "../lib/kieu.ts";

let dem = 0;
const don = (p: Partial<KhachHang> = {}): KhachHang => ({
  id: "k" + ++dem, thoi_diem: "2026-09-22T10:00:00", ten: "Anh A",
  so_dien_thoai: "0935223864", gioi_tinh: "nam", hotline_id: "h1",
  dich_vu: ["Cửa cuốn"], khu_vuc: "Gò Vấp", loai_cong_trinh: "Nhà phố",
  trang_thai: "hoi_gia", ly_do_tu_choi: null, doanh_thu: null, ghi_chu: null,
  giay_goi: null, tu_bao_cao: false, la_khach_cu: false, tho_id: null,
  da_duyet: false, tao_luc: "", sua_luc: "", ...p,
});

test("đơn đầy đủ thì không báo gì", () => {
  const l = don();
  assert.deepEqual(vanDeCuaDon(l, [l]), []);
});

test("chưa gán nguồn là cảnh báo nhẹ, không làm thẻ nổi lên", () => {
  const l = don({ hotline_id: null });
  const v = vanDeCuaDon(l, [l]);
  assert.equal(v.length, 1);
  assert.equal(v[0].ma, "nguon");
  assert.equal(loiThat(v), 0, "đơn nào mới vào cũng chưa gán nguồn — không phải lỗi");
});

test("số điện thoại thiếu số hoặc sai đầu số là lỗi nặng", () => {
  assert.equal(loiThat(vanDeCuaDon(don({ so_dien_thoai: "09352238" }), [])), 1);
  assert.equal(loiThat(vanDeCuaDon(don({ so_dien_thoai: "1935223864" }), [])), 1);
});

test("tách nhập trùng với khách cũ gọi lại theo khoảng cách thời gian", () => {
  const cu = don({ id: "cu", thoi_diem: "2026-09-22T08:00:00" });
  const gan = don({ id: "gan", thoi_diem: "2026-09-22T11:00:00" });   // cách 3 tiếng
  const xa = don({ id: "xa", thoi_diem: "2026-09-25T11:00:00" });     // cách 3 ngày

  const vGan = vanDeCuaDon(gan, [cu, gan]);
  assert.equal(vGan[0].ma, "trung");
  assert.match(vGan[0].chu, /nhập hai lần/);

  const vXa = vanDeCuaDon(xa, [cu, xa]);
  assert.equal(vXa[0].ma, "cu");
  assert.match(vXa[0].chu, /KHÁCH CŨ GỌI LẠI/);

  assert.equal(loiThat(vGan), 1, "cả hai đều phải làm thẻ nổi lên");
  assert.equal(loiThat(vXa), 1);
});

test("đã chốt mà chưa có tiền công thì nhắc", () => {
  const l = don({ trang_thai: "da_chot", doanh_thu: null });
  assert.equal(loiThat(vanDeCuaDon(l, [l])), 1);
  const l2 = don({ trang_thai: "da_chot", doanh_thu: 1_000_000 });
  assert.equal(loiThat(vanDeCuaDon(l2, [l2])), 0);
});

test("cuộc gọi dưới 15 giây bị đánh dấu là số rác", () => {
  const l = don({ giay_goi: 8 });
  const v = vanDeCuaDon(l, [l]);
  assert.ok(v.some((x) => /số rác/.test(x.chu)));
  assert.equal(loiThat(v), 0, "chỉ là gợi ý, không phải lỗi");
});

test("thiếu tên, phường xã, dịch vụ chỉ là nhắc nhẹ", () => {
  const l = don({ ten: null, khu_vuc: null, dich_vu: [] });
  const v = vanDeCuaDon(l, [l]);
  assert.equal(v.length, 3);
  assert.equal(loiThat(v), 0);
});
