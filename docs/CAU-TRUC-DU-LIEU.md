# Cấu trúc dữ liệu

Database: PostgreSQL trên Supabase. Dưới đây là SQL tạo bảng cho giai đoạn 2.

## Sơ đồ

```
tho (thợ)            hotline (số điện thoại theo kênh)
  │                      │
  └──────┐      ┌────────┘
         ▼      ▼
       khach_hang (mỗi dòng = một khách gọi đến)

chi_phi_quang_cao (ngân sách từng kênh theo tháng) ── ghép với hotline khi tính ROAS
```

## SQL

```sql
-- Thợ / sale
create table tho (
  id          uuid primary key default gen_random_uuid(),
  ten         text not null,
  pin         text not null,                 -- lưu dạng đã băm, không lưu số trần
  vai_tro     text not null default 'tho' check (vai_tro in ('tho','admin')),
  dang_dung   boolean not null default true,
  tao_luc     timestamptz not null default now()
);

-- Không lưu số điện thoại hay email của thợ: không cần tới, và càng ít dữ liệu
-- cá nhân càng đỡ phải lo giữ. Chữ viết tắt trên avatar suy từ tên, không lưu.
-- Hệ thống khởi tạo với đúng một thợ demo; admin tự thêm thợ thật trong Cài đặt.

-- Mỗi kênh quảng cáo một số hotline
create table hotline (
  id          uuid primary key default gen_random_uuid(),
  so          text not null unique,          -- 0909 12 34 56
  kenh        text not null,                 -- Google Ads / Facebook / Zalo ...
  mau         text not null default '#2a78d6',
  thu_tu      int  not null default 0,
  dang_dung   boolean not null default true
);

-- Khách gọi đến
create table khach_hang (
  id            uuid primary key default gen_random_uuid(),
  thoi_diem     timestamptz not null default now(),  -- máy tự điền, thợ sửa được
  ten           text,
  so_dien_thoai text not null,
  gioi_tinh     text check (gioi_tinh in ('nam','nu')),
  hotline_id    uuid references hotline(id),         -- null = chưa rõ nguồn;
                                                      -- thợ không nhập ô này
  dich_vu       text[] not null default '{}',
  khu_vuc       text,
  loai_cong_trinh text,
  trang_thai    text not null default 'hoi_gia'
                check (trang_thai in ('hoi_gia','da_chot','tu_choi')),
  ly_do_tu_choi text,
  doanh_thu     bigint,                              -- VNĐ, null = chưa biết
  ghi_chu       text,
  tho_id        uuid references tho(id),
  da_duyet      boolean not null default false,      -- admin đã kiểm và xác nhận
  duyet_luc     timestamptz,
  duyet_boi     uuid references tho(id),
  tao_luc       timestamptz not null default now(),
  sua_luc       timestamptz not null default now()
);

create index khach_thoi_diem_idx on khach_hang (thoi_diem desc);
create index khach_sdt_idx       on khach_hang (so_dien_thoai);
create index khach_hotline_idx   on khach_hang (hotline_id);
create index khach_cho_duyet_idx on khach_hang (da_duyet) where da_duyet = false;

-- Ngân sách quảng cáo, nhập tay mỗi tháng
create table chi_phi_quang_cao (
  id         uuid primary key default gen_random_uuid(),
  hotline_id uuid not null references hotline(id),
  thang      date not null,                  -- ngày 1 của tháng
  so_tien    bigint not null,
  unique (hotline_id, thang)
);
```

## Giải thích vài chỗ

**`doanh_thu` cho phép để trống.** Lúc khách gọi tới thì chưa biết giá. Để trống
khác hẳn với số 0 — số 0 nghĩa là làm miễn phí, để trống nghĩa là chưa điền.
Dashboard đếm riêng số đơn còn thiếu và nhắc bổ sung.

**`hotline_id` để trống được.** Thợ không chọn nguồn khi nhập, nên đơn mới vào
với `hotline_id = null` — nghĩa là "chưa rõ nguồn", khác hẳn với việc gán bừa
vào một kênh nào đó. Admin gán sau ở màn "Duyệt đơn".

**`da_duyet` là ranh giới giữa dữ liệu thô và dữ liệu dùng được.** Thợ nhập xong
là `false`; admin kiểm và xác nhận thì thành `true`. Đơn chưa duyệt vẫn được đếm
vào tổng số khách (vì khách có gọi thật), chỉ chưa vào được bảng so sánh kênh.
Giữ thêm `duyet_luc` và `duyet_boi` để sau này biết ai duyệt, lúc nào.

**`trang_thai` chỉ có 3 giá trị.** Thêm nữa là thợ phải nghĩ lâu. "Hỏi giá" bao
gồm cả khách đang hẹn khảo sát.

