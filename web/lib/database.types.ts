/**
 * Kiểu của các bảng trong Supabase. Khớp với web/supabase/migrations/0001_khoi_tao.sql.
 * Sửa bảng thì sửa cả ở đây, không thì TypeScript không bắt lỗi giúp được nữa.
 */
type ThoRow = {
  id: string;
  ten: string;
  pin_bam: string;
  vai_tro: "tho" | "admin";
  dang_dung: boolean;
  tao_luc: string;
};
type HotlineRow = {
  id: string;
  so: string;
  kenh: string;
  mau: string;
  chi_phi_thang: number;
  thu_tu: number;
  dang_dung: boolean;
};
type KhachRow = {
  id: string;
  thoi_diem: string;
  ten: string | null;
  so_dien_thoai: string;
  gioi_tinh: "nam" | "nu" | null;
  hotline_id: string | null;
  dich_vu: string[];
  khu_vuc: string | null;
  loai_cong_trinh: string | null;
  trang_thai: "hoi_gia" | "da_chot" | "tu_choi";
  ly_do_tu_choi: string | null;
  doanh_thu: number | null;
  ghi_chu: string | null;
  giay_goi: number | null;
  tu_bao_cao: boolean;
  tho_id: string | null;
  khoa_client: string | null;
  da_duyet: boolean;
  duyet_luc: string | null;
  duyet_boi: string | null;
  tao_luc: string;
  sua_luc: string;
};
type HangMucRow = {
  id: string;
  khach_hang_id: string;
  dich_vu: string;
  bh_so_thang: number;
  bh_het_han: string;
};
type BaoHanhLogRow = {
  id: string;
  khach_hang_id: string;
  ngay: string;
  noi_dung: string | null;
  chi_phi: number | null;
  nguoi_di: string | null;
  tao_luc: string;
};
type BaoHanhDichVuRow = { dich_vu: string; so_thang: number };

type Bang<R, I = Partial<R>> = { Row: R; Insert: I; Update: Partial<I>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      tho: Bang<ThoRow, { ten: string; pin_bam: string; vai_tro?: "tho" | "admin"; dang_dung?: boolean }>;
      hotline: Bang<HotlineRow, {
        so: string; kenh: string; mau?: string; chi_phi_thang?: number;
        thu_tu?: number; dang_dung?: boolean;
      }>;
      khach_hang: Bang<KhachRow, Omit<Partial<KhachRow>, "so_dien_thoai"> & { so_dien_thoai: string }>;
      don_hang_muc: Bang<HangMucRow, Omit<HangMucRow, "id">>;
      bao_hanh_log: Bang<BaoHanhLogRow, Omit<Partial<BaoHanhLogRow>, "khach_hang_id"> & { khach_hang_id: string }>;
      bao_hanh_dich_vu: Bang<BaoHanhDichVuRow, BaoHanhDichVuRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
