"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  chiPhiKy, demTheo, doanhThuTheoDichVu, khoangKy, kyTruoc, luoiGioThu,
  phanTram, soNgay, theoNgay, theoNguon, tongHop, type Ky,
} from "@/lib/phan-tich";
import { ngan, vnd } from "../nhap/tienIch";
import { DuongTheoNgay, GIO_THEO_DOI, LuoiGioThu, THU_DAY, ThanhNgang, Vong } from "./bieu-do";
import { DICH_VU, dinhDangSdt } from "@/lib/danh-muc";
import type { Hotline, KhachHang } from "@/lib/kieu";

const KY: [Ky, string][] = [["7", "7 ngày qua"], ["30", "30 ngày qua"], ["thang", "Tháng này"], ["truoc", "Tháng trước"]];
const fpc = (n: number) => String(n).replace(".", ",");

export default function PhanTich() {
  const [ky, setKy] = useState<Ky>("30");
  const [nguon, setNguon] = useState("");
  const [tho, setTho] = useState("");
  const [dichVu, setDichVu] = useState("");
  const [khuVuc, setKhuVuc] = useState("");
  const [moLoc, setMoLoc] = useState(false);
  const [ds, setDs] = useState<KhachHang[]>([]);
  const [dsTruoc, setDsTruoc] = useState<KhachHang[]>([]);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [dsTho, setDsTho] = useState<{ id: string; ten: string }[]>([]);
  const [dangNap, setDangNap] = useState(true);
  const [loi, setLoi] = useState("");

  const nap = useCallback(async () => {
    setDangNap(true);
    setLoi("");
    try {
      const [a, b] = khoangKy(ky);
      const [ta, tb] = kyTruoc(ky);
      const lay = (tu: Date, den: Date) =>
        fetch(`/api/admin/don?tu=${tu.toISOString()}&den=${den.toISOString()}`).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).loi || "Không đọc được dữ liệu.");
          return (await r.json()).ds as KhachHang[];
        });
      const [nay, truoc, hl, th] = await Promise.all([
        lay(a, b),
        lay(ta, tb),
        fetch("/api/admin/hotline").then((r) => (r.ok ? r.json() : { ds: [] })),
        fetch("/api/admin/tho").then((r) => (r.ok ? r.json() : { ds: [] })),
      ]);
      setDs(nay);
      setDsTruoc(truoc);
      setHotlines(hl.ds);
      setDsTho(th.ds);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đọc được dữ liệu.");
    } finally {
      setDangNap(false);
    }
  }, [ky]);

  useEffect(() => { nap(); }, [nap]);

  const loc = useCallback(
    (l: KhachHang[]) =>
      l.filter(
        (d) =>
          (!nguon || (nguon === "__chua__" ? !d.hotline_id : d.hotline_id === nguon)) &&
          (!tho || d.tho_id === tho) &&
          (!dichVu || (d.dich_vu ?? []).includes(dichVu)) &&
          (!khuVuc || d.khu_vuc === khuVuc)
      ),
    [nguon, tho, dichVu, khuVuc]
  );

  /**
   * Chỉ liệt kê phường xã thật sự có khách, chứ không đổ cả 168 phường ra —
   * cuộn tìm trong danh sách dài chỉ để thấy phần lớn là số 0 thì lọc làm gì.
   */
  const khuVucCoKhach = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of ds) if (d.khu_vuc) m.set(d.khu_vuc, (m.get(d.khu_vuc) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi"));
  }, [ds]);

  const so = useMemo(() => {
    const ngay = soNgay(ky);
    const nay = loc(ds);
    const truoc = loc(dsTruoc);
    const chi = nguon === "__chua__" ? 0 : chiPhiKy(hotlines, ngay, nguon || null);
    return {
      ngay,
      nay,
      A: tongHop(nay, chi),
      P: tongHop(truoc, chi),
      nguon: theoNguon(nay, hotlines, ngay),
    };
  }, [ds, dsTruoc, hotlines, ky, nguon, loc]);

  const { A, P, nay } = so;
  const soLoc = [nguon, tho, dichVu, khuVuc].filter(Boolean).length;
  const [tu] = khoangKy(ky);

  if (loi) {
    return (
      <div className="panel">
        <div className="rong">
          <b>Không đọc được dữ liệu</b>
          {loi}
        </div>
      </div>
    );
  }

  return (
    <>
      {/*
        Trên điện thoại chỉ để một hàng: chọn kỳ (dùng nhiều nhất) + nút Lọc +
        tải lại. Bốn bộ lọc kia bấm Lọc mới mở ra — để sẵn cả bảy nút thì gãy
        thành năm dòng, chiếm nửa màn hình trước khi thấy con số nào.
        Trên máy tính thì vẫn bày hết ra một hàng như cũ.
      */}
      <div className={`loc loc-pt${moLoc ? " mo" : ""}`}>
        <select value={ky} onChange={(e) => setKy(e.target.value as Ky)} aria-label="Khoảng thời gian">
          {KY.map(([v, c]) => <option key={v} value={v}>{c}</option>)}
        </select>
        <button className="ghost loc-nut chi-hep" aria-expanded={moLoc} onClick={() => setMoLoc((v) => !v)}>
          Lọc{soLoc ? ` (${soLoc})` : ""} {moLoc ? "▴" : "▾"}
        </button>
        <div className="loc-them">
          <select value={nguon} onChange={(e) => setNguon(e.target.value)} aria-label="Nguồn">
            <option value="">Tất cả nguồn</option>
            {hotlines.map((h) => (
              <option key={h.id} value={h.id}>{h.kenh}{h.dang_dung ? "" : " (ngừng dùng)"}</option>
            ))}
            <option value="__chua__">Chưa rõ nguồn</option>
          </select>
          <select value={tho} onChange={(e) => setTho(e.target.value)} aria-label="Thợ">
            <option value="">Tất cả thợ</option>
            {dsTho.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
          </select>
          <select value={dichVu} onChange={(e) => setDichVu(e.target.value)} aria-label="Dịch vụ">
            <option value="">Tất cả dịch vụ</option>
            {DICH_VU.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={khuVuc} onChange={(e) => setKhuVuc(e.target.value)} aria-label="Phường xã">
            <option value="">Tất cả phường xã</option>
            {khuVucCoKhach.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
          </select>
          {soLoc > 0 && (
            <button className="ghost" onClick={() => { setNguon(""); setTho(""); setDichVu(""); setKhuVuc(""); }}>
              ✕ Bỏ lọc
            </button>
          )}
          <button className="ghost" onClick={() => xuatCsv(nay, hotlines)}>⬇ Xuất Excel</button>
        </div>
        <button className="ghost loc-tai" onClick={nap} aria-label="Tải lại">
          {dangNap ? "…" : "↻"}<span className="chi-rong"> {dangNap ? "Đang đọc" : "Tải lại"}</span>
        </button>
      </div>

      {/*
        Tiền quảng cáo ghi theo kênh, không chẻ được theo thợ, dịch vụ hay phường
        xã. Lọc mấy cái đó xong vẫn lấy nguyên chi phí cả kênh chia cho một phần
        khách, nên CPL/CPA/ROAS đội lên — phải nói rõ, không thì dễ cắt nhầm một
        kênh đang chạy tốt.
      */}
      {(tho || dichVu || khuVuc) && (
        <div className="panel" style={{ background: "var(--warn-bg)", borderColor: "var(--warn)" }}>
          <span style={{ fontSize: 13.5 }}>
            <b>Đang lọc theo {[tho && "thợ", dichVu && "dịch vụ", khuVuc && "phường xã"].filter(Boolean).join(", ")}.</b>{" "}
            Tiền quảng cáo chỉ ghi được theo kênh chứ không chia nhỏ theo mấy mục này,
            nên <b>giá 1 khách, giá 1 đơn và ROAS trong lúc lọc chỉ để tham khảo</b> —
            muốn quyết định tăng giảm ngân sách thì bỏ lọc ra xem.
          </span>
        </div>
      )}

      {A.chuaDuyet > 0 && (
        <div className="panel" style={{ background: "var(--warn-bg)", borderColor: "var(--warn)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
              <b>{A.chuaDuyet} đơn chưa xác nhận.</b> Chưa gán nguồn thì chưa biết kênh nào ra tiền.
            </span>
            <Link href="/admin/duyet" className="ghost" style={{ textDecoration: "none", flex: "none" }}>Duyệt ngay →</Link>
          </div>
        </div>
      )}

      <div className="kpis">
        <Kpi k="Khách gọi đến" v={String(A.n)} d={chenh(A.n, P.n)} />
        <Kpi k="Đã chốt" v={`${A.chot} (${fpc(A.ty)}%)`} d={chenh(A.ty, P.ty, "tỷ lệ chốt")} />
        <Kpi k="Doanh thu" v={ngan(A.dt)} d={chenh(A.dt, P.dt)} />
        <Kpi k="Trung bình / đơn" v={ngan(A.tb)} d={chenh(A.tb, P.tb)} />
        <Kpi k="Chi phí quảng cáo" v={ngan(A.chi)} d={<span className="d bang">{vnd(Math.round(A.cpl))} / khách mới</span>} />
        <Kpi k="Chi phí / đơn chốt" v={ngan(A.cpa)} d={chenh(A.cpa, P.cpa, "CPA", true)} />
        <Kpi
          k="ROAS khách mới"
          v={`${fpc(Math.round(A.roas * 10) / 10)}×`}
          d={<span className={`d ${A.roas >= 4 ? "len" : "xuong"}`}>mỗi 1đ quảng cáo thu về {Math.round(A.roas)}đ</span>}
        />
      </div>

      <KhungGio ds={nay} />
      <BangNguon rows={so.nguon} />
      <KhachCu A={A} ds={nay} />

      <div className="panel">
        <h2>Khách theo từng ngày</h2>
        <p className="sub">Số khách gọi đến mỗi ngày trong kỳ đang xem.</p>
        <DuongTheoNgay ds={theoNgay(nay, tu, so.ngay)} />
      </div>

      <div className="grid2">
        <GioiTinh ds={nay} />
        <DichVu ds={nay} />
      </div>
      <div className="grid2">
        <div className="panel">
          <h2>Khách ở phường xã nào</h2>
          <p className="sub">Dùng để khoanh bán kính target quảng cáo, khỏi tốn tiền cho vùng không ai gọi.</p>
          <ThanhNgang ds={demTheo(nay, (l) => l.khu_vuc)} dinhDang={(n) => `${n} khách`} />
        </div>
        <TuChoi ds={nay} />
      </div>

      <GoiY A={A} ds={nay} rows={so.nguon} />
      <BangChiTiet ds={nay} hotlines={hotlines} dsTho={dsTho} />
    </>
  );
}

function Kpi({ k, v, d }: { k: string; v: string; d: React.ReactNode }) {
  return (
    <div className="kpi">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {d}
    </div>
  );
}

function chenh(a: number, b: number, dv = "so với kỳ trước", nguocLai = false) {
  if (!b) return <span className="d bang">— chưa có kỳ trước</span>;
  const p = Math.round(((a - b) / b) * 1000) / 10;
  const tot = nguocLai ? p < 0 : p > 0;
  const lop = p === 0 ? "bang" : tot ? "len" : "xuong";
  return <span className={`d ${lop}`}>{p > 0 ? "▲ +" : p < 0 ? "▼ " : ""}{fpc(p)}% {dv}</span>;
}

function KhungGio({ ds }: { ds: KhachHang[] }) {
  const { luoi, max } = luoiGioThu(ds, GIO_THEO_DOI);
  const theoGio = demTheo(ds, (l) => String(new Date(l.thoi_diem).getHours()));
  const theoThu = demTheo(ds, (l) => THU_DAY[(new Date(l.thoi_diem).getDay() + 6) % 7]);
  const top3 = theoGio.slice(0, 3);
  const pc3 = phanTram(top3.reduce((s, x) => s + x[1], 0), ds.length);

  return (
    <div className="panel">
      <h2>Khách gọi vào lúc nào</h2>
      <p className="sub">
        Đếm số khách theo khung giờ và thứ trong tuần. Ô càng đậm càng nhiều khách — đây là bảng
        dùng để đặt lịch chạy quảng cáo.
      </p>
      <LuoiGioThu luoi={luoi} max={max} />
      {ds.length > 0 && top3.length > 0 && (
        <div className="hint" style={{ marginTop: 14 }}>
          <b>Đọc nhanh:</b> 3 khung giờ đông nhất là{" "}
          <b>{top3.map(([h]) => `${h}–${+h + 1}h`).join(", ")}</b>, gom {fpc(pc3)}% lượng khách.
          {theoThu.length > 0 && (
            <> Ngày đông nhất trong tuần: <b>{theoThu[0][0]}</b> ({theoThu[0][1]} khách).</>
          )}
        </div>
      )}
    </div>
  );
}

function BangNguon({ rows }: { rows: ReturnType<typeof theoNguon> }) {
  const maxdt = Math.max(1, ...rows.map((r) => r.dt));
  const chuaRo = rows.find((r) => !r.hotline);
  return (
    <div className="panel">
      <h2>Từng số hotline mang về gì</h2>
      <p className="sub">
        Mỗi kênh quảng cáo một số điện thoại riêng, nên tiền bỏ ra và tiền thu về khớp đúng từng kênh.
      </p>
      <div className="scrollx chi-rong">
        <table className="bang">
          <thead>
            <tr>
              <th>Hotline / kênh</th><th className="n">Khách</th><th className="n">Chốt</th>
              <th className="n">Tỷ lệ</th><th className="n">Doanh thu</th><th style={{ width: 110 }} />
              <th className="n">Chi phí QC</th><th className="n">Giá 1 khách mới</th>
              <th className="n">Giá 1 đơn mới</th><th className="n">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hotline?.id ?? "chua"}>
                <td>
                  <span className="sw" style={{ background: r.hotline?.mau ?? "var(--ink3)" }} />
                  <b>{r.hotline?.kenh ?? "Chưa rõ nguồn"}</b>
                  <br />
                  <span style={{ color: "var(--ink3)", fontSize: 11.5, paddingLeft: 17 }}>
                    {r.hotline?.so ?? "chưa gán"}{r.hotline && !r.hotline.dang_dung ? " · ngừng dùng" : ""}
                  </span>
                </td>
                <td className="n">
                  {r.n}
                  {r.cu > 0 && <><br /><span style={{ color: "var(--ink3)", fontSize: 11, fontWeight: 600 }}>{r.cu} khách cũ</span></>}
                </td>
                <td className="n">{r.chot}</td>
                <td className="n">
                  <span className={`nhan ${r.ty >= 45 ? "n-good" : r.ty >= 28 ? "n-warn" : "n-crit"}`}>{fpc(r.ty)}%</span>
                </td>
                <td className="n"><b>{ngan(r.dt)}</b></td>
                <td><div className="thanh"><i style={{ width: `${Math.round((r.dt / maxdt) * 100)}%`, background: r.hotline?.mau ?? "var(--ink3)" }} /></div></td>
                <td className="n">{r.chi ? ngan(r.chi) : "—"}</td>
                <td className="n">{r.chi ? vnd(Math.round(r.cpl / 1000) * 1000) : "—"}</td>
                <td className="n">{r.chi && r.cpa ? vnd(Math.round(r.cpa / 1000) * 1000) : "—"}</td>
                <td className="n">{r.chi ? <b className={r.roas < 3 ? "xuong" : "len"}>{fpc(Math.round(r.roas * 10) / 10)}×</b> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/*
        Điện thoại: mỗi kênh một thẻ. Bảng 10 cột trên màn hẹp chỉ thấy tới cột
        "Chốt", còn doanh thu, chi phí, giá 1 khách, ROAS — đúng mấy số dùng để
        quyết định tăng giảm ngân sách — thì khuất hết bên phải.
      */}
      <div className="nguon-the chi-hep">
        {rows.map((r) => (
          <div className="nt" key={r.hotline?.id ?? "chua"}>
            <div className="nt-dau">
              <span className="sw" style={{ background: r.hotline?.mau ?? "var(--ink3)" }} />
              <span className="nt-ten">
                <b>{r.hotline?.kenh ?? "Chưa rõ nguồn"}</b>
                <span>{r.hotline?.so ?? "chưa gán"}{r.hotline && !r.hotline.dang_dung ? " · ngừng dùng" : ""}</span>
              </span>
              <span className="nt-roas">
                <b className={r.chi ? (r.roas < 3 ? "xuong" : "len") : "bang"}>
                  {r.chi ? `${fpc(Math.round(r.roas * 10) / 10)}×` : "—"}
                </b>
                <small>ROAS</small>
              </span>
            </div>
            <div className="nt-so">
              <div><small>Khách</small><b>{r.n}</b>{r.cu > 0 && <i>{r.cu} cũ</i>}</div>
              <div>
                <small>Chốt</small><b>{r.chot}</b>
                <i className={`nhan ${r.ty >= 45 ? "n-good" : r.ty >= 28 ? "n-warn" : "n-crit"}`}>{fpc(r.ty)}%</i>
              </div>
              <div><small>Doanh thu</small><b>{ngan(r.dt)}</b></div>
              <div><small>Chi phí QC</small><b>{r.chi ? ngan(r.chi) : "—"}</b></div>
              <div><small>1 khách mới</small><b>{r.chi ? ngan(Math.round(r.cpl / 1000) * 1000) : "—"}</b></div>
              <div><small>1 đơn mới</small><b>{r.chi && r.cpa ? ngan(Math.round(r.cpa / 1000) * 1000) : "—"}</b></div>
            </div>
          </div>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 14 }}>
        Giá 1 khách, giá 1 đơn và ROAS chỉ tính trên <b>khách mới</b>. Khách cũ gọi lại không tốn
        đồng quảng cáo nào nên gộp vào sẽ làm các con số này đẹp giả.
      </div>
      {chuaRo && chuaRo.n > 0 && (
        <div className="hint" style={{ borderLeftColor: "var(--warn)", marginTop: 10 }}>
          <b>{chuaRo.n} khách chưa rõ nguồn.</b> Những khách này chưa tính được vào CPL, CPA và ROAS.{" "}
          <Link href="/admin/duyet">Gán nguồn ở màn Duyệt đơn →</Link>
        </div>
      )}
    </div>
  );
}

function KhachCu({ A, ds }: { A: ReturnType<typeof tongHop>; ds: KhachHang[] }) {
  const cu = ds.filter((l) => l.la_khach_cu);
  const cuChot = cu.filter((l) => l.trang_thai === "da_chot");
  const tyCu = phanTram(cuChot.length, cu.length);
  const tyMoi = phanTram(A.chot - cuChot.length, A.moi);
  return (
    <div className="panel">
      <h2>Khách cũ quay lại</h2>
      <p className="sub">
        Khách gọi lại lần hai trở đi — nhận ra bằng số điện thoại. Đây là doanh thu không tốn đồng
        quảng cáo nào.
      </p>
      {cu.length ? (
        <>
          <div className="kpis" style={{ marginBottom: 0 }}>
            <Kpi k="Lượt gọi lại" v={String(cu.length)} d={<span className="d bang">{fpc(phanTram(cu.length, ds.length))}% tổng số khách</span>} />
            <Kpi k="Doanh thu" v={ngan(A.dtCu)} d={<span className="d bang">{fpc(phanTram(A.dtCu, A.dt))}% tổng doanh thu · chi phí 0đ</span>} />
            <Kpi
              k="Tỷ lệ chốt"
              v={`${fpc(tyCu)}%`}
              d={<span className="d bang">khách mới {fpc(tyMoi)}% — {tyCu > tyMoi ? `cao hơn ${fpc(Math.round((tyCu - tyMoi) * 10) / 10)} điểm` : tyCu < tyMoi ? `thấp hơn ${fpc(Math.round((tyMoi - tyCu) * 10) / 10)} điểm` : "ngang nhau"}</span>}
            />
          </div>
          <div className="hint" style={{ marginTop: 14 }}>
            <b>Dùng để làm gì:</b>{" "}
            {tyCu > tyMoi
              ? "khách cũ chốt cao hơn khách mới mà không tốn đồng quảng cáo nào, nên mỗi đồng giữ chân khách cũ đang đáng giá hơn mỗi đồng kéo khách mới. "
              : "nhóm này tuy chốt chưa cao hơn khách mới nhưng không tốn đồng quảng cáo nào, nên lãi trên mỗi đơn vẫn cao hơn hẳn. "}
            Có chính sách riêng cho họ (giá ưu đãi, bảo hành, gọi chăm sóc sau 6–12 tháng) thì lợi
            nhuận lên mà ngân sách quảng cáo không đổi.
          </div>
        </>
      ) : (
        <p style={{ color: "var(--ink3)", fontSize: 13 }}>Chưa có khách nào gọi lại trong kỳ này.</p>
      )}
    </div>
  );
}

function GioiTinh({ ds }: { ds: KhachHang[] }) {
  const t = (g: "nam" | "nu") => {
    const a = ds.filter((l) => l.gioi_tinh === g);
    const c = a.filter((l) => l.trang_thai === "da_chot");
    const dt = c.reduce((s, l) => s + (l.doanh_thu ?? 0), 0);
    return { n: a.length, ty: phanTram(c.length, a.length), tb: c.length ? dt / c.length : 0 };
  };
  const nam = t("nam"), nu = t("nu");
  return (
    <div className="panel">
      <h2>Khách nam hay khách nữ</h2>
      <p className="sub">Không chỉ đếm đầu người — xem bên nào chốt nhiều hơn và trả cao hơn.</p>
      <div className="gt">
        <Vong a={nam.n} b={nu.n} nhanA="khách nam" nhanB="khách nữ" />
        <div>
          <table className="bang">
            <thead><tr><th /><th className="n">Khách</th><th className="n">Tỷ lệ chốt</th><th className="n">TB/đơn</th></tr></thead>
            <tbody>
              <tr><td><span className="sw" style={{ background: "var(--s1)" }} />Nam</td><td className="n">{nam.n}</td><td className="n">{fpc(nam.ty)}%</td><td className="n">{ngan(nam.tb)}</td></tr>
              <tr><td><span className="sw" style={{ background: "var(--s5)" }} />Nữ</td><td className="n">{nu.n}</td><td className="n">{fpc(nu.ty)}%</td><td className="n">{ngan(nu.tb)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DichVu({ ds }: { ds: KhachHang[] }) {
  return (
    <div className="panel">
      <h2>Dịch vụ nào ra tiền</h2>
      <p className="sub">Doanh thu đã chốt, chia đều khi một đơn gồm nhiều hạng mục.</p>
      <ThanhNgang ds={doanhThuTheoDichVu(ds)} mau="var(--s3)" dinhDang={ngan} />
      <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div className="lb">Loại công trình</div>
        <ThanhNgang ds={demTheo(ds, (l) => l.loai_cong_trinh)} mau="var(--s4)" dinhDang={(n) => `${n} khách`} />
      </div>
    </div>
  );
}

function TuChoi({ ds }: { ds: KhachHang[] }) {
  const tc = ds.filter((l) => l.trang_thai === "tu_choi");
  return (
    <div className="panel">
      <h2>Vì sao khách không làm</h2>
      <p className="sub">{tc.length} khách từ chối trong kỳ. Đây là chỗ nhìn ra quảng cáo đang kéo nhầm người.</p>
      <ThanhNgang ds={demTheo(tc, (l) => l.ly_do_tu_choi)} mau="var(--s2)" dinhDang={(n) => `${n} khách`} />
    </div>
  );
}

function GoiY({ A, ds, rows }: { A: ReturnType<typeof tongHop>; ds: KhachHang[]; rows: ReturnType<typeof theoNguon> }) {
  const the: [string, string, React.ReactNode][] = [];
  const theoGio = demTheo(ds, (l) => String(new Date(l.thoi_diem).getHours()));

  if (theoGio.length >= 4) {
    const top = theoGio.slice(0, 4).map(([h]) => +h).sort((a, b) => a - b);
    const yeu = theoGio.slice(-3).map(([h]) => `${h}h`);
    the.push(["n-good", "TĂNG", (
      <>
        <b>Đặt lịch quảng cáo:</b> dồn ngân sách vào <b>{top.map((h) => `${h}h`).join(", ")}</b> — 4 khung
        này gom {fpc(phanTram(theoGio.slice(0, 4).reduce((s, x) => s + x[1], 0), ds.length))}% lượng khách.
        Hạ giá thầu hoặc tắt hẳn khung {yeu.join(", ")}.
      </>
    )]);
  }

  const traTien = rows.filter((r) => r.chi > 0).sort((a, b) => a.roas - b.roas);
  if (traTien.length) {
    const yeu = traTien[0], manh = traTien[traTien.length - 1];
    const lo = yeu.roas < 3;
    the.push([lo ? "n-crit" : "n-warn", lo ? "CẮT" : "XEM LẠI", (
      <>
        <b>{yeu.hotline?.kenh}</b> tốn {ngan(yeu.chi)} mà chỉ ra {yeu.chot} đơn — mỗi đơn{" "}
        <b>{ngan(yeu.cpa)}</b>, ROAS {fpc(Math.round(yeu.roas * 10) / 10)}× (thấp nhất trong các kênh).{" "}
        {lo ? "Cắt 30–50% ngân sách kênh này" : "Giữ nguyên ngân sách nhưng siết lại từ khoá và khung giờ"}
        {manh !== yeu && <>, phần dôi ra dồn sang {manh.hotline?.kenh}</>}.
      </>
    )]);
    if (manh !== yeu) {
      the.push(["n-good", "TĂNG", (
        <>
          <b>{manh.hotline?.kenh}</b> đang cho ROAS <b>{fpc(Math.round(manh.roas * 10) / 10)}×</b>, tỷ lệ
          chốt {fpc(manh.ty)}%. Tăng ngân sách từng bước 20%/tuần và theo dõi lại bảng trên.
        </>
      )]);
    }
  }

  const lyDo = demTheo(ds.filter((l) => l.trang_thai === "tu_choi"), (l) => l.ly_do_tu_choi);
  if (lyDo.length) {
    const mo: Record<string, string> = {
      "Giá cao": "Quảng cáo đang hút khách săn giá rẻ — thêm khoảng giá vào mẫu quảng cáo để lọc bớt.",
      "Ở quá xa": "Thu hẹp bán kính target lại quanh khu vực bạn nhận việc.",
      "Đã thuê thợ khác": "Khách so sánh nhiều nơi — cần gọi lại nhanh hơn và có báo giá sẵn.",
      "Không liên lạc lại được": "Nhiều số ảo hoặc bấm nhầm — kiểm tra vị trí hiển thị quảng cáo.",
      "Chỉ hỏi tham khảo": "Khách chưa có nhu cầu thật — chỉnh từ khoá về nhóm cần làm ngay.",
    };
    const tc = ds.filter((l) => l.trang_thai === "tu_choi").length;
    the.push(["n-warn", "XEM LẠI", (
      <>
        <b>{lyDo[0][0]}</b> chiếm {fpc(phanTram(lyDo[0][1], tc))}% số khách từ chối. {mo[lyDo[0][0]] ?? ""}
      </>
    )]);
  }

  if (A.cu > 0) {
    the.push(["n-good", "TĂNG", (
      <>
        <b>{fpc(phanTram(A.dtCu, A.dt))}% doanh thu</b> ({ngan(A.dtCu)}) đến từ {A.cu} lượt khách gọi
        lại — không tốn đồng quảng cáo nào. Trước khi tăng ngân sách kéo khách mới, thử nhắn lại nhóm
        đã làm trên 6 tháng.
      </>
    )]);
  }
  if (A.thieuTien > 0) {
    the.push(["n-warn", "XEM LẠI", (
      <>
        <b>{A.thieuTien} đơn đã chốt chưa điền tiền công</b> nên doanh thu và ROAS ở trên đang bị tính
        thiếu. Nhắc thợ mở lại đơn trong màn “Gần đây”.
      </>
    )]);
  }

  if (!the.length) return null;
  return (
    <div className="panel">
      <h2>Nên làm gì với quảng cáo tuần này</h2>
      <p className="sub">Máy đọc số liệu ở trên rồi tự viết ra — mỗi lần đổi bộ lọc sẽ tính lại.</p>
      <div className="goiy">
        {the.map(([lop, nhan, noi], i) => (
          <div className="the" key={i}>
            <h3><span className={`nhan ${lop}`}>{nhan}</span></h3>
            <p>{noi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BangChiTiet({ ds, hotlines, dsTho }: { ds: KhachHang[]; hotlines: Hotline[]; dsTho: { id: string; ten: string }[] }) {
  const rows = ds.slice(0, 30);
  const kenh = (id: string | null) => hotlines.find((h) => h.id === id);
  return (
    <div className="panel">
      <h2>Chi tiết khách gần nhất</h2>
      <p className="sub">Đang hiện {rows.length} trên {ds.length} khách trong kỳ. Bấm “Xuất Excel” ở trên để lấy đủ.</p>
      <div className="scrollx chi-rong">
        <table className="bang">
          <thead>
            <tr><th>Thời điểm</th><th>Khách</th><th>Điện thoại</th><th>Nguồn</th><th>Dịch vụ</th>
                <th>Phường xã</th><th>Kết quả</th><th className="n">Tiền công</th><th>Thợ nhập</th></tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const h = kenh(l.hotline_id);
              const d = new Date(l.thoi_diem);
              return (
                <tr key={l.id}>
                  <td>{d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td><b>{l.ten || "(chưa có tên)"}</b>{l.la_khach_cu && <span style={{ color: "var(--ink3)" }}> · khách cũ</span>}</td>
                  <td>{l.so_dien_thoai}</td>
                  <td><span className="sw" style={{ background: h?.mau ?? "var(--ink3)" }} />{h?.kenh ?? "Chưa rõ"}</td>
                  <td>{l.dich_vu?.join(", ") || "—"}</td>
                  <td>{l.khu_vuc || "—"}</td>
                  <td>
                    <span className={`tag t-${l.trang_thai}`}>
                      {l.trang_thai === "da_chot" ? "Đã chốt" : l.trang_thai === "hoi_gia" ? "Hỏi giá" : `Từ chối${l.ly_do_tu_choi ? ` · ${l.ly_do_tu_choi}` : ""}`}
                    </span>
                  </td>
                  <td className="n">{l.doanh_thu ? vnd(l.doanh_thu) : "—"}</td>
                  <td>{dsTho.find((t) => t.id === l.tho_id)?.ten ?? (l.tu_bao_cao ? "báo cáo cuộc gọi" : "—")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Điện thoại: mỗi khách ba dòng ngắn thay cho bảng 9 cột phải cuộn ngang. */}
      <div className="ct-ds chi-hep">
        {rows.map((l) => {
          const h = kenh(l.hotline_id);
          const d = new Date(l.thoi_diem);
          return (
            <div className="ct" key={l.id}>
              <div className="ct-1">
                <b>{l.ten || "(chưa có tên)"}</b>
                {l.la_khach_cu && <span className="cu">khách cũ</span>}
                <span className={`tag t-${l.trang_thai}`}>
                  {l.trang_thai === "da_chot" ? "Đã chốt" : l.trang_thai === "hoi_gia" ? "Hỏi giá" : "Từ chối"}
                </span>
              </div>
              <div className="ct-2">
                {d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}{" "}
                {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · {dinhDangSdt(l.so_dien_thoai)} ·{" "}
                <span className="sw" style={{ background: h?.mau ?? "var(--ink3)" }} />{h?.kenh ?? "Chưa rõ nguồn"}
              </div>
              <div className="ct-3">
                <span>
                  {[l.dich_vu?.join(", "), l.khu_vuc, l.trang_thai === "tu_choi" ? l.ly_do_tu_choi : null]
                    .filter(Boolean).join(" · ") || "—"}
                </span>
                {l.doanh_thu ? <b>{vnd(l.doanh_thu)}</b> : null}
              </div>
            </div>
          );
        })}
      </div>
      {!ds.length && <div className="rong"><b>Chưa có khách nào trong kỳ này.</b>Đổi khoảng thời gian ở trên, hoặc chờ thợ nhập.</div>}
    </div>
  );
}

/** Xuất ra .csv mở thẳng bằng Excel. Thêm BOM để Excel không vỡ dấu tiếng Việt. */
function xuatCsv(ds: KhachHang[], hotlines: Hotline[]) {
  const dau = ["Thời điểm","Tên khách","Số điện thoại","Giới tính","Nguồn","Dịch vụ","Phường xã",
               "Loại công trình","Kết quả","Lý do từ chối","Tiền công","Khách cũ","Đã duyệt","Ghi chú"];
  const o = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const dong = ds.map((l) => [
    new Date(l.thoi_diem).toLocaleString("vi-VN"),
    l.ten, l.so_dien_thoai,
    l.gioi_tinh === "nu" ? "Nữ" : l.gioi_tinh === "nam" ? "Nam" : "",
    hotlines.find((h) => h.id === l.hotline_id)?.kenh ?? "Chưa rõ nguồn",
    l.dich_vu?.join(" / "), l.khu_vuc, l.loai_cong_trinh,
    l.trang_thai === "da_chot" ? "Đã chốt" : l.trang_thai === "hoi_gia" ? "Hỏi giá" : "Từ chối",
    l.ly_do_tu_choi, l.doanh_thu ?? "", l.la_khach_cu ? "x" : "", l.da_duyet ? "x" : "", l.ghi_chu,
  ].map(o).join(","));

  const noi = "﻿" + [dau.map(o).join(","), ...dong].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([noi], { type: "text/csv;charset=utf-8" }));
  a.download = `khach-hang-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
