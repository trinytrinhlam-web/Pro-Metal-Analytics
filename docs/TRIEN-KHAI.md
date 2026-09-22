# Triển khai

## 1. Số hotline cho từng kênh

Chỉ cần làm nếu bạn chọn **cách A hoặc B** ở `KE-HOACH.md` mục 1.1. Thợ không
phải chọn số nào cả — form nhập của thợ không có ô này. Hotline chỉ phục vụ việc
xác định nguồn ở phía sau.

Mỗi kênh một số riêng, không dùng lẫn:

| Số | Chỉ đăng ở | Ghi chú |
|---|---|---|
| Số 1 | Google Ads | Chỉ điền vào phần mở rộng cuộc gọi của Google |
| Số 2 | Facebook / Instagram | Chỉ điền trong bài quảng cáo Facebook |
| Số 3 | Website + Zalo OA | Số hiện trên suachuacuasat.com |
| Số 4 | Biển hiệu, xe, tờ rơi | Offline |
| Số riêng của thợ | Khách cũ, giới thiệu | Không đăng ở đâu cả |

**Cách rẻ nhất:** mua sim số phụ, cài chuyển tiếp cuộc gọi hết về một máy. Thợ
vẫn nghe trên một điện thoại, nhưng màn hình hiện số nào gọi đến thì biết nguồn.

**Cách gọn hơn:** dùng tổng đài ảo (Stringee, VoIP24h, CMC…) — khoảng vài trăm
nghìn/tháng, có sẵn ghi âm và báo cáo cuộc gọi. Đây cũng là cách duy nhất điền
được nguồn khách **hoàn toàn tự động**: tổng đài biết khách gọi vào số nào, phần
mềm khớp theo số điện thoại rồi tự điền, không ai phải bấm gì.

> Nguyên tắc duy nhất phải giữ: **một số chỉ đăng đúng một chỗ.** In nhầm số
> Google Ads lên biển hiệu là hỏng toàn bộ số liệu của kênh đó.

## 2. Đưa app lên mạng

```bash
# lần đầu
npm install
npx vercel link
npx vercel env pull .env.local   # lấy khoá Supabase về máy

# chạy thử ở máy
npm run dev                      # mở http://localhost:3000

# đẩy lên mạng: chỉ cần push, Vercel tự build
git push origin main
```

## 3. Trỏ domain

suachuacuasat.com đang chạy **WordPress**. Đã chốt: dùng subdomain, không đụng
vào web hiện tại. Nếu sau này vẫn muốn đường dẫn `/guikhachcusat` thì xem
`NHAP-NHANH.md` phần cuối — làm được, miễn phí, nhưng để sau.

**Cách A — subdomain (khuyên dùng, không đụng gì tới web hiện tại):**

```
app.suachuacuasat.com  →  CNAME  →  cname.vercel-dns.com
```

Đường dẫn sẽ là `app.suachuacuasat.com/nhap` và `app.suachuacuasat.com/admin`.
Web bán hàng hiện tại giữ nguyên, không rủi ro.

**Cách B — đường dẫn con như bạn muốn (`suachuacuasat.com/guikhachcusat`):**

Chỉ làm được nếu **toàn bộ** suachuacuasat.com cũng nằm trên Vercel. Nếu web
hiện tại đang chạy WordPress ở hosting khác thì phải cấu hình reverse proxy ở
hosting đó — làm được nhưng dễ vỡ khi hosting cập nhật.

👉 **Cần bạn cho biết suachuacuasat.com hiện đang chạy trên gì** (WordPress?
hosting nào? hay chưa có web?) thì mới chốt được cách nào.

## 4. Thợ cài app lên điện thoại

Không qua CH Play / App Store. Gửi link cho thợ, rồi:

- **Android (Chrome):** mở link → menu ⋮ → *Thêm vào màn hình chính*
- **iPhone (Safari):** mở link → nút chia sẻ → *Thêm vào MH chính*

Sau đó biểu tượng nằm trên màn hình chính, mở ra chạy toàn màn hình như app thật.
Sửa code xong thợ chỉ cần mở lại là có bản mới, không phải cài lại.

## 5. Tạo mã PIN cho thợ

Admin vào phần Cài đặt → Thợ → Thêm thợ → đặt tên + mã PIN 4 số. Đọc mã cho thợ,
thợ nhập một lần, máy nhớ luôn cho những lần sau.

Thợ nghỉ việc: bấm tắt, dữ liệu cũ vẫn giữ nguyên.

## 6. Nhập chi phí quảng cáo

Đầu mỗi tháng, admin vào Cài đặt → Chi phí quảng cáo, điền số tiền đã tiêu từng
kênh tháng trước. Không có số này thì CPL, CPA, ROAS đều không tính được.

Mất khoảng 2 phút mỗi tháng. Giai đoạn 4 có thể nối thẳng Google Ads API để khỏi
nhập tay.

## 7. Sao lưu

Supabase gói miễn phí giữ bản sao lưu 7 ngày. Thêm cho chắc: mỗi cuối tháng vào
dashboard bấm **Xuất Excel**, lưu file vào Google Drive.
