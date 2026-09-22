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

## Thợ cài lên điện thoại

Gửi link cho thợ:

- **Android (Chrome):** menu ⋮ → *Thêm vào màn hình chính*
- **iPhone (Safari):** nút chia sẻ → *Thêm vào MH chính*

Sau đó mở ra chạy toàn màn hình như app thật. Sửa code xong thợ chỉ cần mở lại.

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
