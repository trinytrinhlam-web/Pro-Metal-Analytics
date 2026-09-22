# Nối thẳng vào Google Ads

Trả lời câu hỏi: tích hợp Google Ads để phần mềm tự lấy dữ liệu có được không.

**Được — nhưng "tự lấy" gồm ba việc khác hẳn nhau.** Một việc dễ, một việc Google
không cho, và một việc ít ai làm nhưng lại đáng giá nhất.

| | Việc | Qua API được không |
|---|---|---|
| 1 | Tự lấy **chi phí** quảng cáo | ✅ Được, dễ |
| 2 | Tự biết **khách nào** đến từ Google | ❌ Không — Google không trả số điện thoại |
| 3 | **Gửi ngược** kết quả về cho Google | ⭐ Được, và đây mới là phần đáng tiền |

---

## Việc 1 — Tự lấy chi phí quảng cáo ✅

Google Ads API trả về chi phí theo ngày, theo chiến dịch, theo nhóm quảng cáo,
theo từ khoá. Kèm số lần hiển thị, số lần bấm, số cuộc gọi.

**Bỏ được việc nhập tay mỗi tháng.** Dashboard tự có số để tính CPL, CPA, ROAS.

Làm khoảng một ngày. Cần:
- Tài khoản Google Cloud + bật Google Ads API
- **Developer token** — đăng ký và chờ Google duyệt (không tự động, mất vài ngày)
- OAuth một lần để lấy refresh token

API miễn phí, chỉ tốn công đăng ký.

---

## Việc 2 — Biết khách nào đến từ Google ❌

Đây là chỗ hụt, và nói trước để bạn khỏi kỳ vọng sai.

**Google Ads API không trả số điện thoại của khách gọi tới.** Đây là chính sách
riêng tư của Google, không phải giới hạn kỹ thuật. API chỉ cho mã quốc gia và mã
vùng. Đã có người xin bổ sung, Google chưa hứa gì.

Nên **không khớp được theo số điện thoại** để biết khách này từ Google hay không.

API vẫn cho biết: **bao nhiêu** cuộc gọi từ quảng cáo, gọi lúc mấy giờ, nói bao
lâu. Đủ để đối chiếu tổng số, không đủ để gán từng khách.

### Ba cách lách, từ rẻ tới đắt

**Cách A — Tải báo cáo tay, mỗi tuần một lần (miễn phí)**

Giao diện Google Ads **có hiện số điện thoại khách** — chỉ API mới không có. Hiện
với hầu hết cuộc gọi dài trên 15 giây (Ấn Độ và Nhật thì không; Việt Nam thì có).

Vậy: mỗi tuần vào Google Ads tải báo cáo **Chi tiết cuộc gọi** ra CSV, kéo thả vào
phần mềm, hệ thống tự khớp theo số điện thoại và gán nguồn hàng loạt.

👉 Đây là thứ đáng làm nhất trong ba cách: **miễn phí, và biến việc duyệt đơn hằng
ngày thành 2 phút mỗi tuần.**

**Cách B — Dùng số chuyển tiếp của Google làm hotline (miễn phí, cần tổng đài)**

Khi bật báo cáo cuộc gọi, Google tự cấp một **số chuyển tiếp** riêng. Khách bấm
gọi từ quảng cáo là gọi vào số đó, rồi Google chuyển về máy bạn.

Tức là Google đã cấp sẵn cho bạn một "hotline riêng cho Google Ads" — miễn phí,
không phải mua sim. Chỉ còn thiếu một thứ: phần mềm phải biết cuộc gọi vào số nào,
mà cái đó cần tổng đài (xem `NHAP-NHANH.md` cách 4).

**Cách C — Admin gán tay** — cách đang làm hiện nay.

---

## Việc 3 — Gửi ngược kết quả về Google ⭐

Đây là phần ít người làm mà lại thay đổi cuộc chơi, và là lý do thật sự đáng để
nối API.

**Điểm hay nằm ở chỗ bất đối xứng:** Google không đưa số điện thoại khách cho bạn,
nhưng **bạn được phép gửi số điện thoại lên cho Google** để họ tự khớp bên họ.

