"use client";
import { useMemo, useState } from "react";
import { docBaoCao, khopVoiDon, type Khop } from "@/lib/doc-csv";
import { dinhDangSdt } from "@/lib/danh-muc";
import type { Hotline, KhachHang } from "@/lib/kieu";

/**
 * Nhập báo cáo "Chi tiết cuộc gọi" của Google Ads.
 *
 * Google Ads API không trả số điện thoại người gọi, nhưng báo cáo tải tay thì
 * có — nên đây là cách miễn phí để gán nguồn hàng loạt, thay vì ngồi bấm từng đơn.
 */
export default function NhapBaoCao({
  ds, hotlines, xongThi,
}: {
  ds: KhachHang[]; hotlines: Hotline[]; xongThi: () => void;
}) {
  const [mo, setMo] = useState(false);
  const [raw, setRaw] = useState("");
  const [loi, setLoi] = useState("");
  const [kq, setKq] = useState<Khop[] | null>(null);
  const [nguon, setNguon] = useState("");
  const [taoNhap, setTaoNhap] = useState(true);
  const [xong, setXong] = useState("");
  const [dangChay, setDangChay] = useState(false);

  const dem = useMemo(() => ({
    gan: kq?.filter((k) => k.viec === "gan").length ?? 0,
    sua: kq?.filter((k) => k.viec === "sua").length ?? 0,
    moi: kq?.filter((k) => k.viec === "moi").length ?? 0,
    bo: kq?.filter((k) => k.viec === "bo").length ?? 0,
  }), [kq]);

  function doc(noi: string) {
    setLoi("");
    const r = docBaoCao(noi);
    if ("loi" in r) { setLoi(r.loi); setKq(null); return; }
    setKq(khopVoiDon(r.ds, ds));
    if (!nguon && hotlines.length) {
      const g = hotlines.find((h) => /google/i.test(h.kenh)) ?? hotlines[0];
      setNguon(g.id);
    }
  }

  function datLai() {
    setMo(false); setRaw(""); setKq(null); setLoi(""); setXong("");
  }

  async function apDung() {
    if (!kq || !nguon) return;
    setDangChay(true);
    setLoi("");
    try {
      const canGan = kq.filter((k) => k.viec === "gan" || k.viec === "sua");
      let soGan = 0, soSua = 0, soTao = 0;

      for (const k of canGan) {
        const truong: Record<string, unknown> = {};
        if (k.viec === "sua") { truong.so_dien_thoai = k.goi.sdt; soSua++; }
        if (k.goi.giay) truong.giay_goi = k.goi.giay;
        const r = await fetch("/api/admin/don", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: [k.donId], hotline_id: nguon, truong }),
        });
        if (r.ok) soGan++;
      }

      const canTao = taoNhap ? kq.filter((k) => k.viec === "moi") : [];
      if (canTao.length) {
        const r = await fetch("/api/admin/don", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            hotline_id: nguon,
            ds: canTao.map((k) => ({
              sdt: k.goi.sdt,
              luc: k.goi.luc?.toISOString() ?? null,
              giay: k.goi.giay,
              // Trạng thái cuộc gọi đi theo đơn nháp luôn. Lúc duyệt mà chỉ
              // thấy "4 giây" thì không biết là khách cúp máy hay máy không đổ
              // chuông — ghi thẳng ra cho đỡ phải mở lại file báo cáo.
              tinh_trang: k.goi.trangThai || null,
            })),
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok) soTao = j.so ?? 0;
        else setLoi(j.loi || "Không tạo được đơn nháp.");
      }

      const ten = hotlines.find((h) => h.id === nguon)?.kenh ?? "";
      setXong(
        `Đã gán nguồn ${ten} cho ${soGan} đơn` +
        (soSua ? ` (trong đó sửa lại ${soSua} số điện thoại thợ gõ sai)` : "") +
        (soTao ? `, và tạo ${soTao} đơn nháp từ cuộc gọi chưa có trong hệ thống` : "") + "."
      );
      setKq(null);
      xongThi();
    } finally {
      setDangChay(false);
    }
  }

  if (xong) {
    return (
      <div className="imp mo">
        <h2>✓ Đã nhập xong</h2>
        <p className="sub">{xong}</p>
        <div className="imbar"><button className="go" onClick={datLai}>Nhập file khác</button></div>
      </div>
    );
  }

  if (kq) {
    const xem = kq.slice(0, 10);
    return (
      <div className="imp mo">
        <h2>📞 Đọc được {kq.length} cuộc gọi</h2>
        <div className="tomtat">
          <div className="o tot"><div className="k">Sẽ gán nguồn</div><div className="v">{dem.gan}</div></div>
          {dem.sua > 0 && <div className="o nhac"><div className="k">Gán + sửa số sai</div><div className="v">{dem.sua}</div></div>}
          <div className="o nhac"><div className="k">Chưa có đơn nào</div><div className="v">{dem.moi}</div></div>
          <div className="o mo"><div className="k">Đã có nguồn, bỏ qua</div><div className="v">{dem.bo}</div></div>
        </div>

        {dem.moi > 0 && (
          <label className="chon">
            <input type="checkbox" checked={taoNhap} onChange={(e) => setTaoNhap(e.target.checked)} />
            <span>
              <b>Tạo đơn nháp cho {dem.moi} cuộc gọi chưa có đơn.</b> Đây là khách đã gọi mà không có
              trong hệ thống — thợ quên nhập, hoặc không nghe được máy. Bạn đã trả tiền quảng cáo cho
              những cuộc này rồi.
            </span>
          </label>
        )}

        <div className="scrollx">
          <table className="bang">
            <thead>
              <tr><th>Gọi lúc</th><th>Số điện thoại</th><th className="n">Nói</th><th>Trạng thái</th><th>Việc sẽ làm</th></tr>
            </thead>
            <tbody>
              {xem.map((k, i) => (
                <tr key={i}>
                  <td>{k.goi.luc ? k.goi.luc.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td>{dinhDangSdt(k.goi.sdt)}</td>
                  <td className="n">{k.goi.giay ? `${k.goi.giay}s` : "—"}</td>
                  <td>{k.goi.trangThai || "—"}</td>
                  <td>
                    <span className={`vien v-${k.viec}`}>
                      {k.viec === "gan" ? "Gán nguồn"
                        : k.viec === "sua" ? `Gán + sửa số (${dinhDangSdt(k.sdtCu ?? "")} → ${dinhDangSdt(k.goi.sdt)})`
                        : k.viec === "moi" ? "Tạo đơn nháp" : "Bỏ qua"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {kq.length > 10 && <p className="sub" style={{ margin: "9px 0 0" }}>…và {kq.length - 10} dòng nữa.</p>}
        {loi && <div className="hint" style={{ borderLeftColor: "var(--crit)", marginTop: 10 }}>{loi}</div>}

        <div className="imbar">
          <span style={{ fontSize: 13 }}>Gán vào nguồn:</span>
          <select value={nguon} onChange={(e) => setNguon(e.target.value)}>
            {hotlines.map((h) => <option key={h.id} value={h.id}>{h.kenh}</option>)}
          </select>
          <button className="go" onClick={apDung} disabled={dangChay || !nguon}>
            {dangChay ? "Đang áp dụng…" : "Áp dụng"}
          </button>
          <button className="ghost" onClick={datLai}>Huỷ</button>
        </div>
      </div>
    );
  }

  if (!mo) {
    return (
      <div className="imp">
        <h2>📞 Nhập báo cáo cuộc gọi Google Ads</h2>
        <p className="sub">
          Tải báo cáo <b>Chi tiết cuộc gọi</b> từ Google Ads rồi thả vào đây — hệ thống tự khớp theo
          số điện thoại và gán nguồn hàng loạt. Nhanh hơn ngồi bấm từng đơn.
        </p>
        <div className="imbar"><button className="go" onClick={() => setMo(true)}>Mở phần nhập</button></div>
      </div>
    );
  }

  return (
    <div className="imp mo">
      <h2>📞 Nhập báo cáo cuộc gọi Google Ads</h2>
      <p className="sub">
        Trong Google Ads: <b>Chiến dịch → Insights &amp; báo cáo → Báo cáo → Chi tiết cuộc gọi</b>,
        nhớ bật cột <b>Số điện thoại người gọi</b>, rồi tải về .csv.
        <br />
        Chọn file, hoặc mở file bằng Excel rồi dán thẳng vào ô dưới.
      </p>
      <label htmlFor="im-file" className="ghost" style={{ display: "inline-block", cursor: "pointer", marginBottom: 10 }}>
        📁 Chọn file .csv
      </label>
      <input
        type="file" id="im-file" accept=".csv,.tsv,.txt,text/csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const fr = new FileReader();
          fr.onload = () => { const t = String(fr.result ?? ""); setRaw(t); doc(t); };
          fr.onerror = () => setLoi("Không đọc được file.");
          fr.readAsText(f, "utf-8");
        }}
      />
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)}
                placeholder="…hoặc dán nội dung báo cáo vào đây" />
      {loi && <div className="hint" style={{ borderLeftColor: "var(--crit)", marginTop: 10 }}>{loi}</div>}
      <div className="imbar">
        <button className="go" onClick={() => raw.trim() ? doc(raw) : setLoi("Chưa có nội dung nào để đọc.")}>
          Đọc thử
        </button>
        <button className="ghost" onClick={datLai}>Đóng</button>
      </div>
    </div>
  );
}
