"use client";
import { useEffect, useState } from "react";

export default function KhoiTao() {
  const [trangThai, setTrangThai] = useState<"dang-xem" | "san-sang" | "da-co" | "hong">("dang-xem");
  const [loi, setLoi] = useState("");
  const [ten, setTen] = useState("");
  const [pin, setPin] = useState("");
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    fetch("/api/khoi-tao")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) { setLoi(j.loi || ""); return setTrangThai("hong"); }
        setTrangThai(j.san_sang ? "san-sang" : "da-co");
      })
      .catch(() => setTrangThai("hong"));
  }, []);

  async function tao() {
    setDangGui(true);
    setLoi("");
    try {
      const r = await fetch("/api/khoi-tao", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ten, pin }),
      });
      const j = await r.json();
      if (!r.ok) setLoi(j.loi || "Không tạo được.");
      else window.location.href = "/admin";
    } catch {
      setLoi("Không nối được máy chủ.");
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="app">
      <div className="pinwrap">
        <div className="pinbox" style={{ maxWidth: 380, textAlign: "left" }}>
          <h2 style={{ fontSize: 20, margin: "0 0 6px", textAlign: "center" }}>
            Tạo tài khoản đầu tiên
          </h2>

          {trangThai === "dang-xem" && (
            <p style={{ color: "var(--ink3)", fontSize: 13.5, textAlign: "center" }}>Đang kiểm tra…</p>
          )}

          {trangThai === "hong" && (
            <div className="hint" style={{ borderLeftColor: "var(--crit)" }}>
              <b>Chưa nối được database.</b>
              <br />
              {loi || "Kiểm tra lại khoá Supabase."} Sau đó tải lại trang này.
            </div>
          )}

          {trangThai === "da-co" && (
            <div className="hint">
              <b>Đã có tài khoản rồi.</b>
              <br />
              Vào <a href="/nhap">màn nhập liệu</a> và nhập mã PIN của bạn. Thêm thợ mới thì làm
              trong <a href="/admin">Cài đặt</a>.
            </div>
          )}

          {trangThai === "san-sang" && (
            <>
              <p style={{ color: "var(--ink3)", fontSize: 13.5, margin: "0 0 18px", textAlign: "center" }}>
                Tài khoản này là admin — xem được toàn bộ số liệu và thêm thợ.
              </p>

              <div className="fld">
                <div className="lb">Tên của bạn</div>
                <input
                  className="inp"
                  value={ten}
                  onChange={(e) => setTen(e.target.value)}
                  placeholder="VD: Anh Lâm"
                  autoComplete="off"
                />
              </div>

              <div className="fld">
                <div className="lb">Mã PIN 4 số <i>dùng để đăng nhập</i></div>
                <input
                  className="inp big"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="2580"
                />
                <div className="hint">
                  Nhớ kỹ mã này. Quên thì phải vào Supabase xoá dòng trong bảng <b>tho</b> rồi tạo lại.
                </div>
              </div>

              {loi && (
                <div className="hint" style={{ borderLeftColor: "var(--crit)", marginBottom: 12 }}>{loi}</div>
              )}

              <button
                className="mic"
                onClick={tao}
                disabled={dangGui || !ten.trim() || pin.length < 4}
                style={{ opacity: dangGui || !ten.trim() || pin.length < 4 ? 0.6 : 1 }}
              >
                {dangGui ? "Đang tạo…" : "Tạo tài khoản"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
