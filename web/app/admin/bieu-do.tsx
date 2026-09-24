"use client";
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
  return (
    <>
      <div className="scrollx">
        <table className="hm">
          <tbody>
            <tr>
              <th />
              {GIO_THEO_DOI.map((h) => <th key={h}>{h}</th>)}
            </tr>
            {luoi.map((hang, i) => (
              <tr key={i}>
                <td className="rh">{THU_NGAN[i]}</td>
                {hang.map((v, j) => {
                  const dam = max ? Math.round(14 + 86 * Math.pow(v / max, 0.75)) : 0;
                  return (
                    <td key={j}>
                      <div
                        className="o"
                        title={`${THU_DAY[i]}, ${GIO_THEO_DOI[j]}h: ${v} khách`}
                        style={{ background: v ? daMau(dam) : "var(--panel2)", color: dam > 58 ? "#fff" : "var(--ink2)" }}
                      >
                        {v || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const W = 720, H = 190, PL = 34, PR = 8, PT = 14, PB = 26;
  const max = Math.max(4, ...ds.map((d) => d.n));
  const buoc = (W - PL - PR) / Math.max(1, ds.length - 1);
  const X = (i: number) => PL + i * buoc;
  const Y = (v: number) => PT + (H - PT - PB) * (1 - v / max);
  const duong = ds.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.n).toFixed(1)}`).join(" ");
  const vung = `${duong} L${X(ds.length - 1).toFixed(1)} ${H - PB} L${PL} ${H - PB} Z`;
  const cach = Math.max(1, Math.ceil(ds.length / 7));
  const cuoi = ds[ds.length - 1];

  return (
    <div className="scrollx">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", minWidth: 520 }}
           role="img" aria-label="Số khách theo từng ngày">
        {[0, Math.round(max / 2), max].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={Y(t)} y2={Y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PL - 7} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink3)">{t}</text>
          </g>
        ))}
        <path d={vung} fill="var(--s1)" opacity=".12" />
        <path d={duong} fill="none" stroke="var(--s1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {cuoi && (
          <>
            <circle cx={X(ds.length - 1)} cy={Y(cuoi.n)} r="4.5" fill="var(--s1)" stroke="var(--panel)" strokeWidth="2" />
            <text x={X(ds.length - 1) - 6} y={Y(cuoi.n) - 9} textAnchor="end" fontSize="11.5" fontWeight="700" fill="var(--ink)">
              {cuoi.n} khách
            </text>
          </>
        )}
        {ds.map((p, i) => i % cach ? null : (
          <text key={i} x={X(i)} y={H - 7} textAnchor="middle" fontSize="10.5" fill="var(--ink3)">
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

export function ThanhNgang({
  ds, mau = "var(--s1)", dinhDang,
}: {
  ds: [string, number][]; mau?: string; dinhDang?: (n: number) => string;
}) {
  if (!ds.length) return <p style={{ color: "var(--ink3)", fontSize: 13 }}>Chưa có dữ liệu trong kỳ này.</p>;
  const max = ds[0][1] || 1;
  return (
    <div className="hthanh">
      {ds.map(([ten, v]) => (
        <div className="r" key={ten}>
          <span>{ten}</span>
          <div className="thanh"><i style={{ width: `${Math.round((v / max) * 100)}%`, background: mau }} /></div>
          <span className="v">{dinhDang ? dinhDang(v) : v}</span>
        </div>
      ))}
    </div>
  );
}
