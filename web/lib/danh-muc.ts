// Danh mục dùng chung. Sửa ở đây là đổi cả app thợ lẫn màn admin.

export const DICH_VU = [
  "Sửa cửa sắt",
  "Sửa cửa kéo",
  "Cửa cuốn",
  "Làm cửa – cổng sắt",
  "Cầu thang – lan can sắt",
  "Inox (cửa, cầu thang, lan can)",
  "Mái hiên – mái che",
  "Nhôm kính",
  "Vách ngăn panel",
  "Hàn sắt tại nhà",
];

export const LOAI_CONG_TRINH = ["Nhà phố", "Chung cư", "Xưởng – kho", "Shop – văn phòng"];

export const LY_DO_TU_CHOI = [
  "Giá cao",
  "Ở quá xa",
  "Đã thuê thợ khác",
  "Không liên lạc lại được",
  "Chỉ hỏi tham khảo",
];

/** Bảo hành mặc định cho mọi hạng mục, tính bằng tháng. */
export const BAO_HANH_MAC_DINH = 24;

/**
 * 168 phường / xã / đặc khu của TP.HCM, hiệu lực 01/07/2025.
 * Cấp quận/huyện đã bị bỏ; mọi tên quận cũ vẫn còn dưới dạng tên phường mới
 * nên thợ gõ theo thói quen cũ vẫn tìm ra.
 * Cập nhật lại nếu nhà nước sắp xếp hành chính tiếp.
 */
export const KHU_VUC: string[] = [
  "An Đông", "An Hội Đông", "An Hội Tây", "An Khánh",
  "An Lạc", "An Long", "An Nhơn", "An Nhơn Tây",
  "An Phú", "An Phú Đông", "An Thới Đông", "Bà Điểm",
  "Bà Rịa", "Bàn Cờ", "Bàu Bàng", "Bàu Lâm",
  "Bảy Hiền", "Bắc Tân Uyên", "Bến Cát", "Bến Thành",
  "Bình Chánh", "Bình Châu", "Bình Cơ", "Bình Dương",
  "Bình Đông", "Bình Giã", "Bình Hòa", "Bình Hưng",
  "Bình Hưng Hòa", "Bình Khánh", "Bình Lợi", "Bình Lợi Trung",
  "Bình Mỹ", "Bình Phú", "Bình Quới", "Bình Tân",
  "Bình Tây", "Bình Thạnh", "Bình Thới", "Bình Tiên",
  "Bình Trị Đông", "Bình Trưng", "Cát Lái", "Cần Giờ",
  "Cầu Kiệu", "Cầu Ông Lãnh", "Chánh Hiệp", "Chánh Hưng",
  "Chánh Phú Hòa", "Châu Đức", "Châu Pha", "Chợ Lớn",
  "Chợ Quán", "Côn Đảo", "Củ Chi", "Dầu Tiếng",
  "Dĩ An", "Diên Hồng", "Đất Đỏ", "Đông Hòa",
  "Đông Hưng Thuận", "Đông Thạnh", "Đức Nhuận", "Gia Định",
  "Gò Vấp", "Hạnh Thông", "Hiệp Bình", "Hiệp Phước",
  "Hòa Bình", "Hòa Hiệp", "Hòa Hội", "Hòa Hưng",
  "Hòa Lợi", "Hóc Môn", "Hồ Tràm", "Hưng Long",
  "Khánh Hội", "Kim Long", "Lái Thiêu", "Linh Xuân",
  "Long Bình", "Long Điền", "Long Hải", "Long Hòa",
  "Long Hương", "Long Nguyên", "Long Phước", "Long Sơn",
  "Long Trường", "Minh Phụng", "Minh Thạnh", "Ngãi Giao",
  "Nghĩa Thành", "Nhà Bè", "Nhiêu Lộc", "Nhuận Đức",
  "Phú An", "Phú Định", "Phú Giáo", "Phú Hòa Đông",
  "Phú Lâm", "Phú Lợi", "Phú Mỹ", "Phú Nhuận",
  "Phú Thạnh", "Phú Thọ", "Phú Thọ Hòa", "Phú Thuận",
  "Phước Hải", "Phước Hòa", "Phước Long", "Phước Thành",
  "Phước Thắng", "Rạch Dừa", "Sài Gòn", "Tam Bình",
  "Tam Long", "Tam Thắng", "Tăng Nhơn Phú", "Tân An Hội",
  "Tân Bình", "Tân Định", "Tân Đông Hiệp", "Tân Hải",
  "Tân Hiệp", "Tân Hòa", "Tân Hưng", "Tân Khánh",
  "Tân Mỹ", "Tân Nhựt", "Tân Phú", "Tân Phước",
  "Tân Sơn", "Tân Sơn Hòa", "Tân Sơn Nhất", "Tân Sơn Nhì",
  "Tân Tạo", "Tân Thành", "Tân Thới Hiệp", "Tân Thuận",
  "Tân Uyên", "Tân Vĩnh Lộc", "Tây Nam", "Tây Thạnh",
  "Thái Mỹ", "Thanh An", "Thạnh An", "Thạnh Mỹ Tây",
  "Thông Tây Hội", "Thới An", "Thới Hòa", "Thủ Dầu Một",
  "Thủ Đức", "Thuận An", "Thuận Giao", "Thường Tân",
  "Trung Mỹ Tây", "Trừ Văn Thố", "Vĩnh Hội", "Vĩnh Lộc",
  "Vĩnh Tân", "Vũng Tàu", "Vườn Lài", "Xóm Chiếu",
  "Xuân Hòa", "Xuân Sơn", "Xuân Thới Sơn", "Xuyên Mộc",
];

/** Vùng xưởng nhận việc nhiều nhất — đưa lên đầu danh sách chọn. */
export const KHU_VUC_HAY = [
  "Bình Tân", "Tân Phú", "Gò Vấp", "Bình Thạnh",
  "Thủ Đức", "Hóc Môn", "Bình Chánh", "An Lạc",
];

/** Bỏ dấu để gõ "go vap" vẫn ra "Gò Vấp". */
export function boDau(x: string): string {
  return x
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Số di động Việt Nam: giữ đúng chữ số, đổi +84 về 0. */
export function chuanSdt(x: string): string {
  let d = String(x || "").replace(/[^0-9+]/g, "");
  if (d.startsWith("+84")) d = "0" + d.slice(3);
  else if (d.startsWith("84") && d.length >= 11) d = "0" + d.slice(2);
  d = d.replace(/\D/g, "");
  if (d.length === 9 && !d.startsWith("0")) d = "0" + d;
  return d;
}

export function dinhDangSdt(x: string): string {
  const d = chuanSdt(x).slice(0, 10);
  return d.replace(/^(\d{4})(\d{0,3})(\d{0,3}).*$/, (_m, a, b, c) =>
    a + (b ? " " + b : "") + (c ? " " + c : "")
  );
}
