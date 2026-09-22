# Bản thật — giai đoạn 2

App nhập khách cho thợ, chạy thật với database. Next.js + Supabase.

> Bản demo giao diện nằm ở `../demo` và vẫn chạy độc lập, không liên quan tới
> thư mục này.

## ⚠️ Hai chỗ khác nhau, đừng dán nhầm

| Chỗ | Nhận cái gì | KHÔNG nhận |
|---|---|---|
| **Supabase → SQL Editor** | Chỉ lệnh SQL — nội dung file `supabase/migrations/0001_khoi_tao.sql` | `cd`, `npm`, `node`… dán vào là báo `syntax error` |
| **Terminal / dòng lệnh** | `npm install`, `npm run dev`, `node scripts/...` | SQL |

Dán nhầm cũng không hỏng gì, nó chỉ báo lỗi rồi thôi.

## Cách 1 — Không cần terminal (khuyên dùng)

Làm hết trên trình duyệt, không phải cài gì lên máy.

### 1. Tạo database

[supabase.com](https://supabase.com) → **New project** (gói miễn phí đủ dùng).

Mở **SQL Editor** → **New query** → mở file `supabase/migrations/0001_khoi_tao.sql`
trên GitHub, copy **toàn bộ** nội dung, dán vào → bấm **Run**.

Chạy đúng thì thấy `Success. No rows returned`.

### 2. Đưa lên Vercel

[vercel.com](https://vercel.com) → đăng nhập bằng GitHub → **Add New → Project** →
chọn repo `Pro-Metal-Analytics`.

Quan trọng: mục **Root Directory** bấm **Edit** rồi chọn thư mục **`web`**. Không
đổi chỗ này là Vercel không tìm thấy app.

Trước khi bấm Deploy, mở **Environment Variables** và thêm bốn dòng:

| Name | Value lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** |
| `SUPABASE_SERVICE_ROLE_KEY` | cùng trang, mục **service_role** — khoá bí mật, đừng đưa cho ai |
| `SESSION_SECRET` | gõ đại một chuỗi dài ngẫu nhiên 40–60 ký tự, chữ và số lẫn lộn |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key. Bỏ trống cũng được, khi đó nút ghi âm tự ẩn |

Bấm **Deploy**, chờ 1–2 phút.

### 3. Tạo tài khoản của bạn

Mở `<link-vercel-vừa-tạo>/khoi-tao` → điền tên và mã PIN 4 số → **Tạo tài khoản**.

Trang này **chỉ chạy được một lần**, khi chưa có ai trong hệ thống. Tạo xong nó tự
đóng lại, không ai dùng nó để tự cấp quyền admin được nữa.

Xong. Vào `/admin` thêm thợ, `/nhap` để nhập khách.

### 4. Gắn domain

Vercel → Settings → Domains → thêm `app.suachuacuasat.com`, rồi thêm bản ghi DNS
theo đúng hướng dẫn Vercel hiện ra. WordPress hiện tại không bị đụng gì.

## Cách 2 — Chạy trên máy bạn

Chỉ làm nếu muốn sửa code. Cần cài [Node.js](https://nodejs.org) trước.

```bash
cd web
npm install
cp .env.example .env.local      # rồi mở file này điền bốn khoá như bảng trên
npm run dev                     # mở http://localhost:3000/khoi-tao
```

Tạo tài khoản đầu tiên: mở `/khoi-tao` trên trình duyệt, hoặc nếu thích dùng dòng
lệnh thì `node scripts/tao-admin.mjs "Anh Lâm" 1234`.

## Thợ vào app bằng cách nào

**Thợ gõ link đúng một lần duy nhất — mà thật ra cũng không cần gõ.**

Vào `/admin` → khối **Phát app cho thợ** ở đầu trang có sẵn **mã QR**. Đưa điện
thoại thợ quét bằng camera là mở thẳng app, không gõ chữ nào.

Thợ làm ba việc, một lần:

1. Quét mã QR (hoặc bấm link bạn gửi qua Zalo)
2. Menu trình duyệt → **Thêm vào màn hình chính**
   - Android (Chrome): menu ⋮
   - iPhone (Safari): nút chia sẻ
3. Nhập mã PIN của mình

Xong. Từ đó thợ chỉ bấm biểu tượng trên màn hình chính như mọi app khác — không
gõ link, không đăng nhập lại (máy nhớ 60 ngày). Sửa code xong thợ mở lại là có
bản mới, không phải cài lại.

Mỗi thợ trong danh sách còn có nút **Lời nhắn Zalo**: copy sẵn một đoạn có link,
mã PIN và hướng dẫn, dán thẳng vào Zalo gửi cho thợ.

### Bấm biểu tượng thì mở tab mới hay về chỗ cũ

**Về đúng chỗ cũ, không đẻ thêm cửa sổ.** App cài lên màn hình chính chạy ở cửa
sổ riêng, không phải tab trình duyệt; manifest khai `launch_handler:
navigate-existing` nên bấm biểu tượng hay bấm link đều quay về cửa sổ đang mở.

Có ba trường hợp mất phiên, nói trước cho rõ:

| Tình huống | Chuyện gì xảy ra |
|---|---|
| Thợ bấm biểu tượng, app còn trong bộ nhớ | Về đúng màn đang dở, còn nguyên những gì vừa gõ |
| Điện thoại đã dọn app nền để lấy bộ nhớ | App mở lại từ đầu, **nhưng đơn đang gõ dở được lấy lại** (xem dưới) |
| Thợ bấm link **trong Zalo** | ⚠️ Zalo mở bằng trình duyệt riêng của nó — phiên đăng nhập khác, phải nhập mã lại, và không cài lên màn hình chính được |

Vì trường hợp thứ ba mà **quét QR bằng camera vẫn là cách đúng**: camera mở bằng
Chrome/Safari thật. Nếu lỡ bấm link trong Zalo thì bấm dấu **…** ở góc chọn
**Mở bằng trình duyệt** rồi hãy cài. Lời nhắn Zalo mà app copy sẵn đã có câu nhắc này.

iPhone dọn app nền hăng hơn Android, nên thợ dùng iPhone sẽ gặp cảnh mở lại từ
đầu nhiều hơn. Đăng nhập thì không mất (cookie giữ 60 ngày), chỉ là màn hình về
lại trang nhập.

### Đơn gõ dở không bị mất

Thợ gõ tới đâu máy giữ tới đó. Điện thoại dọn app, thợ lỡ tay thoát, hay sóng rớt
— mở lại vẫn còn nguyên số điện thoại, tên, dịch vụ đã chọn, kèm dòng báo
*"Đã lấy lại đơn bạn đang gõ dở"* và nút bỏ đi nếu không cần.

Bản nháp tự xoá sau khi lưu đơn, hoặc sau 12 tiếng không đụng tới.

### Đặt địa chỉ cho ngắn

Địa chỉ gốc đã tự chuyển vào màn nhập, nên thợ không phải nhớ đường dẫn phía sau
— chỉ cần tên miền:

| Tên miền | Dài | Ghi chú |
|---|---|---|
| `app.suachuacuasat.com` | 21 ký tự | Rõ nghĩa, dễ nhớ |
| `nhap.suachuacuasat.com` | 22 | Tiếng Việt hơn |
| `n.suachuacuasat.com` | 19 | Ngắn nhất mà vẫn cùng domain |

Có QR rồi thì độ dài gần như không còn quan trọng. Chọn cái nào bạn thấy dễ đọc
cho thợ nghe qua điện thoại là được.

## Có gì trong này

| | |
|---|---|
| Đăng nhập | Mã PIN 4 số, lưu dạng băm scrypt. Cookie httpOnly ký bằng HMAC, hạn 60 ngày |
| Nhập khách | Một ô bắt buộc duy nhất là số điện thoại |
| Giọng nói | Thợ đọc → Gemini điền form. **File ghi âm không lưu ở đâu cả** |
| Dán số | Một nút lấy số vừa copy từ app Điện thoại |
| Chia sẻ số | Android: chia sẻ số từ app Điện thoại thẳng vào app này |
| Khách cũ | Gõ đủ số là hiện lịch sử: mấy lần, làm gì, tổng bao nhiêu |
| Mất sóng | Đơn nằm trên máy, có sóng tự gửi. Gửi lại nhiều lần cũng chỉ ra một đơn |
| Gõ dở | Giữ lại bản nháp, mở lại app là còn nguyên |
| Phát app | Mã QR trong màn Cài đặt, thợ quét là vào, không gõ chữ nào |
| Gần đây | Xem và sửa đơn 7 ngày qua, bổ sung tiền công |
| Bảo hành | Hạn 24 tháng ghi sẵn vào từng hạng mục ngay lúc tạo đơn |
| Cài đặt | Thêm thợ, đổi mã PIN, sửa hotline từng kênh |

## Về bảo mật

- Database **không mở ra ngoài**: RLS bật và không có policy nào, nên chỉ server
  của app vào được bằng service role key.
- Mã PIN lưu dạng băm scrypt có muối riêng từng người, không bao giờ lưu số trần.
- Cookie phiên ký bằng HMAC — sửa một ký tự là hỏng, kể cả sửa vai trò thành
  admin (có kiểm thử cho đúng trường hợp này).
- Thợ chỉ đọc và sửa được đơn của chính mình, và chỉ trong 7 ngày.
- Lỗi kỹ thuật ghi vào log máy chủ, thợ chỉ thấy câu tiếng Việt dễ hiểu.

## Kiểm thử

```bash
npm test          # logic thuần: số điện thoại, phiên, băm PIN, hạn bảo hành
npm run typecheck
npm run build
```

## Cấu trúc

```
app/nhap/          màn hình thợ (client)
app/admin/         cài đặt: thợ + hotline
app/api/           đăng nhập, đơn, tra khách, giọng nói, admin
lib/               danh mục, database, phiên, băm PIN, bảo hành
supabase/          SQL tạo bảng
scripts/           tạo admin đầu tiên
kiem-tra/          kiểm thử
```

## Chưa có (giai đoạn 3)

Duyệt đơn, gán nguồn quảng cáo, nhập báo cáo cuộc gọi Google Ads, tra cứu bảo
hành, và toàn bộ biểu đồ phân tích. Xem `../docs/KE-HOACH.md`.
