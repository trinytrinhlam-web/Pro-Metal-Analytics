# Kế hoạch làm phần mềm

## 1. Những gì đã chốt

| Câu hỏi | Chốt |
|---|---|
| Nền tảng | Next.js + Supabase, deploy trên Vercel |
| Thợ đăng nhập | Mã PIN 4–6 số, mỗi thợ một mã |
| Quy mô | 1–5 thợ, dưới 300 đơn/tháng |
| Trường thêm | Trạng thái đơn + lý do từ chối, Khu vực (quận), Loại công trình |
| **Nguồn khách** | **Thợ không nhập.** Mỗi kênh vẫn có một số hotline riêng, nhưng nguồn được điền ngoài form thợ — cách điền còn đang chốt (xem mục 1.1) |
| Doanh thu | Để trống được, điền sau khi làm xong việc |

### 1.1 Điểm còn phải chốt: nguồn khách điền bằng cách nào

Thợ **không biết** khách đến từ Google hay Facebook — thợ chỉ thấy số điện thoại
gọi tới. Form nhập của thợ vì vậy **không có ô chọn nguồn**, để giữ tốc độ nhập.

Hệ quả: đơn mới vào hệ thống ở trạng thái **"Chưa rõ nguồn"**. Bảng so sánh kênh,
CPL, CPA và ROAS chỉ chạy trên phần dữ liệu đã có nguồn. Dashboard đếm riêng số
đơn chưa gán và nhắc ngay dưới bảng.

Ba cách điền, chọn một:

| Cách | Ai làm | Công sức | Độ chính xác |
|---|---|---|---|
| **A. Tổng đài tự ghi** | Không ai | Cài một lần | Cao nhất |
| **B. Admin gán ở dashboard** | Bạn | ~2 phút/ngày | Cao |
| **C. Không theo dõi nguồn** | — | 0 | Không phân tích được quảng cáo |

**Cách A** là cách nên làm: mỗi kênh một số hotline riêng, tổng đài ảo ghi lại
cuộc gọi vào số nào, phần mềm khớp theo số điện thoại khách và tự điền nguồn.
Không ai phải bấm gì thêm. Chi tiết trong `TRIEN-KHAI.md`.

**Cách B** không cần mua gì: màn hình Admin có danh sách "Chưa rõ nguồn", bạn bấm
một chip để gán. Làm gộp cả ngày một lượt.

**Cách C** thì bỏ luôn bảng so sánh kênh — các phân tích còn lại (khung giờ, thứ
trong tuần, giới tính, dịch vụ, khu vực, lý do từ chối, doanh thu) vẫn chạy đủ.

👉 **Cần bạn chọn A, B hay C trước khi làm giai đoạn 3.**

## 2. Chia giai đoạn

### Giai đoạn 1 — Demo giao diện ✅ xong

Bản HTML chạy độc lập tại `demo/index.html`, dữ liệu mẫu, không có database.
Mục đích: bạn nhìn thấy và sờ được trước khi bỏ công làm bản thật.

Gồm: màn hình thợ (đăng nhập PIN, form nhập không có ô nguồn, danh sách hôm nay, sửa đơn) và
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
