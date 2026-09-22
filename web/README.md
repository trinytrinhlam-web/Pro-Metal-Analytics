# Bản thật — giai đoạn 2

App nhập khách cho thợ, chạy thật với database. Next.js + Supabase.

> Bản demo giao diện nằm ở `../demo` và vẫn chạy độc lập, không liên quan tới
> thư mục này.

## Chạy lần đầu

### 1. Tạo database

Vào [supabase.com](https://supabase.com) → tạo project mới (gói miễn phí đủ dùng).

Mở **SQL Editor** → dán toàn bộ `supabase/migrations/0001_khoi_tao.sql` → **Run**.

### 2. Khai báo khoá

```bash
cp .env.example .env.local
```

Điền vào `.env.local`:

| Biến | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | cùng trang, mục **service_role** — **khoá bí mật, không đưa cho ai** |
| `SESSION_SECRET` | tự tạo: `openssl rand -base64 32` |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) — để trống thì nút ghi âm tự ẩn |

### 3. Tạo tài khoản admin đầu tiên

```bash
npm install
node scripts/tao-admin.mjs "Anh Lâm" 1234
```

Từ lần sau bạn tự thêm thợ trong màn Cài đặt, không cần chạy script này nữa.

### 4. Chạy

```bash
npm run dev      # mở http://localhost:3000/nhap
```

Nhập mã PIN vừa tạo. Vào `/admin` để thêm thợ và sửa hotline.

## Đưa lên mạng

Đẩy code lên GitHub rồi nối với Vercel. Nhớ khai lại bốn biến môi trường ở
Vercel → Settings → Environment Variables (đừng đưa `.env.local` lên git).

Trỏ DNS: `app.suachuacuasat.com` → CNAME → `cname.vercel-dns.com`

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
