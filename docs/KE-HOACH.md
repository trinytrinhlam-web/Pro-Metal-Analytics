# Kế hoạch làm phần mềm

## 1. Những gì đã chốt

| Câu hỏi | Chốt |
|---|---|
| Nền tảng | Next.js + Supabase, deploy trên Vercel |
| Thợ đăng nhập | Mã PIN 4–6 số, mỗi thợ một mã |
| Quy mô | 1–5 thợ, dưới 300 đơn/tháng |
| Thợ | Khởi tạo một thợ demo; admin tự thêm thợ và đặt mã PIN trong tab Cài đặt. Không lưu số điện thoại thợ |
| Khu vực | Đủ 168 phường/xã TP.HCM, ô chọn có tìm kiếm (TP.HCM đã bỏ cấp quận/huyện từ 01/07/2025) |
| Dịch vụ | 10 hạng mục lấy từ suachuacuasat.com |
| Domain | `app.suachuacuasat.com` — WordPress hiện tại giữ nguyên |
| Trường thêm | Trạng thái đơn + lý do từ chối, Khu vực (quận), Loại công trình |
| **Nguồn khách** | **Thợ không nhập.** Admin gán nguồn ở màn "Duyệt đơn" (xem mục 1.1) |
| Doanh thu | Để trống được, điền sau khi làm xong việc |
| Bảo hành | 24 tháng cho mọi hạng mục |
| Lời thợ đọc | Giữ lại trong ô Ghi chú; file ghi âm thì xoá ngay sau khi lưu |

### 1.1 Điểm còn phải chốt: nguồn khách điền bằng cách nào

Thợ **không biết** khách đến từ Google hay Facebook — thợ chỉ thấy số điện thoại
gọi tới. Form nhập của thợ vì vậy **không có ô chọn nguồn**, để giữ tốc độ nhập.

Hệ quả: đơn mới vào hệ thống ở trạng thái **"Chưa rõ nguồn"**. Bảng so sánh kênh,
CPL, CPA và ROAS chỉ chạy trên phần dữ liệu đã có nguồn. Dashboard đếm riêng số
đơn chưa gán và nhắc ngay dưới bảng.

**Đã chốt: admin tự gán nguồn** ở màn hình "Duyệt đơn" (xem mục 1.2). Không phải
mua tổng đài, không phải nhờ thợ. Đổi lại cần bạn bỏ ra vài phút mỗi ngày.

## 1.2 Màn hình "Duyệt đơn"

Đây là chỗ dữ liệu thô của thợ biến thành dữ liệu dùng được. Mỗi đơn thợ nhập vào
hàng chờ, bạn kiểm rồi xác nhận.

**Phần mềm tự soi trước, chỉ ra chỗ nghi ngờ:**

| Cảnh báo | Nghĩa là |
|---|---|
| Số điện thoại thiếu số / sai đầu số | Thợ bấm nhầm, gọi lại không được |
| **Trùng số điện thoại** (đỏ, nổi nhất) | Xem mục riêng bên dưới |
| Đã chốt nhưng chưa có tiền công | Doanh thu và ROAS đang bị tính thiếu |
| Thiếu lý do từ chối | Mất một dòng dữ liệu để biết quảng cáo sai chỗ nào |
| Thiếu khu vực / dịch vụ / tên | Nhẹ, không chặn |

"Chưa gán nguồn" **không tính là lỗi** — đơn nào mới vào cũng vậy. Chỉ lỗi thật
mới làm thẻ nổi viền cam và lọt vào bộ lọc "Có vấn đề".

### Trùng số điện thoại — cảnh báo mức cao nhất

Thẻ **viền đỏ**, nổi hơn mọi cảnh báo khác, vì đây là chỗ dễ làm hỏng số liệu nhất.
Phần mềm tách sẵn hai trường hợp theo khoảng cách thời gian:

| Cách nhau | Kết luận | Bạn bấm |
|---|---|---|
| **Dưới 12 tiếng** ⛔ | Nhiều khả năng thợ nhập hai lần | *Đơn nhập trùng — xoá* (bấm hai lần mới xoá thật) |
| **Từ 12 tiếng trở lên** 🔁 | Khách cũ gọi lại | *Khách cũ gọi lại* |

Thẻ hiện luôn đơn cũ để bạn đối chiếu: ngày giờ, dịch vụ, tiền công, nguồn lần
trước. Còn nếu đúng là hai người khác nhau (thợ bấm nhầm số) thì bấm *Hai khách
khác nhau*, cảnh báo tắt đi.

**Vì sao phải nổi đến vậy:** khách cũ gọi lại **không tốn đồng quảng cáo nào**.
Gán nhầm họ vào Google Ads là cho kênh đó ăn ké một cuộc gọi nó không trả tiền —
CPA đẹp giả, rồi bạn tăng ngân sách dựa trên con số sai. Bấm *Khách cũ gọi lại*
sẽ gán nguồn "Khách cũ / giới thiệu" (chi phí 0đ) và tách họ khỏi phép tính.

Nhóm khách cũ cũng thường có chính sách riêng (giá ưu đãi, bảo hành, chăm sóc
định kỳ), nên biết ngay lúc duyệt là biết đúng lúc cần biết.

**Gán nguồn nhanh:**

- Bấm một chip trên từng đơn, rồi **Xác nhận**
- Hoặc tích chọn nhiều đơn cùng lúc → gán một nguồn cho cả loạt → xác nhận cả loạt
- Khách cũ gọi lại thì phần mềm **gợi ý sẵn** nguồn của lần trước, bấm một nút là xong

