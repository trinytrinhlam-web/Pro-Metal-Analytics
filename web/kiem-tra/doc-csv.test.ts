/** node --experimental-strip-types --test kiem-tra/doc-csv.test.ts */
import assert from "node:assert/strict";
import test from "node:test";
import { docBaoCao, docGio, ghiChuCuoc, khopVoiDon, tachCsv } from "../lib/doc-csv.ts";

const BAO_CAO = `Báo cáo chi tiết cuộc gọi
Tài khoản: Cửa Sắt Pro-Metal

Thời gian bắt đầu cuộc gọi,Số điện thoại người gọi,Thời lượng cuộc gọi (giây),Trạng thái cuộc gọi,Chiến dịch
"22/09/2026 13:17:05","+84935223864","214","Đã nhận","Cửa sắt - Tìm kiếm"
"22/09/2026 09:02:11","0912550394","8","Nhỡ","Cửa sắt - Tìm kiếm"
Tổng cộng,,,,`;

test("bỏ qua dòng thừa đầu file và dòng tổng cộng cuối file", () => {
  const r = docBaoCao(BAO_CAO);
  assert.ok("ds" in r);
  assert.equal(r.ds.length, 2);
  assert.equal(r.ds[0].sdt, "0935223864", "phải đổi +84 về 0");
  assert.equal(r.ds[0].giay, 214);
  assert.equal(r.ds[1].trangThai, "Nhỡ");
});

test("nhận tiêu đề tiếng Anh", () => {
  const r = docBaoCao(`Call start time,Caller phone number,Duration (seconds),Call status
2026-09-22 13:17:05,+84935223864,214,Received`);
  assert.ok("ds" in r);
  assert.equal(r.ds[0].sdt, "0935223864");
});

test("thiếu cột số điện thoại thì báo rõ, không im lặng", () => {
  const r = docBaoCao("ngay,doanh thu\n01/01/2026,500");
  assert.ok("loi" in r);
  assert.match(r.loi, /số điện thoại/i);
});

test("ngày giờ nhận cả hai kiểu", () => {
  assert.equal(docGio("22/09/2026 13:17:05")?.getMonth(), 8);
  assert.equal(docGio("22/09/2026 13:17:05")?.getDate(), 22);
  assert.equal(docGio("2026-09-22 13:17")?.getDate(), 22);
  assert.equal(docGio("linh tinh"), null);
});

test("ô có dấu phẩy bên trong dấu ngoặc kép không bị tách nhầm", () => {
  const r = tachCsv('a,"b,c",d');
  assert.deepEqual(r[0], ["a", "b,c", "d"]);
});

test("dòng trùng hệt nhau chỉ tính một lần", () => {
  const r = docBaoCao(`Số điện thoại người gọi,Thời gian bắt đầu cuộc gọi
0935223864,22/09/2026 13:17:05
0935223864,22/09/2026 13:17:05`);
  assert.ok("ds" in r);
  assert.equal(r.ds.length, 1);
});

test("khớp đơn: đúng số, gõ sai một chữ số, và chưa có đơn nào", () => {
  const don = [
    { id: "d1", so_dien_thoai: "0935223864", thoi_diem: "2026-09-22T13:20:00", hotline_id: null },
    { id: "d2", so_dien_thoai: "1958831748", thoi_diem: "2026-09-22T09:05:00", hotline_id: null }, // thợ gõ sai đầu số
    { id: "d3", so_dien_thoai: "0977000111", thoi_diem: "2026-09-22T10:00:00", hotline_id: "h1" }, // đã có nguồn
  ];
  const goi = [
    { sdt: "0935223864", luc: new Date(2026, 8, 22, 13, 17), giay: 200, trangThai: "" },
    { sdt: "0958831748", luc: new Date(2026, 8, 22, 9, 2), giay: 100, trangThai: "" },
    { sdt: "0977000111", luc: new Date(2026, 8, 22, 10, 0), giay: 50, trangThai: "" },
    { sdt: "0912550394", luc: new Date(2026, 8, 22, 8, 0), giay: 8, trangThai: "Nhỡ" },
  ];
  const k = khopVoiDon(goi, don);
  assert.equal(k[0].viec, "gan");
  assert.equal(k[0].donId, "d1");
  assert.equal(k[1].viec, "sua", "sai một chữ số vẫn phải nhận ra");
  assert.equal(k[1].sdtCu, "1958831748");
  assert.equal(k[2].viec, "bo", "đơn đã có nguồn thì bỏ qua");
  assert.equal(k[3].viec, "moi", "không có đơn nào thì tạo đơn nháp");
});

test("cách nhau quá một ngày thì không khớp nhầm", () => {
  const k = khopVoiDon(
    [{ sdt: "0935223864", luc: new Date(2026, 8, 25, 13, 0), giay: 10, trangThai: "" }],
    [{ id: "d1", so_dien_thoai: "0935223864", thoi_diem: "2026-09-22T13:00:00", hotline_id: null }]
  );
  assert.equal(k[0].viec, "moi");
});

test("ghi chú đơn dựng từ báo cáo nói rõ nguồn gốc và tình trạng cuộc gọi", () => {
  assert.equal(
    ghiChuCuoc("Đã kết nối", 143),
    "Dựng từ báo cáo cuộc gọi Google Ads · Đã kết nối · nói 143 giây."
  );
  // không kết nối thì bỏ chữ "nói" — chuông đổ chứ không ai nói câu nào
  assert.equal(
    ghiChuCuoc("Không kết nối", 4),
    "Dựng từ báo cáo cuộc gọi Google Ads · Không kết nối · 4 giây."
  );
  assert.equal(ghiChuCuoc("missed", 6), "Dựng từ báo cáo cuộc gọi Google Ads · missed · 6 giây.");
  // báo cáo thiếu cột thì vẫn phải ra một câu đọc được
  assert.equal(ghiChuCuoc(null, null), "Dựng từ báo cáo cuộc gọi Google Ads.");
  assert.equal(ghiChuCuoc("", 0), "Dựng từ báo cáo cuộc gọi Google Ads.");
});
