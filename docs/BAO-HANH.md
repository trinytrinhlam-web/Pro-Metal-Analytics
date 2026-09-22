# Khách cũ & bảo hành

Tab thứ ba bên Admin. Việc chính: **khách gọi tới báo hỏng thì tra ra ngay** đã
làm gì, ngày nào, còn bảo hành hay hết.

## Tra cứu

Ô tìm kiếm nằm trên cùng, gõ số điện thoại là ra. Gõ được một phần số cũng ra.

Kết quả cho biết ngay:
- Khách này đã liên hệ mấy lần, làm mấy đơn, tổng bao nhiêu tiền
- Từng đơn: ngày, hạng mục, số tiền, khu vực
- **Từng hạng mục có hạn bảo hành riêng**, kèm ngày hết hạn cụ thể
- Đã gọi bảo hành mấy lần trước đó

Không tìm thấy số thì báo rõ là khách mới, hoặc số đã nhập sai lúc trước — chứ
không để màn hình trống làm bạn tưởng phần mềm hỏng.

## Hạn bảo hành theo hạng mục

Mỗi hạng mục một thời hạn riêng, sửa được trong Cài đặt:

| Hạng mục | Mặc định |
|---|---|
| Cửa cổng | 24 tháng |
| Lan can – ban công | 24 tháng |
| Cầu thang | 24 tháng |
| Cửa cuốn | 18 tháng |
| Khung bảo vệ | 12 tháng |
| Mái tôn | 12 tháng |
| Sơn – hàn vá | 6 tháng |

👉 **Đây là con số tôi đặt tạm. Cần bạn cho biết thời hạn thật của xưởng.**

Một đơn làm nhiều hạng mục thì mỗi hạng mục hết hạn một lúc khác nhau — ví dụ
cổng còn bảo hành mà phần sơn đã hết. Phần mềm hiện tách riêng từng dòng, không
gộp chung thành một hạn duy nhất, vì gộp lại là nguồn cãi nhau với khách.

Ba trạng thái: **Còn bảo hành** (xanh) · **Sắp hết, còn ≤60 ngày** (vàng) ·
**Hết bảo hành** (xám).

## Danh sách nên gọi

Bộ lọc **"Sắp hết hạn"** xếp gấp nhất lên đầu. Đây là danh sách gọi điện: gọi hỏi
thăm trước khi hết bảo hành vừa giữ được khách, vừa hay ra việc mới — mà không
tốn đồng quảng cáo nào.

Ba ô thống kê ở đầu tab:
- **Khách đã từng làm** — và bao nhiêu người đã quay lại lần hai
- **Đang còn bảo hành** — số khách bạn đang phải nhận sửa miễn phí nếu họ gọi
- **Sắp hết trong 60 ngày** — danh sách gọi chăm sóc

## Ghi nhận một lần bảo hành

Mỗi đơn có nút **"+ Ghi nhận một lần bảo hành"**. Bấm là lưu lại ngày đã đi bảo
hành. Sau này nhìn vào biết đơn nào phải quay lại nhiều lần — tức là chỗ đó làm
chưa đạt, hoặc vật tư có vấn đề.

Dữ liệu này để dành cho một báo cáo sau: **hạng mục nào hay phải bảo hành nhất**.
Biết được thì sửa từ khâu làm, chứ không phải chạy theo sửa mãi.

## Một chi tiết kỹ thuật quan trọng

Bản demo đang tính hạn bảo hành từ bảng cấu hình **hiện tại**. Bản thật **không
được** làm vậy: phải chép thời hạn vào từng đơn **ngay lúc tạo đơn**.

Lý do: nếu sau này bạn đổi bảo hành cổng từ 24 xuống 12 tháng, mà hệ thống tính
lại từ cấu hình mới, thì hàng trăm khách cũ tự nhiên mất bảo hành — dù lúc làm
bạn đã hứa 24 tháng. Chép cứng vào đơn thì đổi chính sách chỉ ảnh hưởng khách mới,
đúng như ngoài đời.

## Bảng dữ liệu cần thêm

```sql
-- Thời hạn bảo hành từng hạng mục (cấu hình, sửa được)
create table bao_hanh_dich_vu (
  dich_vu  text primary key,
  so_thang int  not null check (so_thang > 0)
);

-- Thời hạn chép cứng vào từng hạng mục của từng đơn, ngay lúc tạo đơn
create table don_hang_muc (
  id            uuid primary key default gen_random_uuid(),
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  dich_vu       text not null,
  bh_so_thang   int  not null,              -- chép lúc tạo, không đọc lại cấu hình
  bh_het_han    date not null               -- = ngày làm + bh_so_thang
);

-- Mỗi lần đi bảo hành
create table bao_hanh_log (
  id            uuid primary key default gen_random_uuid(),
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  ngay          date not null default current_date,
  noi_dung      text,
  chi_phi       bigint,                     -- tiền vật tư bỏ ra, để tính lãi thật
  nguoi_di      uuid references tho(id),
  tao_luc       timestamptz not null default now()
);

create index bh_het_han_idx on don_hang_muc (bh_het_han);
```

`chi_phi` trong `bao_hanh_log` là thứ đáng ghi: một đơn lãi 3 triệu mà đi bảo hành
hai lần hết 800 nghìn thì lãi thật chỉ còn 2,2 triệu. Không ghi thì không bao giờ
biết.
