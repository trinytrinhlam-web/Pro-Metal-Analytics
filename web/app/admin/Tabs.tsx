"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MUC = [
  { href: "/admin", chu: "Phân tích" },
  { href: "/admin/duyet", chu: "Duyệt đơn" },
  { href: "/admin/bao-hanh", chu: "Khách cũ & bảo hành" },
  { href: "/admin/cai-dat", chu: "Cài đặt" },
];

export default function Tabs() {
  const duong = usePathname();
  const [cho, setCho] = useState(0);

  // Số đơn chờ duyệt hiện ngay trên tab, khỏi phải bấm vào mới biết.
  useEffect(() => {
    fetch("/api/admin/don?chua_duyet=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setCho(j.ds.length))
      .catch(() => {});
  }, [duong]);

  return (
    <nav className="qt-nav">
      {MUC.map((m) => (
        <Link key={m.href} href={m.href} aria-current={duong === m.href ? "page" : undefined}>
          {m.chu}
          {m.href === "/admin/duyet" && cho > 0 && <span className="ct">{cho}</span>}
        </Link>
      ))}
    </nav>
  );
}