```
Khách gọi từ quảng cáo Google
        ↓
Thợ nhập đơn · bạn duyệt · đơn chốt 4.800.000đ
        ↓
Phần mềm gửi về Google: số này · gọi lúc này · ra 4.800.000đ
        ↓
Google khớp ngược với cú bấm quảng cáo đã sinh ra cuộc gọi đó
        ↓
Google học: từ khoá nào, khung giờ nào, khu vực nào ra TIỀN
        ↓
Tự đấu giá mạnh hơn vào đúng chỗ đó
```

**Khác biệt thật sự:** hiện nay Google chỉ biết "quảng cáo này tạo ra một cuộc
gọi" và tối ưu để có **nhiều cuộc gọi**. Sau khi nối, Google biết cuộc gọi nào
thành tiền và bao nhiêu tiền, rồi tối ưu để có **nhiều doanh thu**.

Đây chính là chỗ phần mềm của bạn ngừng là "bảng báo cáo" và thành **vòng lặp tự
tối ưu**.

### Cần gì để chạy

- Phải đang dùng **số chuyển tiếp của Google** (bật báo cáo cuộc gọi)
- Gửi lên: số điện thoại khách dạng quốc tế `+84...`, giờ khách gọi (có múi giờ
  `+07:00`), giá trị đơn, mã hành động chuyển đổi
- Gửi xong khoảng **3 tiếng** mới hiện trong Google Ads
- Bật `partial_failure` để một dòng lỗi không làm hỏng cả lô

### Hai điều kiện thật, nói thẳng

**Một: dữ liệu phải sạch và kịp.** Gửi rác lên là Google học rác, rồi tiêu tiền
sai chỗ — tệ hơn là không gửi gì. Nghĩa là thợ phải điền tiền công đúng và bạn
phải duyệt đơn đều. Việc bạn làm mỗi ngày giờ ảnh hưởng thẳng tới cách Google
tiêu tiền của bạn.

**Hai: cần đủ lượng để máy học.** Google thường cần khoảng **30 chuyển đổi trong
30 ngày** thì đấu giá thông minh mới chạy ổn. Bạn đang khoảng 70–80 đơn chốt mỗi
tháng nên đủ — nhưng chỉ khi đơn nào cũng được duyệt và điền tiền.

---

## Nên làm lúc nào

| Giai đoạn | Làm gì |
|---|---|
| **2** (bây giờ) | Chưa đụng API. Admin gán nguồn tay |
| **3** | Việc 1: tự lấy chi phí. Thêm **kéo thả CSV báo cáo cuộc gọi** (cách A) — miễn phí, cắt gần hết việc duyệt tay |
| **4** | Việc 3: gửi ngược chuyển đổi. Chỉ làm sau khi đã có 2–3 tháng dữ liệu sạch |

**Đừng làm việc 3 trước việc 2.** Chưa gán được nguồn chính xác mà đã gửi ngược
thì gửi sai, Google học sai.

---

## Facebook thì sao

Nguyên lý y hệt: Facebook có Conversions API nhận sự kiện ngoại tuyến, khớp theo
số điện thoại đã băm. Cùng một dữ liệu đơn hàng, gửi thêm một nơi nữa.

Nên làm sau Google, vì trong số liệu demo Google đang là kênh ra tiền hơn — và
kênh nào ra tiền hơn thì đáng nối trước.

---

## Nguồn tham khảo

- [call_view — Google Ads API](https://developers.google.com/google-ads/api/fields/v23/call_view)
- [Caller phone number không có trong API — Google Ads Community](https://support.google.com/google-ads/thread/165321345/caller-phone-number-dimension-not-available-via-google-ads-api?hl=en)
- [Xem chi tiết từng cuộc gọi — Google Ads Help](https://support.google.com/google-ads/answer/9099302?hl=en)
- [Import call conversions — Google Ads API](https://developers.google.com/google-ads/api/docs/conversions/upload-calls)
- [Nhập chuyển đổi cuộc gọi — Google Ads Help](https://support.google.com/google-ads/answer/6275629?hl=en)
- [Hướng dẫn nhập chuyển đổi ngoại tuyến — Google Ads Help](https://support.google.com/google-ads/answer/15081888?hl=en)

Tên API và chính sách của Google đổi thường xuyên — tra lại tài liệu lúc bắt tay
vào làm, đừng tin số liệu trong file này là mãi mãi đúng.
