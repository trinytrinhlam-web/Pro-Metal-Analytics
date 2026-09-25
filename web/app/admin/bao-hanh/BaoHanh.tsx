"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { baoHanhCuaDon, trangThaiBH } from "@/lib/phan-tich";
import { chuanSdt, dinhDangSdt } from "@/lib/danh-muc";
import { ngan, vnd } from "../../nhap/tienIch";
import type { KhachHang } from "@/lib/kieu";

type HangMuc = { id: string; dich_vu: string; bh_so_thang: number; bh_het_han: string; khach_hang_id: string };
type Log = { id: string; khach_hang_id: string; ngay: string; noi_dung: string | null; chi_phi: number | null };
type Khach = {
  sdt: string; ten: string; don: KhachHang[]; chot: KhachHang[];
  tong: number; cuoi: KhachHang; conLai: number | null; soBH: number;
};

const ngayVN = (d: Date | string) => new Date(d).toLocaleDateString("vi-VN");

export default function BaoHanh() {
  const [che, setChe] = useState<"tim" | "sap">("sap");
  const [q, setQ] = useState("");
  const [don, setDon] = useState<KhachHang[]>([]);
  const [hangMuc, setHangMuc] = useState<HangMuc[]>([]);
  const [log, setLog] = useState<Log[]>([]);
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [dangNap, setDangNap] = useState(false);
  const [loi, setLoi] = useState("");

  const nap = useCallback(async (url: string) => {
    setDangNap(true);
    setLoi("");
    try {
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok) { setLoi(j.loi || "Không đọc được dữ liệu."); return; }
      setDon(j.don ?? []);
      setHangMuc(j.hangMuc ?? []);
      setLog(j.log ?? []);
    } catch {
      setLoi("Không đọc được dữ liệu.");
    } finally {
      setDangNap(false);
    }
  }, []);

  useEffect(() => { nap("/api/admin/khach?sap_het=1"); }, [nap]);

  function tim() {
    const s = chuanSdt(q);
    if (s.length < 3) { setLoi("Gõ ít nhất 3 số."); return; }
    setChe("tim");
    nap(`/api/admin/khach?sdt=${s}`);
  }

  function veSapHet() {
    setChe("sap"); setQ(""); setMo({});
    nap("/api/admin/khach?sap_het=1");
  }

  const bhTheoDon = useMemo(() => {
    const m = new Map<string, HangMuc[]>();
    for (const h of hangMuc) m.set(h.khach_hang_id, [...(m.get(h.khach_hang_id) ?? []), h]);
    return m;
  }, [hangMuc]);

  const logTheoDon = useMemo(() => {
    const m = new Map<string, Log[]>();
    for (const g of log) m.set(g.khach_hang_id, [...(m.get(g.khach_hang_id) ?? []), g]);
    return m;
  }, [log]);

  /** Gom các lần liên hệ theo số điện thoại thành từng khách. */
  const khach = useMemo<Khach[]>(() => {
    const m = new Map<string, KhachHang[]>();
    for (const d of don) {
      const s = chuanSdt(d.so_dien_thoai);
      m.set(s, [...(m.get(s) ?? []), d]);
    }
    const ra: Khach[] = [];
    for (const [sdt, ds] of m) {
      const sap = [...ds].sort((a, b) => new Date(a.thoi_diem).getTime() - new Date(b.thoi_diem).getTime());
      const chot = sap.filter((d) => d.trang_thai === "da_chot");
      const con = chot
        .map((d) => Math.max(...conLaiCuaDon(d, bhTheoDon.get(d.id))))
        .filter((n) => Number.isFinite(n));
      ra.push({
        sdt,
        ten: [...sap].reverse().find((d) => d.ten)?.ten ?? "",
        don: sap,
        chot,
        tong: chot.reduce((s, d) => s + (d.doanh_thu ?? 0), 0),
        cuoi: sap[sap.length - 1],
        conLai: con.length ? Math.max(...con) : null,
        soBH: sap.reduce((s, d) => s + (logTheoDon.get(d.id)?.length ?? 0), 0),
      });
    }
    return ra.sort((a, b) =>
      che === "sap"
        ? (a.conLai ?? 1e9) - (b.conLai ?? 1e9)
        : new Date(b.cuoi.thoi_diem).getTime() - new Date(a.cuoi.thoi_diem).getTime()
    );
  }, [don, bhTheoDon, logTheoDon, che]);

  async function ghiBaoHanh(donId: string) {
    const noi = prompt("Ghi nhận một lần bảo hành — làm gì? (để trống cũng được)");
    if (noi === null) return;
    const r = await fetch("/api/admin/bao-hanh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ khach_hang_id: donId, noi_dung: noi }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setLoi(j.loi || "Không ghi được."); return; }
    setLog((cu) => [...cu, j.log]);
  }

  return (
    <>
      <div className="panel">
        <h2>Tra cứu bảo hành</h2>
        <p className="sub">
          Khách gọi tới báo hỏng thì gõ số điện thoại vào đây — ra ngay đã làm gì, ngày nào, còn hạn
          hay hết.
        </p>
        <div className="tracuu">
          <input
            inputMode="tel" placeholder="Gõ số điện thoại khách…" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tim()}
          />
          <button className="ghost" onClick={tim}>Tìm</button>
          {che === "tim" && <button className="ghost" onClick={veSapHet}>← Danh sách sắp hết hạn</button>}
        </div>
        {loi && <div className="hint" style={{ borderLeftColor: "var(--crit)", marginTop: 12 }}>{loi}</div>}
        {che === "tim" && !dangNap && (
          <div className="hint" style={{ marginTop: 12 }}>
            {khach.length
              ? <>Tìm thấy <b>{khach.length} khách</b> khớp số <b>{q}</b>.</>
              : <>Không có khách nào mang số <b>{q}</b>. Có thể là khách mới, hoặc số nhập sai lúc trước.</>}
          </div>
        )}
      </div>

      {che === "sap" && khach.length > 0 && (
        <div className="hint" style={{ borderLeftColor: "var(--warn)", margin: "0 0 12px" }}>
          <b>Đây là danh sách nên gọi.</b> Xếp gấp nhất lên đầu. Gọi hỏi thăm trước khi hết bảo
          hành vừa giữ được khách, vừa hay ra việc mới — mà không tốn đồng quảng cáo nào.
        </div>
      )}

      {dangNap ? (
        <div className="panel"><div className="rong">Đang đọc…</div></div>
      ) : khach.length ? (
        khach.map((k) => (
          <div className="kh" key={k.sdt}>
            <div className="kh-dau">
              <button className="hd" onClick={() => setMo((p) => ({ ...p, [k.sdt]: !p[k.sdt] }))}>
                <span className="nm">
                  <b>{k.ten || "(chưa có tên)"}</b>
                  <span>
                    {dinhDangSdt(k.sdt)}
                    <span className="chi-rong"> · {k.don.length} lần liên hệ · {k.chot.length} đơn đã làm</span>
                    <span className="chi-hep"> · {k.don.length} liên hệ · {k.chot.length} đơn</span>
                    {k.soBH > 0 && ` · đã bảo hành ${k.soBH} lần`}
                  </span>
                </span>
                <Nhan conLai={k.conLai} />
                <span className="rt">
                  <b>{ngan(k.tong)}</b>
                  <span className="chi-rong">gần nhất {ngayVN(k.cuoi.thoi_diem)}</span>
                </span>
                <span className="cv" style={{ color: "var(--ink3)", fontSize: 15 }}>{mo[k.sdt] ? "▴" : "▾"}</span>
              </button>
              {/* Danh sách này là để gọi — trên điện thoại bấm là gọi luôn, khỏi
                  phải nhớ số rồi gõ lại sang app Điện thoại. */}
              <a className="goi" href={`tel:${k.sdt}`} aria-label={`Gọi ${k.ten || "khách"} ${dinhDangSdt(k.sdt)}`}>
                {/* Vẽ bằng SVG thay cho emoji 📞: emoji là ống nghe màu đen, trên nền
                    tối gần như biến mất, mà mỗi hãng điện thoại vẽ một kiểu. */}
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z" />
                </svg>
                <span>Gọi</span>
              </a>
            </div>
            {mo[k.sdt] && (
              <div className="than">
                {[...k.don].reverse().map((d) => (
                  <ViecDaLam
                    key={d.id} d={d}
                    hangMuc={bhTheoDon.get(d.id) ?? []}
                    log={logTheoDon.get(d.id) ?? []}
                    ghi={() => ghiBaoHanh(d.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="panel">
          <div className="rong">
            <b>{che === "sap" ? "Không có đơn nào sắp hết bảo hành." : "Không tìm thấy khách nào."}</b>
            {che === "sap" ? "Trong 60 ngày tới chưa có hạn bảo hành nào đến." : "Thử gõ ít số hơn."}
          </div>
        </div>
      )}
    </>
  );
}

function conLaiCuaDon(d: KhachHang, hm?: HangMuc[]): number[] {
  if (hm?.length) {
    const nay = Date.now();
    return hm.map((h) => Math.ceil((new Date(h.bh_het_han).getTime() - nay) / 864e5));
  }
  // Đơn cũ chưa có hạng mục ghi sẵn thì tính tạm theo mặc định.
  return baoHanhCuaDon(new Date(d.thoi_diem), d.dich_vu ?? []).map((x) => x.conLai);
}

function Nhan({ conLai }: { conLai: number | null }) {
  if (conLai === null) return <span className="tt tt-het">CHƯA CÓ ĐƠN NÀO</span>;
  const t = trangThaiBH(conLai);
  // Bản ngắn cho điện thoại: nhãn dài đẩy số tiền xuống dòng riêng.
  return (
    <span className={`tt tt-${t}`}>
      {t === "con" ? <><span className="chi-rong">CÒN BẢO HÀNH {conLai} NGÀY</span><span className="chi-hep">CÒN HẠN · {conLai} NGÀY</span></>
        : t === "sap" ? <><span className="chi-rong">SẮP HẾT · CÒN {Math.max(0, conLai)} NGÀY</span><span className="chi-hep">SẮP HẾT · {Math.max(0, conLai)} NGÀY</span></>
        : "HẾT BẢO HÀNH"}
    </span>
  );
}

function ViecDaLam({
  d, hangMuc, log, ghi,
}: {
  d: KhachHang; hangMuc: HangMuc[]; log: Log[]; ghi: () => void;
}) {
  const ngay = new Date(d.thoi_diem);
  const daLam = d.trang_thai === "da_chot";
  const gop = hangMuc.length
    ? gomHangMuc(hangMuc)
    : daLam ? baoHanhCuaDon(ngay, d.dich_vu ?? []).map((x) => ({
        dichVu: x.dichVu, thang: x.thang, hetHan: x.hetHan, conLai: x.conLai,
      })) : [];

  return (
    <div className="viec">
      <div className="t">
        <b>{ngayVN(ngay)} {ngay.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</b>
        <span className={`tag t-${d.trang_thai}`}>
          {daLam ? "Đã làm" : d.trang_thai === "hoi_gia" ? "Chỉ hỏi giá" : "Từ chối"}
        </span>
        <span>{d.dich_vu?.join(", ") || "—"}</span>
        {d.doanh_thu ? <b style={{ marginLeft: "auto" }}>{vnd(d.doanh_thu)}</b> : null}
      </div>

      {gop.length > 0 && (
        <>
          <div className="bh">
            {gop.map((m, i) => {
              return (
                <div className="r" key={i}>
                  <span>{m.dichVu} <span className="d">· bảo hành {m.thang} tháng</span></span>
                  <span className="d">đến {ngayVN(m.hetHan)}</span>
                  <Nhan conLai={m.conLai} />
                </div>
              );
            })}
          </div>
          <div className="bhlog">
            {log.length ? (
              <div className="lansua">
                <b>Đã bảo hành {log.length} lần</b>
                {/* Ghi ra việc đã làm, không chỉ ngày — lần sau khách gọi lại là
                    biết ngay lần trước sửa gì, khỏi đoán. */}
                {[...log]
                  .sort((a, b) => (a.ngay < b.ngay ? 1 : -1))
                  .map((g) => (
                    <div className="l" key={g.id}>
                      <span className="d">{ngayVN(g.ngay)}</span>
                      <span>{g.noi_dung || "(không ghi chú)"}</span>
                      {g.chi_phi ? <span className="d">{vnd(g.chi_phi)}</span> : null}
                    </div>
                  ))}
              </div>
            ) : (
              <span style={{ color: "var(--ink3)" }}>Chưa lần nào gọi bảo hành</span>
            )}
            <button className="ghost" onClick={ghi}>+ Ghi nhận một lần bảo hành</button>
          </div>
        </>
      )}

      {d.khu_vuc && (
        <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 7 }}>
          {d.khu_vuc}{d.loai_cong_trinh ? ` · ${d.loai_cong_trinh}` : ""}
        </div>
      )}
    </div>
  );
}

/** Hạng mục cùng ngày hết hạn thì gộp một dòng cho gọn. */
function gomHangMuc(hm: HangMuc[]) {
  const m = new Map<string, { dv: string[]; thang: number; het: string }>();
  for (const h of hm) {
    const khoa = `${h.bh_so_thang}|${h.bh_het_han}`;
    const g = m.get(khoa) ?? { dv: [], thang: h.bh_so_thang, het: h.bh_het_han };
    g.dv.push(h.dich_vu);
    m.set(khoa, g);
  }
  const nay = Date.now();
  return [...m.values()].map((g) => ({
    dichVu: g.dv.join(", "),
    thang: g.thang,
    hetHan: new Date(g.het),
    conLai: Math.ceil((new Date(g.het).getTime() - nay) / 864e5),
  }));
}
