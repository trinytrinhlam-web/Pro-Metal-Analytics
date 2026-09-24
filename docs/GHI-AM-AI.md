# Nhập bằng giọng nói (Gemini)

Thợ bấm một nút, đọc một hơi, máy tự điền vào các ô. Nút nằm **ngay đầu trang
nhập**, trên tất cả mọi thứ khác.

## Luồng chạy

```
1. Thợ bấm "● Bấm để nói"
2. Máy ghi âm ngay trên điện thoại (MediaRecorder, webm/opus, mono)
3. Thợ bấm "Dừng lại"
4. File tải lên kho tạm trên server
5. Server gọi Gemini: "nghe file này, trả về JSON theo mẫu"
6. Gemini trả JSON -> app điền vào form, đánh dấu rõ ô nào do máy điền
7. Thợ đọc lại, sửa chỗ sai
8. Thợ bấm LƯU KHÁCH
   ├─ ghi đơn vào database
   └─ XOÁ FILE GHI ÂM ngay lập tức
```

**Điểm bạn yêu cầu — xoá file ngay sau khi confirm — nằm ở bước 8.** Ngoài ra còn
một lớp dọn dẹp thứ hai (xem phần "Không để sót file" bên dưới), vì nếu thợ đọc
xong rồi tắt app giữa chừng thì bước 8 không bao giờ chạy.

## Mẫu JSON yêu cầu Gemini trả về

Gọi Gemini ở chế độ trả dữ liệu có cấu trúc (structured output / responseSchema),
đừng để nó trả văn xuôi rồi tự bóc tách:

```json
{
  "ten": "Anh Minh",
  "so_dien_thoai": "0935223864",
  "gioi_tinh": "nam",
  "dich_vu": ["Cửa cổng", "Khung bảo vệ"],
  "khu_vuc": "Gò Vấp",
  "loai_cong_trinh": "Nhà phố",
  "trang_thai": "da_chot",
  "ly_do_tu_choi": null,
  "doanh_thu": 4800000,
  "ghi_chu": null,
  "do_tin_cay": { "so_dien_thoai": 0.72, "doanh_thu": 0.95 }
}
```

Trong prompt phải đưa kèm **danh sách giá trị hợp lệ** của dịch vụ, khu vực, loại
công trình và lý do từ chối, bắt Gemini chọn trong đó chứ không tự chế. Trường nào
không nghe ra thì để `null` — thà trống còn hơn đoán bừa.

`do_tin_cay` dùng để tô đỏ những ô máy không chắc, nhắc thợ kiểm kỹ ô đó.

## Không để sót file trên server

Chỉ dựa vào bước 8 là chưa đủ. Ba lớp:

| Lớp | Khi nào chạy |
|---|---|
| 1. Xoá ngay khi thợ bấm Lưu | Trường hợp bình thường |
| 2. Xoá khi thợ bấm "Đọc lại từ đầu" hoặc rời trang | Thợ đổi ý |
| 3. Dọn định kỳ: xoá mọi file quá 30 phút | Thợ tắt app, mất sóng, app treo |

Lớp 3 làm bằng scheduled function chạy mỗi 15 phút. Không có lớp này thì file rác
vẫn đọng lại — đúng cái bạn không muốn.

Đặt thêm quy tắc tự huỷ (lifecycle rule) trên thư mục lưu tạm cho chắc ăn.

Kho tạm để **private**, không ai mở bằng link được. Thợ chỉ ghi lên được, không
đọc lại được file của người khác.

## Những chỗ sẽ trục trặc thật

Nói trước để không vỡ trận lúc chạy thử:

**Số điện thoại là chỗ sai nhiều nhất.** Tiếng Việt đọc số rất dễ lẫn: "năm" với
"lăm", "không" với "o", "một" với "mốt", "bốn" với "tư". Vì vậy:
- Ô số điện thoại **luôn được đánh dấu là cần kiểm**, dù máy có chắc hay không
- Dạy thợ đọc số theo cụm ba: "không chín ba năm — hai hai ba — tám sáu bốn"
- Nếu thấy sai nhiều, bắt thợ đọc số hai lần và cho Gemini đối chiếu

