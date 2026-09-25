"use client";
import { useEffect, useRef, useState } from "react";
import { ddmm } from "../nhap/tienIch";

/**
 * Mấy hình vẽ dùng chung. Vẽ bằng SVG và CSS, không kéo thêm thư viện nào —
 * biểu đồ ở đây đơn giản, kéo cả một thư viện vào chỉ làm app nặng thêm.
 *
 * Màu lấy từ bộ 5 màu đã kiểm: người mù màu vẫn phân biệt được, và đọc rõ ở cả
 * nền sáng lẫn nền tối.
 */

export const GIO_THEO_DOI = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
export const THU_NGAN = ["T2","T3","T4","T5","T6","T7","CN"];
export const THU_DAY = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","Chủ nhật"];

function daMau(p: number) {
  return p ? `color-mix(in srgb, var(--s1) ${p}%, var(--panel2))` : "var(--panel2)";
}

export function LuoiGioThu({ luoi, max }: { luoi: number[][]; max: number }) {
  const o = (v: number, i: number, j: number) => {
    const dam = max ? Math.round(14 + 86 * Math.pow(v / max, 0.75)) : 0;
    return (
      <div
        className="o"
        title={`${THU_DAY[i]}, ${GIO_THEO_DOI[j]}h: ${v} khách`}
        style={{ background: v ? daMau(dam) : "var(--panel2)", color: dam > 58 ? "#fff" : "var(--ink2)" }}
      >
        {v || ""}
      </div>
    );
  };

  return (
    <>
      {/* Máy tính: thứ là hàng, giờ là cột. */}
      <div className="scrollx chi-rong">
        <table className="hm">
          <tbody>
            <tr>
              <th />
              {GIO_THEO_DOI.map((h) => <th key={h}>{h}</th>)}
            </tr>
            {luoi.map((hang, i) => (
              <tr key={i}>
                <td className="rh">{THU_NGAN[i]}</td>
                {hang.map((v, j) => <td key={j}>{o(v, i, j)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Điện thoại: xoay lại — giờ là hàng, thứ là cột. 17 cột giờ không vừa màn
        hình hẹp, phải cuộn ngang mới thấy, mà khung đông khách nhất lại hay rơi
        vào 17–19h ở tít bên phải. Xoay đi thì 7 cột thứ vừa khít, thấy đủ hết.
      */}
      <table className="hm hm-doc chi-hep">
        <colgroup>
          <col style={{ width: 36 }} />
          {THU_NGAN.map((t) => <col key={t} />)}
        </colgroup>
        <thead>
          <tr>
            <th />
            {THU_NGAN.map((t) => <th key={t}>{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {GIO_THEO_DOI.map((h, j) => (
            <tr key={h}>
              <td className="rh">{h}h</td>
              {luoi.map((hang, i) => <td key={i}>{o(hang[j], i, j)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="chugiai">
        <span>Ít</span>
        {[0, 25, 50, 75, 100].map((p) => (
          <span key={p} style={{ width: 24, height: 12, borderRadius: 3, background: daMau(p) }} />
        ))}
        <span>Nhiều</span>
        <span style={{ marginLeft: "auto", color: "var(--ink3)" }}>Cao nhất: {max} khách / ô</span>
      </div>
    </>
  );
}

export function DuongTheoNgay({ ds }: { ds: { ngay: Date; n: number }[] }) {
  // Vẽ đúng bằng bề rộng khung chứa. Trước đây vẽ khổ 720 rồi ép tối thiểu
  // 520px: trên điện thoại cả chục ngày gần nhất nằm khuất bên phải, phải cuộn
  // ngang mới thấy — mà ngày gần nhất lại là thứ cần xem nhất. Vẽ theo bề rộng
  // thật thì chữ cũng giữ đúng cỡ, không bị thu nhỏ theo hình.
  const khung = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = khung.current;
    if (!el) return;
    const do_ = () => setW(Math.max(260, Math.round(el.clientWidth)));
    do_();
    const ro = new ResizeObserver(do_);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = W < 480 ? 170 : 190, PL = 30, PR = 10, PT = 18, PB = 26;
  const max = Math.max(4, ...ds.map((d) => d.n));
  const buoc = (W - PL - PR) / Math.max(1, ds.length - 1);
  const X = (i: number) => PL + i * buoc;
  const Y = (v: number) => PT + (H - PT - PB) * (1 - v / max);
  const cuoi = ds[ds.length - 1];
  // Ngày cuối là hôm nay thì mới đi được nửa ngày — số nào cũng thấp, nhìn như
  // khách tụt hẳn. Vẽ đoạn đó nét đứt và ghi rõ "chưa hết ngày".
  const nay = new Date();
  const doDo = !!cuoi && ds.length > 1 && cuoi.ngay.toDateString() === nay.toDateString();
  const du = doDo ? ds.slice(0, -1) : ds;
  const duong = du.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.n).toFixed(1)}`).join(" ");
  const vung = `${duong} L${X(du.length - 1).toFixed(1)} ${H - PB} L${PL} ${H - PB} Z`;
  // Nhãn ngày cách nhau ít nhất ~60px để không đè lên nhau ở màn hẹp.
  const cach = Math.max(1, Math.ceil(ds.length / Math.max(2, Math.floor((W - PL - PR) / 60))));

  return (
    <div ref={khung}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: "100%", height: "auto" }}
           role="img" aria-label="Số khách theo từng ngày">
        {[0, Math.round(max / 2), max].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={Y(t)} y2={Y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PL - 7} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink3)">{t}</text>
          </g>
        ))}
        <path d={vung} fill="var(--s1)" opacity=".12" />
        <path d={duong} fill="none" stroke="var(--s1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {doDo && (
          <path
            d={`M${X(ds.length - 2).toFixed(1)} ${Y(ds[ds.length - 2].n).toFixed(1)} L${X(ds.length - 1).toFixed(1)} ${Y(cuoi.n).toFixed(1)}`}
            fill="none" stroke="var(--s1)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round"
          />
        )}
        {cuoi && (
          <>
            <circle cx={X(ds.length - 1)} cy={Y(cuoi.n)} r="4.5" strokeWidth="2"
                    fill={doDo ? "var(--panel)" : "var(--s1)"} stroke={doDo ? "var(--s1)" : "var(--panel)"} />
            <text x={X(ds.length - 1) - 6} y={Y(cuoi.n) - 9} textAnchor="end" fontSize="11.5" fontWeight="700" fill="var(--ink)">
              {doDo ? `hôm nay ${cuoi.n} khách (chưa hết ngày)` : `${cuoi.n} khách`}
            </text>
          </>
        )}
        {ds.map((p, i) => i % cach ? null : (
          <text key={i} x={X(i)} y={H - 7} textAnchor={i === 0 ? "start" : "middle"} fontSize="10.5" fill="var(--ink3)">
            {ddmm(p.ngay)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function Vong({ a, b, nhanA, nhanB }: { a: number; b: number; nhanA: string; nhanB: string }) {
  const tong = a + b || 1;
  const C = 2 * Math.PI * 54;
  const pa = (a / tong) * C;
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={`Tỷ lệ ${nhanA} và ${nhanB}`}>
      <g transform="rotate(-90 66 66)">
        <circle cx="66" cy="66" r="54" fill="none" stroke="var(--s1)" strokeWidth="17"
                strokeDasharray={`${Math.max(0, pa - 3)} ${C - pa + 3}`} />
        <circle cx="66" cy="66" r="54" fill="none" stroke="var(--s5)" strokeWidth="17"
                strokeDasharray={`${Math.max(0, C - pa - 3)} ${pa + 3}`} strokeDashoffset={-pa} />
      </g>
      <text x="66" y="62" textAnchor="middle" fontSize="24" fontWeight="800"
            fontFamily="Archivo,sans-serif" fill="var(--ink)">
        {Math.round((a / tong) * 100)}%
      </text>
      <text x="66" y="79" textAnchor="middle" fontSize="11" fill="var(--ink3)">là {nhanA}</text>
    </svg>
  );
}

/**
 * Thanh ngang so sánh độ lớn.
 *
 * Mọi hàng phải có cùng điểm bắt đầu và cùng độ dài rãnh, không thì mắt so độ
 * dài thanh là so sai: trước đây mỗi hàng tự co cột tên theo chữ của nó, tên
 * dài thì thanh bắt đầu muộn và rãnh ngắn lại — 44 triệu trông dài gần bằng 56
 * triệu. Giờ cột tên và cột số rộng cố định theo chữ dài nhất trong cả bảng.
 * Trên điện thoại thì tên nằm trên, thanh chạy hết bề ngang bên dưới.
 */
export function ThanhNgang({
  ds, mau = "var(--s1)", dinhDang,
}: {
  ds: [string, number][]; mau?: string; dinhDang?: (n: number) => string;
}) {
  if (!ds.length) return <p style={{ color: "var(--ink3)", fontSize: 13 }}>Chưa có dữ liệu trong kỳ này.</p>;
  const max = Math.max(1, ...ds.map(([, v]) => v));
  const hang = ds.map(([ten, v]) => ({ ten, v, chu: dinhDang ? dinhDang(v) : String(v) }));
  const dai = (xs: string[]) => Math.max(...xs.map((x) => x.length));
  const cot = {
    "--cn": `${Math.min(dai(hang.map((h) => h.ten)), 30) + 1}ch`,
    "--cv": `${dai(hang.map((h) => h.chu)) + 1}ch`,
  } as React.CSSProperties;

  return (
    <div className="hthanh" style={cot}>
      {hang.map((h) => (
        <div className="r" key={h.ten}>
          <span className="t">{h.ten}</span>
          <div className="thanh"><i style={{ width: `${Math.round((h.v / max) * 100)}%`, background: mau }} /></div>
          <span className="v">{h.chu}</span>
        </div>
      ))}
    </div>
  );
}
