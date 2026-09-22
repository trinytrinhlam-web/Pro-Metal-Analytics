-- Cửa Sắt Lead Radar — khởi tạo cơ sở dữ liệu
-- Chạy trong Supabase: SQL Editor → dán toàn bộ file này → Run

create extension if not exists pgcrypto;

-- ─────────────────────────────── Thợ ───────────────────────────────
-- Không lưu số điện thoại hay email của thợ: không cần tới, và càng ít
-- dữ liệu cá nhân càng đỡ phải lo giữ.
create table if not exists tho (
  id          uuid primary key default gen_random_uuid(),
  ten         text not null,
  pin_bam     text not null,                 -- scrypt, không bao giờ lưu PIN trần
  vai_tro     text not null default 'tho' check (vai_tro in ('tho','admin')),
  dang_dung   boolean not null default true,
  tao_luc     timestamptz not null default now()
);

-- ────────────────────────────── Hotline ─────────────────────────────
-- Đơn gắn với id của hotline, không chép dãy số vào đơn. Nên đổi số của
-- một kênh thì toàn bộ lịch sử giữ nguyên.
create table if not exists hotline (
  id            uuid primary key default gen_random_uuid(),
  so            text not null unique,
  kenh          text not null,
  mau           text not null default 'var(--s1)',
  chi_phi_thang bigint not null default 0,
  thu_tu        int not null default 0,
  dang_dung     boolean not null default true
);

-- ──────────────────────────── Khách hàng ────────────────────────────
-- Mỗi dòng là một lần khách liên hệ, không phải một đầu người. Khách cũ
-- nhận ra bằng cách so số điện thoại.
create table if not exists khach_hang (
  id              uuid primary key default gen_random_uuid(),
  thoi_diem       timestamptz not null default now(),   -- lúc khách gọi, thợ sửa được
  ten             text,
  so_dien_thoai   text not null,
  gioi_tinh       text check (gioi_tinh in ('nam','nu')),
  hotline_id      uuid references hotline(id) on delete set null,  -- null = chưa rõ nguồn
  dich_vu         text[] not null default '{}',
  khu_vuc         text,
  loai_cong_trinh text,
  trang_thai      text not null default 'hoi_gia'
                  check (trang_thai in ('hoi_gia','da_chot','tu_choi')),
  ly_do_tu_choi   text,
  doanh_thu       bigint,                                -- null = chưa biết, khác hẳn số 0
  ghi_chu         text,
  giay_goi        int,                                   -- thời lượng cuộc gọi, lấy từ báo cáo
  tu_bao_cao      boolean not null default false,
  tho_id          uuid references tho(id) on delete set null,
  -- Khoá do máy thợ tự sinh. Mất sóng gửi lại nhiều lần cũng chỉ ra một đơn.
  khoa_client     text unique,
  da_duyet        boolean not null default false,
  duyet_luc       timestamptz,
  duyet_boi       uuid references tho(id) on delete set null,
  tao_luc         timestamptz not null default now(),    -- lúc bấm Lưu, không ai sửa được
  sua_luc         timestamptz not null default now()
);

create index if not exists khach_thoi_diem_idx on khach_hang (thoi_diem desc);
create index if not exists khach_sdt_idx       on khach_hang (so_dien_thoai);
create index if not exists khach_hotline_idx   on khach_hang (hotline_id);
create index if not exists khach_cho_duyet_idx on khach_hang (da_duyet) where da_duyet = false;

-- ─────────────────────────── Hạng mục & bảo hành ────────────────────
-- Hạn bảo hành ghi sẵn vào từng hạng mục lúc tạo đơn, để tra cứu về sau
-- chỉ việc đọc chứ không phải tính lại.
create table if not exists bao_hanh_dich_vu (
  dich_vu  text primary key,
  so_thang int not null default 24 check (so_thang > 0)
);

create table if not exists don_hang_muc (
  id            uuid primary key default gen_random_uuid(),
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  dich_vu       text not null,
  bh_so_thang   int not null default 24,
  bh_het_han    date not null
);
create index if not exists hang_muc_khach_idx  on don_hang_muc (khach_hang_id);
create index if not exists hang_muc_het_han_idx on don_hang_muc (bh_het_han);

create table if not exists bao_hanh_log (
  id            uuid primary key default gen_random_uuid(),
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  ngay          date not null default current_date,
  noi_dung      text,
  chi_phi       bigint,
  nguoi_di      uuid references tho(id) on delete set null,
  tao_luc       timestamptz not null default now()
);

-- ─────────────────────────── sua_luc tự cập nhật ────────────────────
create or replace function cham_sua_luc() returns trigger
language plpgsql as $$
begin
  new.sua_luc := now();
  return new;
end $$;

drop trigger if exists khach_hang_sua_luc on khach_hang;
create trigger khach_hang_sua_luc before update on khach_hang
  for each row execute function cham_sua_luc();

-- ──────────────────────────── Phân quyền ────────────────────────────
-- Toàn bộ truy cập đi qua server của ứng dụng bằng service role key, nên
-- khoá chặt mọi đường vào trực tiếp. Bật RLS mà không tạo policy nào
-- nghĩa là anon và authenticated không đọc ghi được gì.
alter table tho              enable row level security;
alter table hotline          enable row level security;
alter table khach_hang       enable row level security;
alter table don_hang_muc     enable row level security;
alter table bao_hanh_log     enable row level security;
alter table bao_hanh_dich_vu enable row level security;

-- ───────────────────────────── Dữ liệu nền ──────────────────────────
insert into hotline (so, kenh, mau, chi_phi_thang, thu_tu) values
  ('0909 12 34 56',     'Google Ads',            'var(--s1)', 0, 1),
  ('0909 22 44 66',     'Facebook',              'var(--s2)', 0, 2),
  ('0909 33 55 77',     'Zalo / Website',        'var(--s3)', 0, 3),
  ('0909 44 88 99',     'Biển hiệu & xe',        'var(--s4)', 0, 4),
  ('Máy riêng của thợ', 'Khách cũ / giới thiệu', 'var(--s5)', 0, 5)
on conflict (so) do nothing;

insert into bao_hanh_dich_vu (dich_vu, so_thang) values
  ('Sửa cửa sắt', 24), ('Sửa cửa kéo', 24), ('Cửa cuốn', 24),
  ('Làm cửa – cổng sắt', 24), ('Cầu thang – lan can sắt', 24),
  ('Inox (cửa, cầu thang, lan can)', 24), ('Mái hiên – mái che', 24),
  ('Nhôm kính', 24), ('Vách ngăn panel', 24), ('Hàn sắt tại nhà', 24)
on conflict (dich_vu) do nothing;
