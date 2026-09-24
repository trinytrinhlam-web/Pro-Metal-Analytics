-- Giai đoạn 3 — những thứ phần phân tích cần thêm
-- Chạy trong Supabase: SQL Editor → dán toàn bộ file này → Run
-- Chạy lại nhiều lần cũng không sao.

-- Khách cũ hay khách mới: quyết một lần lúc tạo đơn rồi ghi cứng vào đơn.
-- Nếu để tính lại mỗi lần xem báo cáo thì đơn nào cũng phải dò hết lịch sử,
-- mà kết quả còn đổi theo khoảng thời gian đang lọc — sai.
alter table khach_hang add column if not exists la_khach_cu boolean not null default false;

-- Đánh dấu lại cho những đơn đã có: đơn nào cùng số điện thoại mà không phải
-- lần liên hệ đầu tiên thì là khách cũ.
update khach_hang k
set la_khach_cu = true
where exists (
  select 1 from khach_hang t
  where t.so_dien_thoai = k.so_dien_thoai
    and t.thoi_diem < k.thoi_diem
    and t.thoi_diem < k.thoi_diem - interval '12 hours'   -- dưới 12 tiếng coi là nhập trùng
);

create index if not exists khach_sdt_thoi_diem_idx on khach_hang (so_dien_thoai, thoi_diem);
create index if not exists khach_duyet_idx on khach_hang (da_duyet, thoi_diem desc);

-- Mỗi lần đi bảo hành ghi một dòng, để sau biết hạng mục nào hay phải quay lại sửa.
create index if not exists bh_log_khach_idx on bao_hanh_log (khach_hang_id);
