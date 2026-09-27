"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// `ngan` là tên hiện trên điện thoại: bốn tab phải vừa một hàng, không thì
// thanh tab gãy làm hai dòng và chiếm gần nửa màn hình trước khi thấy dữ liệu.
const MUC = [
  { href: "/admin", chu: "Phân tích", ngan: "Phân tích" },
  { href: "/admin/duyet", chu: "Duyệt đơn", ngan: "Duyệt" },
  { href: "/admin/bao-hanh", chu: "Khách cũ & bảo hành", ngan: "Bảo hành" },
  { href: "/admin/cai-dat", chu: "Cài đặt", ngan: "Cài đặt" },
];

type Thieu = { file: string; them: string };

/** Màn Duyệt đơn phát sự kiện này sau khi sửa hoặc xoá đơn. */
export const SU_KIEN_DON_DOI = "csr-don-doi";

export default function Tabs() {
  const duong = usePathname();
  const [cho, setCho] = useState(0);
  const [thieu, setThieu] = useState<Thieu[]>([]);

  // Thợ là người thấy lỗi, còn chủ tiệm mới sửa được — nên báo ở đây, khỏi
  // phải chờ thợ gọi điện mách mới biết database chưa cập nhật.
  useEffect(() => {
    fetch("/api/admin/tinh-trang")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setThieu(j.thieu ?? []))
      .catch(() => {});
  }, []);

  // Số đơn chờ duyệt hiện ngay trên tab, khỏi phải bấm vào mới biết. Đếm lại
  // mỗi khi màn Duyệt đơn xác nhận hay xoá đơn — không thì xoá đơn cuối cùng
  // xong tab vẫn ghi "1", trông như xoá không ăn.
  useEffect(() => {
    const dem = () =>
      fetch("/api/admin/don?chua_duyet=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setCho(j.ds.length))
        .catch(() => {});
    dem();
    window.addEventListener(SU_KIEN_DON_DOI, dem);
    return () => window.removeEventListener(SU_KIEN_DON_DOI, dem);
  }, [duong]);

  return (
    <>
      {/* Dính ở đầu màn: trang Phân tích dài cả chục màn hình, cuộn xuống rồi
          muốn sang tab khác thì khỏi phải kéo ngược lên. */}
      <div className="qt-dinh">
        <nav className="qt-nav">
          {MUC.map((m) => (
            <Link key={m.href} href={m.href} aria-current={duong === m.href ? "page" : undefined}>
              <span className="chi-rong">{m.chu}</span>
              <span className="chi-hep">{m.ngan}</span>
              {m.href === "/admin/duyet" && cho > 0 && <span className="ct">{cho}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {thieu.length > 0 && (
        <div className="panel" style={{ background: "var(--crit-bg)", borderColor: "var(--crit)" }}>
          <h2 style={{ color: "var(--crit)" }}>⚠ Thợ đang không lưu được đơn</h2>
          <p className="sub">
            Phần mềm đã lên bản mới nhưng database chưa cập nhật theo, nên mỗi lần thợ bấm
            Lưu là hỏng. Đơn thợ nhập vẫn nằm an toàn trên máy họ và tự gửi lên ngay sau khi
            anh làm xong mấy bước dưới — không mất đơn nào.
          </p>
          <ol style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.85 }}>
            <li>Mở <b>Supabase</b> → <b>SQL Editor</b> → <b>New query</b></li>
            <li>
              Mở file{" "}
              {thieu.map((t, i) => (
                // Tên file dài hơn màn hình điện thoại hẹp, phải cho ngắt dòng
                // giữa chừng chứ không thì chữ chạy ra ngoài khung.
                <span key={t.file} style={{ wordBreak: "break-all" }}>
                  {i > 0 && ", "}
                  <b>supabase/migrations/{t.file}</b>
                </span>
              ))}{" "}
              trên GitHub, copy <b>toàn bộ</b>, dán vào
            </li>
            <li>Bấm <b>Run</b> → thấy <i>Success</i> là xong</li>
            <li>Tải lại trang này, dòng đỏ này biến mất</li>
          </ol>
          <p className="sub" style={{ marginTop: 10 }}>
            Chạy lại nhiều lần cũng không sao, không mất dữ liệu cũ.
          </p>
        </div>
      )}
    </>
  );
}