**Sửa được mọi trường** ngay tại đó: số điện thoại, tên, giới tính, kết quả, tiền
công, khu vực, loại công trình, dịch vụ, lý do từ chối, ghi chú. Sửa đến đâu lưu
đến đó, không có nút Lưu.

Đơn chưa duyệt vẫn được đếm vào tổng số khách, chỉ là chưa vào được bảng so sánh
kênh (vì chưa có nguồn). Dashboard có dòng nhắc số đơn còn chờ.

## 2. Chia giai đoạn

### Giai đoạn 1 — Demo giao diện ✅ xong

Bản HTML chạy độc lập tại `demo/index.html`, dữ liệu mẫu, không có database.
Mục đích: bạn nhìn thấy và sờ được trước khi bỏ công làm bản thật.

Gồm: màn hình thợ (đăng nhập PIN, **nhập bằng giọng nói**, form nhập không có ô
nguồn, danh sách hôm nay, sửa đơn) và màn hình admin ba tab — **Duyệt đơn** (hàng
chờ, kiểm tra tự động, gán nguồn lẻ và hàng loạt), **Khách cũ & bảo hành** (tra
cứu, hạn bảo hành, danh sách gọi chăm sóc) và **Phân tích** (7 chỉ số tổng, bảng khung giờ × thứ,
so sánh từng hotline, biểu đồ theo ngày, giới tính, dịch vụ, khu vực, lý do từ
chối, gợi ý tự động, bảng chi tiết).

### Giai đoạn 2 — Bản thật, phần nhập liệu (ước 4–5 ngày làm)

- Dựng Supabase: bảng, ràng buộc, phân quyền
- Màn hình thợ chạy thật: đăng nhập PIN, lưu vào database
- PWA: cài được như app lên màn hình chính, mất sóng vẫn nhập được, có sóng tự gửi
- Màn "Hôm nay": sửa đơn, bổ sung tiền công
- Nhận diện khách cũ theo số điện thoại
- **Nhập bằng giọng nói**: thợ đọc, Gemini điền vào form, thợ kiểm rồi lưu, xoá
  file ghi âm ngay — xem `GHI-AM-AI.md`
- **Nút dán số vừa copy** và **nhận số chia sẻ từ app Điện thoại** (Android) —
  hai cách miễn phí bỏ luôn việc gõ số điện thoại, xem `NHAP-NHANH.md`
- **Tab Cài đặt**: admin thêm thợ, đặt mã PIN, cho thợ nghỉ

**Chạy thử 1–2 tuần với khách thật trước khi làm tiếp.** Dữ liệu thật sẽ cho
thấy cần thêm bớt trường nào — làm dashboard trước khi có dữ liệu là làm mò.

### Giai đoạn 3 — Bản thật, phần phân tích (ước 4–5 ngày làm)

- **Màn hình "Duyệt đơn"**: kiểm tra tự động, cảnh báo đỏ khi trùng số điện thoại
  (tách nhập trùng với khách cũ gọi lại), gán nguồn lẻ và hàng loạt, sửa mọi
  trường tại chỗ, xoá đơn trùng
- **Bảng khách cũ quay lại**: số lượt, doanh thu, tỷ lệ chốt so với khách mới
- **Tab "Khách cũ & bảo hành"**: tra cứu theo số điện thoại, hạn bảo hành từng
  hạng mục, danh sách sắp hết hạn cần gọi, ghi nhận lần bảo hành — xem `BAO-HANH.md`
- Toàn bộ biểu đồ trong demo, chạy trên dữ liệu thật
- Bộ lọc: khoảng thời gian, nguồn, thợ, dịch vụ, khu vực
- Nhập chi phí quảng cáo từng kênh theo tháng → tính CPL, CPA, ROAS
- **Tự lấy chi phí từ Google Ads API** thay cho nhập tay
- **Kéo thả CSV báo cáo cuộc gọi Google Ads** → tự khớp số điện thoại, gán nguồn
  hàng loạt. Việc duyệt đơn hằng ngày rút còn ~2 phút mỗi tuần — xem `GOOGLE-ADS.md`
- Xuất Excel
- Gợi ý tối ưu quảng cáo tự động

### Giai đoạn 4 — Nâng cấp (làm khi cần)

- Nhắc việc: khách "hỏi giá" quá 3 ngày chưa chốt → nhắc gọi lại
- Bảng xếp hạng thợ theo tháng
- Báo cáo tự gửi Zalo/email đầu tuần
- **Gửi ngược chuyển đổi về Google Ads**: báo cho Google biết đơn nào chốt và bao
  nhiêu tiền, để Google đấu giá nhắm vào khách ra tiền thay vì chỉ nhắm nhiều
  cuộc gọi. Đây là chỗ phần mềm thành vòng lặp tự tối ưu — xem `GOOGLE-ADS.md`
- Tương tự với Facebook Conversions API, làm sau Google

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
1. Xem lại danh sách dịch vụ tôi lấy từ suachuacuasat.com xem đã đúng chưa
2. Chuẩn bị số hotline cho từng kênh (xem `TRIEN-KHAI.md`)
3. Thêm DNS `app.suachuacuasat.com` trỏ về Vercel
4. Mỗi tháng nhập chi phí quảng cáo từng kênh — ngân sách không cố định cũng không sao,
   nhập đúng số đã tiêu tháng đó là được
