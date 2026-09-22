# Kế hoạch làm phần mềm

## 1. Những gì đã chốt

| Câu hỏi | Chốt |
|---|---|
| Nền tảng | Next.js + Supabase, deploy trên Vercel |
| Thợ đăng nhập | Mã PIN 4–6 số, mỗi thợ một mã |
| Quy mô | 1–5 thợ, dưới 300 đơn/tháng |
| Trường thêm | Trạng thái đơn + lý do từ chối, Khu vực (quận), Loại công trình |
| **Nguồn khách** | **Mỗi kênh quảng cáo một số hotline riêng.** Thợ chỉ chọn "khách gọi vào số nào", hệ thống tự suy ra nguồn — thợ không phải đoán |
| Doanh thu | Để trống được, điền sau khi làm xong việc |

### Điểm thiết kế quan trọng nhất

Thợ **không biết** khách đến từ Google hay Facebook — thợ chỉ thấy số điện thoại
gọi tới. Nên phần mềm không hỏi thợ "khách từ đâu". Thay vào đó:

```
Google Ads   → 0909 12 34 56 ─┐
Facebook     → 0909 22 44 66 ─┤
Zalo/Website → 0909 33 55 77 ─┼─→ thợ chỉ bấm "khách gọi vào số nào"
Biển hiệu    → 0909 44 88 99 ─┤     → phần mềm tự biết nguồn
Máy riêng    → khách cũ/giới thiệu ─┘
```

Đây là cách duy nhất vừa chính xác vừa không bắt thợ làm thêm việc gì.
Đổi lại, bạn cần mua thêm sim/số cho từng kênh (xem `TRIEN-KHAI.md`).

## 2. Chia giai đoạn

### Giai đoạn 1 — Demo giao diện ✅ xong

Bản HTML chạy độc lập tại `demo/index.html`, dữ liệu mẫu, không có database.
Mục đích: bạn nhìn thấy và sờ được trước khi bỏ công làm bản thật.

Gồm: màn hình thợ (đăng nhập PIN, form nhập, danh sách hôm nay, sửa đơn) và
màn hình admin (7 chỉ số tổng, bảng khung giờ × thứ, so sánh từng hotline,
biểu đồ theo ngày, giới tính, dịch vụ, khu vực, lý do từ chối, gợi ý tự động,
bảng chi tiết).

### Giai đoạn 2 — Bản thật, phần nhập liệu (ước 3–4 ngày làm)

- Dựng Supabase: bảng, ràng buộc, phân quyền
- Màn hình thợ chạy thật: đăng nhập PIN, lưu vào database
- PWA: cài được như app lên màn hình chính, mất sóng vẫn nhập được, có sóng tự gửi
- Màn "Hôm nay": sửa đơn, bổ sung tiền công
- Nhận diện khách cũ theo số điện thoại

**Chạy thử 1–2 tuần với khách thật trước khi làm tiếp.** Dữ liệu thật sẽ cho
thấy cần thêm bớt trường nào — làm dashboard trước khi có dữ liệu là làm mò.

### Giai đoạn 3 — Bản thật, phần phân tích (ước 3–4 ngày làm)

- Toàn bộ biểu đồ trong demo, chạy trên dữ liệu thật
- Bộ lọc: khoảng thời gian, nguồn, thợ, dịch vụ, khu vực
- Nhập chi phí quảng cáo từng kênh theo tháng → tính CPL, CPA, ROAS
- Xuất Excel
- Gợi ý tối ưu quảng cáo tự động

### Giai đoạn 4 — Nâng cấp (làm khi cần)

- Nhắc việc: khách "hỏi giá" quá 3 ngày chưa chốt → nhắc gọi lại
- Bảng xếp hạng thợ theo tháng
- Báo cáo tự gửi Zalo/email đầu tuần
- Nối thẳng vào Google Ads API để khỏi nhập chi phí tay

## 3. Quyết định kỹ thuật và lý do

| Chọn | Vì sao |
|---|---|
| Next.js | Cùng một codebase cho cả app thợ lẫn dashboard, chạy nhanh trên mạng 3G/4G |
| Supabase | PostgreSQL thật, có sẵn phân quyền theo dòng dữ liệu, gói miễn phí thừa sức cho 300 đơn/tháng |
| Vercel | Deploy bằng cách push lên GitHub, tự có HTTPS, gói miễn phí đủ dùng |
| Không dùng Google Sheets | Quá 2.000–3.000 dòng là chậm, và không làm nổi bảng khung giờ × thứ |
| PWA thay vì app cài từ store | Không phải trả phí kho ứng dụng, sửa xong là thợ có bản mới ngay, thợ vẫn "cài" được lên màn hình chính |

## 4. Rủi ro nhìn trước

| Rủi ro | Cách chặn |
|---|---|
| Thợ nhập thiếu, nhập ẩu | Chỉ bắt buộc **một** ô là số điện thoại. Mọi thứ khác điền sau được. Màn "Hôm nay" nhắc đơn còn thiếu tiền công |
| Thợ quên nhập khách không chốt | Đây là dữ liệu quan trọng nhất để đánh giá quảng cáo. Cần bạn nhắc: khách gọi là nhập, chốt hay không tính sau |
| Số hotline dùng lẫn lộn | Mỗi số chỉ đăng đúng một chỗ. Không in số Google Ads lên biển hiệu |
| Dữ liệu tháng đầu chưa đủ để kết luận | Dưới ~100 khách thì tỷ lệ chốt theo kênh còn nhiễu. Nhìn xu hướng, đừng cắt ngân sách vội |
| Mất dữ liệu | Supabase tự sao lưu; thêm xuất Excel định kỳ cho chắc |

## 5. Việc bạn cần làm

1. Xem demo, nói chỗ nào cần sửa
2. Chốt danh sách dịch vụ đúng với nghề của bạn (demo đang để 7 loại)
3. Chốt danh sách quận/huyện bạn nhận việc
4. Chuẩn bị số hotline cho từng kênh
5. Cho biết ngân sách quảng cáo hiện tại từng kênh/tháng
6. Cho biết tên và số thợ sẽ dùng
