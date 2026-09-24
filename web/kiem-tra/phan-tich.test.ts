/** node --experimental-strip-types --test kiem-tra/phan-tich.test.ts */
import assert from "node:assert/strict";
import test from "node:test";
import {
  baoHanhCuaDon, chiPhiKy, demTheo, doanhThuTheoDichVu, khoangKy, kyTruoc,
  luoiGioThu, phanTram, soNgay, theoNgay, theoNguon, tongHop, trangThaiBH,
} from "../lib/phan-tich.ts";
import type { Hotline, KhachHang } from "../lib/kieu.ts";

const hl = (id: string, chi: number): Hotline => ({
  id, so: "090" + id, kenh: "Kênh " + id, mau: "var(--s1)",
  chi_phi_thang: chi, thu_tu: 0, dang_dung: true,
});

let dem = 0;
function don(p: Partial<KhachHang> = {}): KhachHang {
  return {
    id: "k" + ++dem, thoi_diem: "2026-09-20T10:00:00", ten: "Anh A",
    so_dien_thoai: "0935223864", gioi_tinh: "nam", hotline_id: null,
    dich_vu: [], khu_vuc: null, loai_cong_trinh: null, trang_thai: "hoi_gia",
    ly_do_tu_choi: null, doanh_thu: null, ghi_chu: null, giay_goi: null,
    tu_bao_cao: false, la_khach_cu: false, tho_id: null, da_duyet: true,
    tao_luc: "2026-09-20T10:00:00", sua_luc: "2026-09-20T10:00:00", ...p,
  };
}

test("chỉ số tiền quảng cáo chỉ tính trên khách mới", () => {
  const ds = [
    don({ trang_thai: "da_chot", doanh_thu: 4_000_000 }),              // mới, chốt
    don({ trang_thai: "hoi_gia" }),                                     // mới, không chốt
    don({ trang_thai: "da_chot", doanh_thu: 6_000_000, la_khach_cu: true }), // cũ, chốt
  ];
  const t = tongHop(ds, 3_000_000);
  assert.equal(t.n, 3);
  assert.equal(t.chot, 2);
  assert.equal(t.dt, 10_000_000);
  assert.equal(t.moi, 2);
  assert.equal(t.cu, 1);
  assert.equal(t.dtCu, 6_000_000);
  // 2 khách mới, không phải 3
  assert.equal(t.cpl, 1_500_000);
  // 1 đơn chốt từ khách mới, không phải 2
  assert.equal(t.cpa, 3_000_000);
  // doanh thu khách mới / chi phí — không cộng 6tr của khách cũ vào
  assert.equal(t.roas, 4_000_000 / 3_000_000);
});

test("đếm được đơn còn thiếu tiền công và đơn chưa duyệt", () => {
  const t = tongHop(
    [
      don({ trang_thai: "da_chot", doanh_thu: null }),
      don({ trang_thai: "da_chot", doanh_thu: 1 }),
      don({ da_duyet: false }),
    ],
    0
  );
  assert.equal(t.thieuTien, 1);
  assert.equal(t.chuaDuyet, 1);
});

test("bảng nguồn: đơn chưa gán nguồn đứng riêng một dòng, không tính chi phí", () => {
  const hs = [hl("a", 3_000_000), hl("b", 0)];
  const ds = [
    don({ hotline_id: "a", trang_thai: "da_chot", doanh_thu: 9_000_000 }),
    don({ hotline_id: "a", trang_thai: "tu_choi" }),
    don({ hotline_id: null }),
  ];
  const rows = theoNguon(ds, hs, 30);
  const a = rows.find((r) => r.hotline?.id === "a")!;
  const chuaRo = rows.find((r) => r.hotline === null)!;
  assert.equal(a.n, 2);
  assert.equal(a.ty, 50);
  assert.equal(a.chi, 3_000_000);
  assert.equal(a.roas, 3);
  assert.equal(chuaRo.n, 1);
  assert.equal(chuaRo.chi, 0);
  assert.equal(chuaRo.roas, 0);
  // hotline b không có khách và không tốn tiền thì không hiện
  assert.equal(rows.find((r) => r.hotline?.id === "b"), undefined);
});

