import Link from "next/link";
import { phienHienTai } from "@/lib/phien";
import CaiDat from "./CaiDat";

export const dynamic = "force-dynamic";

export default async function TrangAdmin() {
  const phien = await phienHienTai();
  if (!phien) {
    return (
      <div className="app">
        <div className="pinwrap">
          <div className="pinbox">
            <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>Chưa đăng nhập</h2>
            <p style={{ color: "var(--ink3)", fontSize: 13.5 }}>
              Vào <Link href="/nhap">màn nhập liệu</Link> nhập mã PIN của tài khoản admin trước.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (phien.vaiTro !== "admin") {
    return (
      <div className="app">
        <div className="pinwrap">
          <div className="pinbox">
            <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>Phần này chỉ dành cho admin</h2>
            <p style={{ color: "var(--ink3)", fontSize: 13.5 }}>
              Bạn đang đăng nhập bằng mã của {phien.ten}.{" "}
              <Link href="/nhap">Quay lại màn nhập</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <CaiDat ten={phien.ten} />;
}
