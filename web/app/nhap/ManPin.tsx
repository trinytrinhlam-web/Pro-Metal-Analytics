"use client";
import { useState } from "react";

export default function ManPin({ xong }: { xong: (ten: string, vaiTro: string) => void }) {
  const [pin, setPin] = useState("");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);

  async function thu(ma: string) {
    setDangGui(true);
    try {
      const r = await fetch("/api/dang-nhap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: ma }),
      });
      const j = await r.json();
      if (!r.ok) {
        setLoi(j.loi || "Mã không đúng, thử lại.");
        setPin("");
      } else {
        xong(j.tho.ten, j.tho.vai_tro);
      }
    } catch {
      setLoi("Không có mạng. Bật lại sóng rồi thử.");
      setPin("");
    } finally {
      setDangGui(false);
    }
  }

  function bam(v: string) {
    if (dangGui) return;
    setLoi("");
    if (v === "x") return setPin((p) => p.slice(0, -1));
    const moi = (pin + v).slice(0, 6);
    setPin(moi);
    if (moi.length === 4) thu(moi);
  }

  return (
    <div className="pinwrap">
      <div className="pinbox">
        <h2 style={{ fontSize: 19, margin: "0 0 4px" }}>Nhập mã của bạn</h2>
        <p style={{ color: "var(--ink3)", fontSize: 13, margin: 0 }}>
          Mỗi thợ một mã riêng · không cần nhớ mật khẩu
        </p>
        <div className="pindots">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i < pin.length ? "on" : ""} />
          ))}
        </div>
        {loi && (
          <p style={{ color: "var(--crit)", fontSize: 13, fontWeight: 700, margin: "-14px 0 14px" }}>
            {loi}
          </p>
        )}
        <div className="pinpad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button key={n} onClick={() => bam(n)} disabled={dangGui}>
              {n}
            </button>
          ))}
          <button style={{ visibility: "hidden" }} tabIndex={-1} aria-hidden>
            ·
          </button>
          <button onClick={() => bam("0")} disabled={dangGui}>0</button>
          <button onClick={() => bam("x")} disabled={dangGui} aria-label="Xoá một số">⌫</button>
        </div>
      </div>
    </div>
  );
}
