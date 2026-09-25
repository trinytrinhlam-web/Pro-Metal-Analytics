"use client";
import { useCallback, useEffect, useState } from "react";
import type { Hotline, Tho } from "@/lib/kieu";

const MAU_CHON: [string, string][] = [
  ["var(--s1)", "Xanh dương"], ["var(--s2)", "Cam"], ["var(--s3)", "Xanh lá"],
  ["var(--s4)", "Vàng"], ["var(--s5)", "Hồng"],
];

export default function CaiDat({ ten: _ten }: { ten: string }) {
  const [dsTho, setDsTho] = useState<Tho[]>([]);
  const [dsHl, setDsHl] = useState<Hotline[]>([]);
  const [loi, setLoi] = useState("");
  const [tenMoi, setTenMoi] = useState("");
  const [pinMoi, setPinMoi] = useState("");
  const [soMoi, setSoMoi] = useState("");
  const [kenhMoi, setKenhMoi] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [daCopy, setDaCopy] = useState("");
  const [ai, setAi] = useState<{ xong: boolean; chu: string; chiTiet: string; model: string } | null>(null);
  const [dangThu, setDangThu] = useState(false);

  // Địa chỉ app lấy từ chính trình duyệt, khỏi phải cấu hình thêm biến nào.
  useEffect(() => setDiaChi(window.location.origin), []);

  async function copyLoiNhan(tenTho: string, pin: string) {
    // Nhắc mở bằng Chrome/Safari: trình duyệt trong Zalo là một cái riêng, cài
    // lên màn hình chính từ đó không được và lần sau phải đăng nhập lại.
    const chu =
      `Anh/chị ${tenTho} làm giúp em 3 bước này, chỉ 1 lần thôi:\n\n` +
      `1. Mở link: ${diaChi}\n` +
      `   (Nếu bấm link ngay trong Zalo thì bấm dấu ... ở góc rồi chọn "Mở bằng trình duyệt")\n` +
      `2. Bấm menu trình duyệt → "Thêm vào màn hình chính"\n` +
      `3. Nhập mã: ${pin}\n\n` +
      `Xong rồi lần sau chỉ bấm biểu tượng ngoài màn hình, khỏi gõ link khỏi nhập mã lại.`;
    try {
      await navigator.clipboard.writeText(chu);
      setDaCopy(tenTho);
      setTimeout(() => setDaCopy(""), 2200);
    } catch {
      setLoi("Máy không cho copy. Bấm giữ để chọn rồi copy tay giúp.");
    }
  }

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
    <>
      <div className="panel">
        {loi && <div className="hint" style={{ borderLeftColor: "var(--crit)", marginBottom: 14 }}>{loi}</div>}

        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Phát app cho thợ</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink3)", margin: "0 0 12px" }}>
          Đưa điện thoại thợ quét mã này — không phải gõ chữ nào. Thợ chỉ làm một lần.
        </p>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start",
                      border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 12,
                      background: "var(--panel)" }}>
          {diaChi && (
            <img
              src={`/api/admin/qr?t=${encodeURIComponent(diaChi)}`}
              alt="Mã QR mở app"
              width={168}
              height={168}
              style={{ borderRadius: 10, background: "#fff", padding: 6, flex: "none" }}
            />
          )}
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div className="lb">Địa chỉ app</div>
            <div style={{ fontFamily: "Archivo,sans-serif", fontWeight: 800, fontSize: 17,
                          wordBreak: "break-all", marginBottom: 12 }}>
              {diaChi.replace(/^https?:\/\//, "")}
            </div>
            <div className="lb">Thợ làm ba việc</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.65 }}>
              <li>Mở camera điện thoại, chĩa vào mã QR, bấm vào link hiện ra</li>
              <li>Bấm menu trình duyệt → <b>Thêm vào màn hình chính</b></li>
              <li>Nhập mã PIN của mình — máy nhớ 60 ngày, không phải nhập lại</li>
            </ol>
            <div className="hint" style={{ marginTop: 12 }}>
              Từ lần sau thợ chỉ bấm biểu tượng trên màn hình chính như mọi app khác.
              Không gõ link, không đăng nhập lại.
            </div>
            <div className="hint" style={{ borderLeftColor: "var(--warn)", marginTop: 8 }}>
              <b>Quét QR bằng camera, đừng bấm link trong Zalo.</b> Zalo mở link bằng trình duyệt
              riêng của nó — không cài lên màn hình chính được, mà lần sau còn bắt đăng nhập lại.
              Nếu lỡ bấm trong Zalo thì bấm dấu <b>…</b> ở góc chọn <b>Mở bằng trình duyệt</b>.
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 16, margin: "24px 0 4px" }}>Thợ nhập liệu</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink3)", margin: "0 0 12px" }}>
          Mỗi thợ một mã PIN riêng để biết đơn nào ai nhập. Không cần số điện thoại, không cần email.
        </p>
        {dsTho.map((t) => (
          <div key={t.id} className="lead tho-dong" style={{ opacity: t.dang_dung ? 1 : 0.55 }}>
            <span className="mn">
              <b>{t.ten}</b>
              <span>{t.vai_tro === "admin" ? "Admin" : "Thợ"}{t.dang_dung ? "" : " · đã nghỉ"}</span>
            </span>
            {/* Trên điện thoại ba nút xuống hàng riêng — để chung một hàng thì
                tên thợ bị ép còn đúng một chữ cái. */}
            <span className="tho-nut">
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
              <button
                className="chip"
                title="Copy sẵn lời nhắn kèm link và mã, dán thẳng vào Zalo"
                onClick={() => {
                  const p = prompt(`Mã PIN của ${t.ten} để ghi vào lời nhắn:`);
                  if (p) copyLoiNhan(t.ten, p.replace(/\D/g, "").slice(0, 6));
                }}
              >
                {daCopy === t.ten ? "✓ Đã copy" : <><span className="chi-rong">Lời nhắn Zalo</span><span className="chi-hep">Nhắn Zalo</span></>}
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
            <div className="hl-dau" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <span style={{ width: 13, height: 13, borderRadius: 4, background: h.mau, flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <b style={{ fontSize: 14.5, display: "block", overflowWrap: "anywhere" }}>{h.kenh}</b>
                <span style={{ fontSize: 12, color: "var(--ink3)" }}>{h.dang_dung ? "đang dùng" : "đã ngừng dùng"}</span>
              </span>
              <button className="chip" onClick={() => goi("/api/admin/hotline", "PATCH", { id: h.id, dang_dung: !h.dang_dung })}>
                {h.dang_dung ? "Cho nghỉ" : "Dùng lại"}
              </button>
              <button className="chip" onClick={() => goi(`/api/admin/hotline?id=${h.id}`, "DELETE")}>Xoá</button>
            </div>
            <div className="hl-o">
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

      </div>

      <div className="panel">
        <h2>Nhập bằng giọng nói</h2>
        <p className="sub">
          Thợ bấm nút micro rồi đọc &quot;chị Lan không tám tám..., sửa cửa kéo ở Gò Vấp, bốn
          triệu tám&quot; — máy nghe rồi điền sẵn vào form, thợ chỉ việc soát lại rồi lưu.
          Cần khoá Gemini cắm vào Vercel. File ghi âm không lưu ở đâu cả.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          <button
            className="ghost"
            disabled={dangThu}
            onClick={async () => {
              setDangThu(true);
              try {
                const r = await fetch("/api/admin/kiem-tra-ai");
                setAi(await r.json());
              } catch {
                setAi({ xong: false, chu: "Không kiểm tra được.", chiTiet: "Thử lại sau ít phút.", model: "" });
              } finally {
                setDangThu(false);
              }
            }}
          >
            {dangThu ? "Đang thử…" : "Kiểm tra khoá Gemini"}
          </button>
          {ai && (
            <span style={{ fontWeight: 700, color: ai.xong ? "var(--good)" : "var(--crit)" }}>
              {ai.xong ? "✓" : "✕"} {ai.chu}
            </span>
          )}
        </div>
        {ai && (
          <div
            className="hint"
            style={{ marginTop: 10, borderLeftColor: ai.xong ? "var(--good)" : "var(--crit)" }}
          >
            {ai.chiTiet}
          </div>
        )}
      </div>
    </>
  );
}