test("lưới giờ × thứ xếp Thứ 2 lên đầu, Chủ nhật xuống cuối", () => {
  const gio = [8, 9, 10];
  // 21/09/2026 là Thứ 2, 27/09 là Chủ nhật
  const { luoi, max } = luoiGioThu(
    [
      don({ thoi_diem: "2026-09-21T09:15:00" }),
      don({ thoi_diem: "2026-09-21T09:40:00" }),
      don({ thoi_diem: "2026-09-27T08:05:00" }),
      don({ thoi_diem: "2026-09-21T23:00:00" }), // ngoài khung giờ theo dõi
    ],
    gio
  );
  assert.equal(luoi[0][1], 2, "Thứ 2 lúc 9h phải có 2");
  assert.equal(luoi[6][0], 1, "Chủ nhật lúc 8h phải có 1");
  assert.equal(max, 2);
});

test("doanh thu chia đều cho các hạng mục trong cùng một đơn", () => {
  const r = doanhThuTheoDichVu([
    don({ trang_thai: "da_chot", doanh_thu: 9_000_000, dich_vu: ["Cửa cuốn", "Nhôm kính", "Sửa cửa sắt"] }),
    don({ trang_thai: "da_chot", doanh_thu: 1_000_000, dich_vu: ["Cửa cuốn"] }),
    don({ trang_thai: "hoi_gia", doanh_thu: 500_000, dich_vu: ["Cửa cuốn"] }), // chưa chốt thì không tính
  ]);
  const m = new Map(r);
  assert.equal(m.get("Cửa cuốn"), 4_000_000);
  assert.equal(m.get("Nhôm kính"), 3_000_000);
  assert.equal(r[0][0], "Cửa cuốn", "phải xếp theo doanh thu giảm dần");
});

test("đếm theo trường, nhận cả trường nhiều giá trị", () => {
  const r = demTheo([
    don({ dich_vu: ["A", "B"] }), don({ dich_vu: ["A"] }), don({ dich_vu: [] }),
  ], (l) => l.dich_vu);
  assert.deepEqual(r, [["A", 2], ["B", 1]]);
});

test("biểu đồ theo ngày có đủ ngày trống ở giữa", () => {
  const tu = new Date(2026, 8, 20);
  const r = theoNgay([don({ thoi_diem: "2026-09-22T10:00:00", trang_thai: "da_chot", doanh_thu: 5 })], tu, 4);
  assert.equal(r.length, 4);
  assert.equal(r[0].n, 0);
  assert.equal(r[2].n, 1);
  assert.equal(r[2].dt, 5);
});

test("khoảng thời gian và kỳ so sánh không chồng lên nhau", () => {
  const moc = new Date(2026, 8, 24, 15, 0);
  assert.equal(soNgay("7", moc), 7);
  assert.equal(soNgay("30", moc), 30);
  const [a] = khoangKy("30", moc);
  const [, bTruoc] = kyTruoc("30", moc);
  assert.ok(bTruoc.getTime() < a.getTime(), "kỳ trước phải kết thúc trước khi kỳ này bắt đầu");
  const [thangDau, thangCuoi] = khoangKy("truoc", moc);
  assert.equal(thangDau.getMonth(), 7, "tháng trước của tháng 9 là tháng 8");
  assert.equal(thangCuoi.getMonth(), 8);
});

test("chi phí quy từ ngân sách tháng ra số ngày thực", () => {
  const hs = [hl("a", 3_000_000), hl("b", 600_000)];
  assert.equal(chiPhiKy(hs, 30), 3_600_000);
  assert.equal(chiPhiKy(hs, 15), 1_800_000);
  assert.equal(chiPhiKy(hs, 30, "b"), 600_000, "lọc một nguồn thì chỉ tính tiền nguồn đó");
});

test("bảo hành: cùng thời hạn thì gộp một dòng, khác thì tách", () => {
  const moc = new Date(2026, 8, 22);
  const gop = baoHanhCuaDon(moc, ["Cửa cuốn", "Nhôm kính"], undefined, moc);
  assert.equal(gop.length, 1);
  assert.equal(gop[0].dichVu, "Cửa cuốn, Nhôm kính");
  assert.equal(gop[0].hetHan.getFullYear(), 2028);

  const rieng = new Map([["Sơn", 6]]);
  const tach = baoHanhCuaDon(moc, ["Cửa cuốn", "Sơn"], rieng, moc);
  assert.equal(tach.length, 2, "hạng mục thời hạn khác phải tách dòng riêng");
});

test("ba mức trạng thái bảo hành", () => {
  assert.equal(trangThaiBH(400), "con");
  assert.equal(trangThaiBH(60), "sap");
  assert.equal(trangThaiBH(0), "sap");
  assert.equal(trangThaiBH(-1), "het");
});

test("phần trăm chia cho 0 không vỡ", () => {
  assert.equal(phanTram(0, 0), 0);
  assert.equal(phanTram(1, 3), 33.3);
});
