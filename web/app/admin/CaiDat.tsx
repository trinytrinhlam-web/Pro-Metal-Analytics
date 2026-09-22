"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Hotline, Tho } from "@/lib/kieu";

const MAU_CHON: [string, string][] = [
  ["var(--s1)", "Xanh dương"], ["var(--s2)", "Cam"], ["var(--s3)", "Xanh lá"],
  ["var(--s4)", "Vàng"], ["var(--s5)", "Hồng"],
];

export default function CaiDat({ ten }: { ten: string }) {
  const [dsTho, setDsTho] = useState<Tho[]>([]);
  const [dsHl, setDsHl] = useState<Hotline[]>([]);
  const [loi, setLoi] = useState("");
  const [tenMoi, setTenMoi] = useState("");
  const [pinMoi, setPinMoi] = useState("");
  const [soMoi, setSoMoi] = useState("");
  const [kenhMoi, setKenhMoi] = useState("");

  const nap = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/admin/tho"), fetch("/api/admin/hotline")]);
    if (a.ok) setDsTho((await a.json()).ds);
    if (b.ok) setDsHl((await b.json()).ds);
  }, []);
  useEffect(() => { nap(); }, [nap]);

  async function goi(url: string, cach: string, than?: unknown) {
    setLoi("");
    const r = await fetch(url, {
      method: cach,
      headers: than ? { "content-type": "application/json" } : undefined,
      body: than ? JSON.stringify(than) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setLoi(j.loi || "Không lưu được."); return false; }
    await nap();
    return true;
  }

  return (
    <div className="app" style={{ maxWidth: 760 }}>
      <header className="appbar">
        <div className="who">
          <b>Cài đặt</b>
          <span>{ten} · admin</span>
        </div>
        <Link href="/nhap" className="pill" style={{ textDecoration: "none" }}>Màn nhập →</Link>
      </header>

      <div className="scroll" style={{ paddingBottom: 40 }}>
        {loi && <div className="hint" style={{ borderLeftColor: "var(--crit)", marginBottom: 14 }}>{loi}</div>}

        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Thợ nhập liệu</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink3)", margin: "0 0 12px" }}>
          Mỗi thợ một mã PIN riêng để biết đơn nào ai nhập. Không cần số điện thoại, không cần email.
        </p>
        {dsTho.map((t) => (
          <div key={t.id} className="lead" style={{ opacity: t.dang_dung ? 1 : 0.55, display: "flex", alignItems: "center" }}>
            <span className="mn">
              <b>{t.ten}</b>
              <span>{t.vai_tro === "admin" ? "Admin" : "Thợ"}{t.dang_dung ? "" : " · đã nghỉ"}</span>
            </span>
            <span style={{ display: "flex", gap: 7 }}>
              <button
                className="chip"
                onClick={() => {
                  const p = prompt(`Mã PIN mới cho ${t.ten} (4 số):`);
                  if (p) goi("/api/admin/tho", "PATCH", { id: t.id, pin: p });
                }}
              >
                Đổi mã
              </button>
              <button className="chip" onClick={() => goi("/api/admin/tho", "PATCH", { id: t.id, dang_dung: !t.dang_dung })}>
                {t.dang_dung ? "Cho nghỉ" : "Mở lại"}
              </button>
            </span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
          <div style={{ flex: "1 1 160px", minWidth: 0 }}>
            <div className="lb">Tên thợ mới</div>
            <input className="inp" value={tenMoi} onChange={(e) => setTenMoi(e.target.value)} placeholder="VD: Anh Hùng" />
          </div>
          <div style={{ flex: "0 1 130px" }}>
            <div className="lb">Mã PIN 4 số</div>
            <input className="inp" inputMode="numeric" maxLength={4} value={pinMoi}
              onChange={(e) => setPinMoi(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2580" />
          </div>
          <button
            className="chip"
            style={{ background: "var(--accent)", color: "var(--accent-on)", border: 0, padding: "13px 18px", fontWeight: 800 }}
            onClick={async () => {
              if (await goi("/api/admin/tho", "POST", { ten: tenMoi, pin: pinMoi })) {
                setTenMoi(""); setPinMoi("");
              }
            }}
          >
            + Thêm thợ
          </button>
        </div>

        <h2 style={{ fontSize: 16, margin: "28px 0 4px" }}>Hotline theo kênh</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink3)", margin: "0 0 10px" }}>
          Mỗi kênh quảng cáo một số riêng. Sửa được bất cứ lúc nào.
        </p>
        <div className="hint" style={{ marginBottom: 14 }}>
          <b>Đổi số mà không mất lịch sử:</b> đơn cũ gắn với <i>kênh</i> chứ không gắn với dãy số.
          Đổi số của Google Ads sang số mới thì đơn cũ vẫn nằm đúng ở Google Ads. Chỉ khi số mới
          dùng cho <i>một kênh khác</i> mới bấm Thêm hotline.
        </div>
        {dsHl.map((h) => (
          <div key={h.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 13, marginBottom: 9, opacity: h.dang_dung ? 1 : 0.55 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ width: 13, height: 13, borderRadius: 4, background: h.mau, flex: "none" }} />
              <span style={{ flex: 1, minWidth: 110, fontSize: 12.5, color: "var(--ink3)" }}>
                {h.dang_dung ? "đang dùng" : "đã ngừng dùng"}
              </span>
              <button className="chip" onClick={() => goi("/api/admin/hotline", "PATCH", { id: h.id, dang_dung: !h.dang_dung })}>
                {h.dang_dung ? "Cho nghỉ" : "Dùng lại"}
              </button>
              <button className="chip" onClick={() => goi(`/api/admin/hotline?id=${h.id}`, "DELETE")}>Xoá</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
              <div>
                <div className="lb">Số điện thoại</div>
                <input className="inp" defaultValue={h.so}
                  onBlur={(e) => e.target.value !== h.so && goi("/api/admin/hotline", "PATCH", { id: h.id, so: e.target.value })} />
              </div>
              <div>
                <div className="lb">Kênh</div>
                <input className="inp" defaultValue={h.kenh}
                  onBlur={(e) => e.target.value !== h.kenh && goi("/api/admin/hotline", "PATCH", { id: h.id, kenh: e.target.value })} />
              </div>
              <div>
                <div className="lb">Chi phí / tháng</div>
                <input className="inp" inputMode="numeric" defaultValue={h.chi_phi_thang ? h.chi_phi_thang.toLocaleString("vi-VN") : ""}
                  onBlur={(e) => {
                    const v = Number(e.target.value.replace(/\D/g, "")) || 0;
                    if (v !== h.chi_phi_thang) goi("/api/admin/hotline", "PATCH", { id: h.id, chi_phi_thang: v });
                  }} />
              </div>
              <div>
                <div className="lb">Màu trên biểu đồ</div>
                <select className="inp" defaultValue={h.mau}
                  onChange={(e) => goi("/api/admin/hotline", "PATCH", { id: h.id, mau: e.target.value })}>
                  {MAU_CHON.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
            <div className="lb">Số điện thoại mới</div>
            <input className="inp" value={soMoi} onChange={(e) => setSoMoi(e.target.value)} placeholder="0912 99 88 77" />
          </div>
          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
            <div className="lb">Kênh này dùng cho</div>
            <input className="inp" value={kenhMoi} onChange={(e) => setKenhMoi(e.target.value)} placeholder="TikTok" />
          </div>
          <button
            className="chip"
            style={{ background: "var(--accent)", color: "var(--accent-on)", border: 0, padding: "13px 18px", fontWeight: 800 }}
            onClick={async () => {
              if (await goi("/api/admin/hotline", "POST", { so: soMoi, kenh: kenhMoi })) {
                setSoMoi(""); setKenhMoi("");
              }
            }}
          >
            + Thêm hotline
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 28 }}>
          Phần duyệt đơn, bảo hành và biểu đồ phân tích nằm ở giai đoạn 3.
        </p>
      </div>
    </div>
  );
}
