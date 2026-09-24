import Link from "next/link";
import { phienHienTai } from "@/lib/phien";
import Tabs from "./Tabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const phien = await phienHienTai();

  if (!phien) {
    return (
      <div className="app">
        <div className="pinwrap">
          <div className="pinbox">
            <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>Chưa đăng nhập</h2>
            <p style={{ color: "var(--ink3)", fontSize: 13.5 }}>
              Vào <Link href="/nhap">màn nhập liệu</Link> nhập mã PIN admin trước.
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

  return (
    <div className="quantri">
      <header className="qt-top">
        <div className="ten">
          <b>Cửa Sắt Lead Radar</b>
          <span>{phien.ten} · admin</span>
        </div>
        <Link href="/nhap" className="ghost" style={{ textDecoration: "none" }}>
          Màn thợ nhập →
        </Link>
      </header>
      <Tabs />
      {children}
    </div>
  );
}
