# Làm sao để thợ nhập nhanh hơn — hoặc không phải nhập

Trả lời câu hỏi: có cách nào miễn phí, nhanh, mà không phải làm app Android/iOS.

## Tóm tắt

| # | Cách | Chi phí | Công sức làm | Tiết kiệm được gì |
|---|---|---|---|---|
| 0 | **PWA** — app cài lên màn hình chính | Miễn phí | Đã tính trong kế hoạch | Không phải làm app, không phí kho ứng dụng |
| 1 | **Nút "Dán số vừa copy"** | Miễn phí | ~1 giờ | Bỏ luôn việc gõ số điện thoại |
| 2 | **Chia sẻ số từ app Điện thoại** | Miễn phí | ~3 giờ | Như trên, nhưng chỉ Android |
| 3 | **Đọc bằng giọng nói** | Rất rẻ | Đã làm demo | Gần như không phải gõ gì |
| 4 | **Tổng đài ảo tự tạo đơn nháp** | Tốn tiền tháng | ~2 ngày | **Thợ không phải tạo đơn nữa** |
| 5 | Nhập qua Zalo | Cần kiểm tra | ~2 ngày | Thợ không phải mở app khác |

Cách 0–3 **miễn phí và nhanh** — nên làm hết. Cách 4 là cách duy nhất đạt tới
"không cần nhập" thật sự, nhưng phải trả tiền hằng tháng.

---

## 0. Không cần làm app Android/iOS — dùng PWA

Đây là điều bạn lo nhất, và nó đã nằm sẵn trong kế hoạch.

PWA là web app nhưng cài được lên màn hình chính điện thoại, mở ra chạy toàn màn
hình như app thật. Thợ không phân biệt được với app tải từ CH Play.

| | App Android/iOS thật | PWA |
|---|---|---|
| Chi phí kho ứng dụng | 25 USD (Google) + 99 USD/năm (Apple) | 0đ |
| Thời gian làm | Nhiều tuần, hai nền tảng hai bản | Cùng codebase với web |
| Cập nhật | Chờ duyệt, thợ phải tải lại | Sửa xong thợ mở là có bản mới |
| Chạy offline | Có | Có |
| Cài lên màn hình chính | Có | Có |

**Cái PWA không làm được:** đọc nhật ký cuộc gọi trên máy thợ. Trình duyệt không
cho phép, kể cả trên Android. Nên muốn tự động hoàn toàn thì phải đi đường tổng
đài (cách 4), chứ không phải đường app.

Trên iPhone, PWA cài qua Safari (nút chia sẻ → *Thêm vào MH chính*). Thông báo
đẩy chỉ chạy từ iOS 16.4 trở lên và bắt buộc phải cài rồi mới nhận được.

---

## 1. Nút "Dán số vừa copy" — miễn phí, làm trong một buổi

Số điện thoại là ô mất thời gian nhất và cũng dễ sai nhất.

Thợ vừa nghe điện xong, số vẫn còn trên màn hình gọi. Chạm giữ để copy, mở app,
bấm một nút **"Dán số vừa gọi"** — xong ô điện thoại.

Chạy được trên cả Android lẫn iPhone. Lần đầu máy hỏi xin quyền đọc clipboard,
thợ bấm đồng ý một lần là thôi.

## 2. Chia sẻ thẳng từ app Điện thoại — Android

Một bậc nhanh hơn nữa: trong lịch sử cuộc gọi của Android, bấm **Chia sẻ** trên
một số → chọn app của mình → app mở ra với ô điện thoại đã điền sẵn.

Làm được vì PWA đăng ký làm "nơi nhận nội dung chia sẻ". Không tốn tiền.

**Chỉ chạy trên Android.** iPhone không cho web app làm việc này. Nếu thợ dùng
iPhone thì quay về cách 1.

## 3. Đọc bằng giọng nói — đã có trong demo

Thợ bấm một nút, đọc một hơi, máy điền hết. Xem `GHI-AM-AI.md`.

Chi phí gọi Gemini rất nhỏ vì mỗi lần đọc chỉ 20–40 giây, nhưng không phải miễn
phí tuyệt đối. Đây vẫn là cách nhanh nhất trong nhóm miễn phí/gần miễn phí.

---

## 4. Tổng đài ảo — cách duy nhất để "không cần nhập"

Đây là câu trả lời thật cho ý *"hoặc không cần nhập"*. Nhưng phải trả tiền hằng
tháng, khoảng vài trăm nghìn (Stringee, VoIP24h, CMC, MobiFone…).

**Cách nó chạy:**