**Tiếng ồn xưởng.** Máy cắt, máy hàn, máy mài chạy là hỏng hết. Nhắc thợ bước ra
chỗ yên hơn, hoặc đọc lúc vừa dập máy khách xong.

**Giọng vùng miền.** Cần thử thật với chính thợ của bạn trong một tuần rồi mới
kết luận. Nếu một thợ nào dùng không được thì người đó cứ gõ tay như cũ — công cụ
này là thêm lựa chọn, không thay thế việc gõ.

**Mất sóng giữa chừng.** Bản ghi giữ lại trên máy, có sóng thì tự gửi. Không gửi
được sau 3 lần thì báo thợ nhập tay, và xoá bản ghi.

**Máy luôn có thể nghe sai.** Nên các ô AI điền đều được tô viền cam kèm nhãn
"AI điền", và **không bao giờ tự lưu** — phải có thợ bấm Lưu.

## Chi phí

Gemini tính tiền theo lượng âm thanh gửi lên. Mỗi lần thợ đọc chỉ 20–40 giây nên
chi phí một đơn rất nhỏ, nhưng **hãy tự tra bảng giá hiện hành của Google** khi
làm thay vì tin con số ước chừng — giá và tên model thay đổi liên tục.

Chọn model có hỗ trợ đầu vào âm thanh; kiểm tra tên model mới nhất trong tài liệu
Google Gemini API lúc bắt tay vào làm.

Cách giữ chi phí thấp: ghi mono, giới hạn tối đa 60 giây một lần đọc, nén trước
khi gửi.

## Một lưu ý về quyền riêng tư

Công cụ này thiết kế cho **thợ tự đọc lại thông tin**, không phải để ghi âm cuộc
gọi với khách. Ghi âm người khác khi họ không biết là chuyện khác hẳn về mặt pháp
lý. Trong ứng dụng nên có một dòng nhắc thợ điều này, và không làm tính năng ghi
âm cuộc gọi.

## Chữ giữ lại, tiếng xoá đi

Đã chốt: **giữ lại nguyên văn lời thợ đọc**, lưu vào ô **Ghi chú** của đơn.

```
File âm thanh  ->  xoá ngay khi thợ bấm Lưu
Chữ đã nghe    ->  ở lại trong ô Ghi chú
```

Chỉ là mấy dòng chữ nên không nặng server, mà sau này tra lại biết thợ đã nói gì —
hữu ích nhất khi cần đối chiếu một đơn có tranh cãi, hoặc khi muốn xem máy nghe
sai chỗ nào để chỉnh lại cách đọc.

Thợ sửa hoặc xoá đoạn chữ đó được, vì nó nằm ngay trong ô Ghi chú bình thường. Ô
này có nhãn *“lời bạn vừa đọc, sửa hoặc xoá được”* để thợ khỏi tưởng là chữ lạ.


## Cắm khoá vào (làm một lần)

1. [aistudio.google.com](https://aistudio.google.com) → **Get API key**
2. Vercel → **Settings → Environment Variables** → tên biến `GEMINI_API_KEY`,
   khoá dán vào ô **Value**
3. **Redeploy**
4. `/admin` → **Cài đặt** → **Kiểm tra khoá Gemini**

Nút kiểm tra hỏi thẳng Google xem model có dùng được không — nhẹ, không tốn
token, và phân biệt được ba thứ mà trước đây ra cùng một câu báo lỗi: khoá sai,
tên model sai, và hết hạn mức.

Chưa cắm khoá thì thanh ghi âm tự ẩn khỏi màn thợ.

## Tên model đổi thì làm sao

Google khai tử model cũ khá nhanh, và tên cũ là **chết hẳn** chứ không chạy tạm.
Mặc định hiện tại là `gemini-3.8-flash`.

Đổi bằng biến `GEMINI_MODEL` trên Vercel rồi Redeploy — **không phải sửa code**.
Nút kiểm tra sẽ báo `Không có model tên "..."` khi gặp trường hợp này.
