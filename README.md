# Cửa Sắt Lead Radar

Phần mềm quản lý khách hàng + phân tích dữ liệu cho xưởng cửa sắt, chạy trên web,
gắn với domain **suachuacuasat.com**.

Mục tiêu không chỉ là lưu tên khách, mà là **trả lời được câu hỏi: tiền quảng cáo
đang chảy đi đâu và nên chỉnh ở chỗ nào.**

## Hai phần tách riêng

| Phần | Ai dùng | Thiết bị | Đường dẫn dự kiến |
|---|---|---|---|
| Nhập khách (có giọng nói) | Thợ / sale | Điện thoại (chỉ tối ưu mobile) | `app.suachuacuasat.com` |
| Duyệt đơn + bảo hành + phân tích + cài đặt | Admin (chủ) | Máy tính + điện thoại | `app.suachuacuasat.com/admin` |

Có thể tạo thêm đường dẫn khác tuỳ ý, ví dụ `/guikhachcusat`.

## Xem demo

Demo giao diện chạy được ngay, không cần cài gì:

```bash
# mở thẳng bằng trình duyệt
open demo/index.html        # macOS
start demo\index.html       # Windows
```

Demo dùng **dữ liệu mẫu do máy sinh ra** (không phải khách thật). Nhập thử một
khách ở màn hình thợ rồi bấm sang tab Admin sẽ thấy số liệu đổi theo.

Màn hình thợ có nút **🎤 Nói cho nhanh** ở đầu trang: bấm, đọc một hơi, máy điền
vào form (bản demo dùng câu mẫu, bản thật gọi Gemini).

Bên Admin có bốn tab: **Duyệt đơn** (kiểm dữ liệu thợ nhập, gán nguồn quảng cáo),
**Khách cũ & bảo hành** (tra cứu theo số điện thoại, hạn bảo hành, danh sách sắp
hết hạn), **Phân tích** (biểu đồ, chỉ số) và **Cài đặt** (thêm thợ, đặt mã PIN).

Đăng nhập thợ trong demo: mã **1234**.

- `demo/app.html` — bản gốc, sửa ở đây
- `demo/index.html` — bản chạy độc lập, sinh ra bằng `bash demo/build.sh`

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/KE-HOACH.md](docs/KE-HOACH.md) | Kế hoạch làm, chia giai đoạn, phạm vi từng giai đoạn |
| [docs/CAU-TRUC-DU-LIEU.md](docs/CAU-TRUC-DU-LIEU.md) | Các bảng dữ liệu, SQL tạo bảng, phân quyền |
| [docs/CHI-SO-PHAN-TICH.md](docs/CHI-SO-PHAN-TICH.md) | Từng chỉ số nghĩa là gì và dùng để chỉnh quảng cáo ra sao |
| [docs/NHAP-NHANH.md](docs/NHAP-NHANH.md) | Các cách để thợ nhập nhanh hơn hoặc không phải nhập, và chuyện domain |
| [docs/BAO-HANH.md](docs/BAO-HANH.md) | Tra cứu bảo hành, hạn từng hạng mục, danh sách gọi chăm sóc |
| [docs/GHI-AM-AI.md](docs/GHI-AM-AI.md) | Nhập bằng giọng nói qua Gemini, và cách xoá sạch file ghi âm |
| [docs/TRIEN-KHAI.md](docs/TRIEN-KHAI.md) | Trỏ domain, cài hotline, đưa app lên mạng |

## Làm việc trên 2 máy

Toàn bộ nằm trên GitHub, không có gì lưu riêng ở máy nào.

```bash
git clone https://github.com/trinytrinhlam-web/Pro-Metal-Analytics.git
cd Pro-Metal-Analytics
git checkout claude/compassionate-gauss-fi0nty

# mỗi lần bắt đầu làm ở máy khác
git pull origin claude/compassionate-gauss-fi0nty
```

## Tình trạng

- [x] Chốt yêu cầu
- [x] Kế hoạch + cấu trúc dữ liệu
- [x] Demo giao diện (chưa có database thật)
- [ ] Dựng bản thật: Next.js + Supabase
- [ ] Trỏ domain, chạy thử với khách thật