```
Khách gọi vào hotline
        ↓
Tổng đài ghi lại: số khách · gọi lúc nào · gọi vào số nào · nói bao lâu
        ↓
Tổng đài bắn dữ liệu sang phần mềm (webhook)
        ↓
Phần mềm TỰ TẠO ĐƠN NHÁP, điền sẵn 5 ô
        ↓
Thợ mở "Hôm nay" thấy đơn nháp có sẵn, chỉ bổ sung: làm gì · chốt chưa · bao nhiêu tiền
```

**Năm ô tự có, không ai gõ:**

| Ô | Ở đâu ra |
|---|---|
| Số điện thoại | Tổng đài biết |
| Thời điểm khách gọi | Tổng đài biết, chính xác tới giây |
| Nguồn quảng cáo | Suy từ hotline nào được gọi |
| Khách cũ hay mới | Đối chiếu số điện thoại với dữ liệu sẵn có |
| Thời lượng cuộc gọi | Tổng đài biết — cuộc 8 giây là số rác, cuộc 4 phút là khách thật |

Đổi lại, việc của thợ từ **"tạo đơn mới"** thành **"bổ sung đơn có sẵn"** — khác
nhau rất nhiều về mặt thói quen. Thợ quên nhập là chuyện thường; nhưng đơn tự
hiện ra chờ sẵn thì khó quên hơn nhiều.

**Lợi kèm theo, đáng giá không kém:**

- **Bỏ luôn việc duyệt đơn hằng ngày của bạn.** Nguồn quảng cáo tự có nên không
  phải ngồi gán nữa. Công việc 2–3 phút/ngày biến mất.
- **Không sót khách nào.** Khách gọi lúc thợ đang hàn, không nghe máy — vẫn có
  đơn nháp. Hiện tại những cuộc đó mất trắng khỏi số liệu, mà đó chính là những
  cuộc bạn đã trả tiền quảng cáo để có.
- **Thời lượng cuộc gọi lọc được số rác**, giúp đánh giá chất lượng kênh chính
  xác hơn hẳn.

**Nhược điểm thật:** tốn tiền tháng, và phải cài đặt chuyển hướng cuộc gọi một
lần cho tử tế.

## 5. Nhập qua Zalo

Ý tưởng: thợ đã có Zalo, gửi tin nhắn vào Zalo OA của xưởng → hệ thống tự tạo đơn.
Thợ không phải mở app nào khác.

⚠️ **Chưa kiểm chứng.** Tôi chưa xác nhận được Zalo OA cho nhận nội dung tin nhắn
thoại qua API, và hạn mức gói miễn phí tới đâu. Cần tra tài liệu Zalo OA hiện
hành trước khi tính đến. Đừng đưa vào kế hoạch cho tới khi kiểm xong.

---

## Nên làm theo thứ tự nào

**Giai đoạn 2 (ngay):** PWA + dán số + chia sẻ từ app Điện thoại + giọng nói.
Toàn bộ miễn phí hoặc gần như miễn phí, cộng lại đã cắt được phần lớn việc gõ.

**Chạy thử 2–4 tuần.** Đo thật: thợ mất bao lâu cho một đơn, có bao nhiêu đơn bị
quên không nhập.

**Rồi mới quyết tổng đài.** Lúc đó bạn có số liệu để tính: vài trăm nghìn một
tháng có đáng để không sót khách nào và bỏ được việc duyệt đơn hằng ngày không.
Quyết bằng số, đừng quyết bằng cảm giác.

---

## Còn domain thì sao

suachuacuasat.com đang chạy WordPress. Hai đường:

**Đường khuyên dùng — subdomain, không đụng gì tới web hiện tại:**

```
app.suachuacuasat.com  →  CNAME  →  cname.vercel-dns.com
```

Thêm một bản ghi DNS là xong. WordPress giữ nguyên, không rủi ro. Thợ vào
`app.suachuacuasat.com`, bạn vào `app.suachuacuasat.com/admin`.

**Nếu vẫn muốn `suachuacuasat.com/guikhachcusat`:**

Làm được và miễn phí, bằng cách đưa domain qua Cloudflare (gói free):

```
suachuacuasat.com/*                →  WordPress như cũ
suachuacuasat.com/guikhachcusat/*  →  chuyển tiếp sang Vercel
```

Cloudflare đứng trước, thấy đường dẫn `/guikhachcusat` thì lấy nội dung từ Vercel,
còn lại vẫn về WordPress. Người dùng không thấy gì khác biệt.

**Nhưng:** phải đổi nameserver của domain sang Cloudflare, tức là đụng vào phần
DNS đang chạy web bán hàng của bạn. Làm sai là web sập vài tiếng.

👉 Đề nghị: **chạy subdomain trước.** Khi nào phần mềm chạy ổn định rồi, muốn
đường dẫn đẹp thì chuyển sang Cloudflare sau — lúc đó không còn gấp, sai cũng có
thời gian sửa.
