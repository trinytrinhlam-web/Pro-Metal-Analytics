export type VaiTro = "tho" | "admin";
export type TrangThai = "hoi_gia" | "da_chot" | "tu_choi";
export type GioiTinh = "nam" | "nu";

export type Tho = {
  id: string;
  ten: string;
  vai_tro: VaiTro;
  dang_dung: boolean;
  tao_luc: string;
};

export type Hotline = {
  id: string;
  so: string;
  kenh: string;
  mau: string;
  chi_phi_thang: number;
  thu_tu: number;
  dang_dung: boolean;
};

export type KhachHang = {
  id: string;
  thoi_diem: string;
  ten: string | null;
  so_dien_thoai: string;
  gioi_tinh: GioiTinh | null;
  hotline_id: string | null;
  dich_vu: string[];
  khu_vuc: string | null;
  loai_cong_trinh: string | null;
  trang_thai: TrangThai;
  ly_do_tu_choi: string | null;
  doanh_thu: number | null;
  ghi_chu: string | null;
  giay_goi: number | null;
  tu_bao_cao: boolean;
  tho_id: string | null;
  da_duyet: boolean;
  tao_luc: string;
  sua_luc: string;
};

/** Thứ thợ gửi lên khi lưu một đơn. Chỉ số điện thoại là bắt buộc. */
export type DonMoi = {
  thoi_diem?: string;
  ten?: string;
  so_dien_thoai: string;
  gioi_tinh?: GioiTinh | null;
  dich_vu?: string[];
  khu_vuc?: string | null;
  loai_cong_trinh?: string | null;
  trang_thai?: TrangThai;
  ly_do_tu_choi?: string | null;
  doanh_thu?: number | null;
  ghi_chu?: string | null;
  /** Khoá do máy thợ tự sinh, để gửi lại sau khi mất sóng không bị tạo hai lần. */
  khoa_client?: string;
};