**`dich_vu` là mảng.** Một đơn có thể vừa làm cổng vừa làm lan can. Khi tính
doanh thu theo dịch vụ thì chia đều tiền cho các hạng mục trong đơn.

**Không có bảng "khách hàng" riêng.** Mỗi dòng là một lần khách gọi tới. Khách
cũ nhận ra bằng cách so số điện thoại. Làm vậy đơn giản hơn, và đúng bản chất
việc phân tích quảng cáo — cái cần đếm là **lượt liên hệ**, không phải đầu người.

**`thoi_diem` khác `tao_luc`.** `thoi_diem` là lúc khách thực sự gọi (thợ sửa
được, ví dụ nhập bù cho hôm qua). `tao_luc` là lúc bấm Lưu, không ai sửa được —
để biết thợ có nhập trễ hay không.

## Phân quyền (RLS)

```sql
alter table khach_hang enable row level security;

-- Thợ: xem và sửa đơn của chính mình trong vòng 7 ngày
create policy tho_xem on khach_hang for select
  using (tho_id = auth.uid() and thoi_diem > now() - interval '7 days');
create policy tho_them on khach_hang for insert
  with check (tho_id = auth.uid());
create policy tho_sua on khach_hang for update
  using (tho_id = auth.uid() and thoi_diem > now() - interval '7 days');

-- Admin: toàn quyền
create policy admin_all on khach_hang for all
  using (exists (select 1 from tho where id = auth.uid() and vai_tro = 'admin'));
```

Thợ **không** xem được doanh thu tổng, không xem được đơn của thợ khác, không
xoá được đơn. Sửa nhầm thì báo admin.

## Bảng cho bảo hành và ghi âm

Xem chi tiết trong `BAO-HANH.md` (bảng `bao_hanh_dich_vu`, `don_hang_muc`,
`bao_hanh_log`) và `GHI-AM-AI.md` (kho lưu tạm file ghi âm, xoá sau khi thợ
xác nhận).

Bảo hành: **24 tháng cho mọi hạng mục**. Hạn được ghi sẵn vào `don_hang_muc.bh_het_han`
lúc tạo đơn, nên tra cứu về sau chỉ việc đọc chứ không phải tính lại.

## Danh mục cần bạn chốt

Ba danh sách này nằm trong cấu hình, sửa được bất cứ lúc nào mà không phải đụng
vào code. Bản demo đang để tạm:

- **Dịch vụ** (lấy từ suachuacuasat.com): Sửa cửa sắt · Sửa cửa kéo · Cửa cuốn ·
  Làm cửa – cổng sắt · Cầu thang – lan can sắt · Inox (cửa, cầu thang, lan can) ·
  Mái hiên – mái che · Nhôm kính · Vách ngăn panel · Hàn sắt tại nhà
- **Phường / xã**: đủ **168 đơn vị của TP.HCM** (113 phường + 54 xã + đặc khu Côn Đảo),
  hiệu lực 01/07/2025. **Cấp quận/huyện đã bị bỏ** — xem mục dưới.
- **Loại công trình**: Nhà phố · Chung cư · Xưởng – kho · Shop – văn phòng
- **Lý do từ chối**: Giá cao · Ở quá xa · Đã thuê thợ khác · Không liên lạc lại được · Chỉ hỏi tham khảo

### Về khu vực: TP.HCM không còn quận/huyện

Từ 01/07/2025 TP.HCM sáp nhập với Bình Dương và Bà Rịa – Vũng Tàu, bỏ cấp
quận/huyện, còn **168 phường/xã/đặc khu** trực thuộc thẳng thành phố.

Vì vậy ô khu vực không còn là danh sách 10 quận nữa. 168 mục thì không thể nhét
vào một dropdown trên điện thoại, nên màn hình thợ dùng **ô chọn có tìm kiếm**:

- Gõ không dấu vẫn ra: `go vap` → Gò Vấp
- **Mọi tên quận cũ đều còn tồn tại dưới dạng tên phường mới** (Gò Vấp, Bình Tân,
  Tân Phú, Bình Thạnh, Thủ Đức, Hóc Môn, Bình Chánh, Tân Bình, Củ Chi, Nhà Bè…),
  nên thợ gõ theo thói quen cũ vẫn tìm ra
- Gõ `quan 7` thì báo rõ là đã bỏ cấp quận, chứ không để màn hình trống
- Nhóm **Hay làm nhất** đặt sẵn 8 khu vực xưởng nhận việc nhiều, nằm trên đầu

Danh sách này cần cập nhật lại nếu nhà nước sắp xếp hành chính tiếp.
