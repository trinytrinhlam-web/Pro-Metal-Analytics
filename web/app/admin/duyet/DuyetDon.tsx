"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DICH_VU, KHU_VUC, LOAI_CONG_TRINH, LY_DO_TU_CHOI, chuanSdt, dinhDangSdt } from "@/lib/danh-muc";
import { donTruoc, gioCach, loiThat, vanDeCuaDon, type VanDe } from "@/lib/van-de";
import { ngan, vnd } from "../../nhap/tienIch";
import NhapBaoCao from "./NhapBaoCao";
import type { Hotline, KhachHang, TrangThai } from "@/lib/kieu";

type Bo = "cho" | "loi" | "tat";

export default function DuyetDon() {
  const [ds, setDs] = useState<KhachHang[]>([]);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [bo, setBo] = useState<Bo>("cho");
  const [chon, setChon] = useState<Record<string, boolean>>({});
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [xacNhanXoa, setXacNhanXoa] = useState("");
  const [boQuaTrung, setBoQuaTrung] = useState<Record<string, boolean>>({});
  const [loi, setLoi] = useState("");
  const [dangNap, setDangNap] = useState(true);

  const nap = useCallback(async () => {
    setDangNap(true);
    try {
      const tu = new Date(Date.now() - 120 * 864e5).toISOString();
      const [a, b] = await Promise.all([
        fetch(`/api/admin/don?tu=${tu}`).then((r) => r.json()),
        fetch("/api/admin/hotline").then((r) => r.json()),
      ]);
      setDs(a.ds ?? []);
      setHotlines(b.ds ?? []);
    } catch {
      setLoi("Không đọc được dữ liệu.");
    } finally {
      setDangNap(false);
    }
  }, []);
  useEffect(() => { nap(); }, [nap]);

  async function goi(than: Record<string, unknown>) {
    setLoi("");
    const r = await fetch("/api/admin/don", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(than),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setLoi(j.loi || "Không lưu được."); return null; }
    // Cập nhật tại chỗ, khỏi tải lại cả danh sách cho mượt tay.
    const moi = (j.ds ?? []) as KhachHang[];
    setDs((cu) => cu.map((d) => moi.find((m) => m.id === d.id) ?? d));
    return moi;
  }

  async function xoa(id: string) {
    if (xacNhanXoa !== id) { setXacNhanXoa(id); return; }
    const r = await fetch(`/api/admin/don?id=${id}`, { method: "DELETE" });
    if (!r.ok) { setLoi("Không xoá được."); return; }
    setDs((cu) => cu.filter((d) => d.id !== id));
    setXacNhanXoa("");
  }

  const hienThi = useMemo(() => {
    const l = [...ds].sort((a, b) => new Date(b.thoi_diem).getTime() - new Date(a.thoi_diem).getTime());
    if (bo === "cho") return l.filter((d) => !d.da_duyet);
    if (bo === "loi") return l.filter((d) => loiThat(vanDeCuaDon(d, ds)) > 0);
    return l.slice(0, 200);
  }, [ds, bo]);

  const soCho = ds.filter((d) => !d.da_duyet).length;
  const soLoi = ds.filter((d) => loiThat(vanDeCuaDon(d, ds)) > 0).length;
  const daChon = Object.keys(chon).filter((k) => chon[k]);
  const dangDung = hotlines.filter((h) => h.dang_dung);

  return (
    <>
      <NhapBaoCao ds={ds} hotlines={dangDung} xongThi={nap} />

      <div className="panel">
        <h2>Duyệt đơn thợ vừa nhập</h2>
        <p className="sub">
          Thợ nhập nhanh, có thể thiếu hoặc sai. Bạn kiểm lại ở đây rồi xác nhận — chỉ đơn đã gán
          nguồn mới tính được kênh nào ra tiền. Sửa gì cũng lưu ngay, không cần bấm lưu.
        </p>
        <div className="loc" style={{ marginBottom: 0 }}>
          {([["cho", `Chờ duyệt (${soCho})`], ["loi", `Có vấn đề (${soLoi})`], ["tat", "Tất cả"]] as [Bo, string][])
            .map(([v, c]) => (
              <button key={v} className="chip" aria-pressed={bo === v} onClick={() => { setBo(v); setChon({}); }}>
                {c}
              </button>
            ))}
          {hienThi.length > 0 && (
            <button
              className="ghost"
              style={{ marginLeft: "auto" }}
              onClick={() => setChon(Object.fromEntries(hienThi.map((d) => [d.id, true])))}
            >
              Chọn hết {hienThi.length} đơn
            </button>
          )}
        </div>
        {loi && <div className="hint" style={{ borderLeftColor: "var(--crit)", marginTop: 12 }}>{loi}</div>}
      </div>

      {dangNap ? (
        <div className="panel"><div className="rong">Đang đọc…</div></div>
      ) : hienThi.length ? (
        hienThi.map((l) => (
          <The
            key={l.id}
            l={l}
            tatCa={ds}
            hotlines={dangDung}
            mo={!!mo[l.id]}
            chon={!!chon[l.id]}
            xacNhanXoa={xacNhanXoa === l.id}
            boQuaTrung={!!boQuaTrung[l.id]}
            doiMo={() => setMo((p) => ({ ...p, [l.id]: !p[l.id] }))}
            doiChon={(v) => setChon((p) => ({ ...p, [l.id]: v }))}
            sua={(truong) => goi({ ids: [l.id], truong })}
            ganNguon={(id) => goi({ ids: [l.id], hotline_id: id })}
            duyet={(v) => goi({ ids: [l.id], da_duyet: v })}
            xoa={() => xoa(l.id)}
            boQua={() => setBoQuaTrung((p) => ({ ...p, [l.id]: true }))}
          />
        ))
      ) : (
        <div className="panel">
          <div className="rong">
            <b>Không còn đơn nào chờ bạn.</b>
            Thợ nhập đơn mới thì nó hiện ở đây.
          </div>
        </div>
      )}

      {daChon.length > 0 && (
        <div className="thanhchon">
          <b>Đã chọn {daChon.length} đơn</b>
          <span style={{ fontSize: 12.5, opacity: 0.8 }}>Gán nguồn:</span>
          <div className="chips">
            {dangDung.map((h) => (
              <button key={h.id} className="chip" onClick={() => goi({ ids: daChon, hotline_id: h.id })}>
                <span className="sw" style={{ background: h.mau }} />{h.kenh}
              </button>
            ))}
          </div>
          <button className="go" onClick={async () => { await goi({ ids: daChon, da_duyet: true }); setChon({}); }}>
            Xác nhận {daChon.length} đơn
          </button>
          <button className="bo" onClick={() => setChon({})}>Bỏ chọn</button>
        </div>
      )}
    </>
  );
}

function The({
  l, tatCa, hotlines, mo, chon, xacNhanXoa, boQuaTrung,
  doiMo, doiChon, sua, ganNguon, duyet, xoa, boQua,
}: {
  l: KhachHang; tatCa: KhachHang[]; hotlines: Hotline[];
  mo: boolean; chon: boolean; xacNhanXoa: boolean; boQuaTrung: boolean;
  doiMo: () => void; doiChon: (v: boolean) => void;
  sua: (t: Record<string, unknown>) => void;
  ganNguon: (id: string | null) => void;
  duyet: (v: boolean) => void; xoa: () => void; boQua: () => void;
}) {
  const v = vanDeCuaDon(l, tatCa);
  const truoc = boQuaTrung ? null : donTruoc(l, tatCa);
  const nang = loiThat(v);
  const d = new Date(l.thoi_diem);
  const lop = l.da_duyet ? "dd xong" : truoc ? "dd gap" : nang ? "dd nhac" : "dd";

  return (
    <div className={lop}>
      <div className="dd-top">
        <input type="checkbox" className="cbx" checked={chon} onChange={(e) => doiChon(e.target.checked)}
               aria-label={`Chọn đơn ${l.ten ?? l.so_dien_thoai}`} />
        <span className="ai">
          <b>{l.ten || "(chưa có tên)"}</b>
          <span>
            {d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}{" "}
            {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            {l.giay_goi ? ` · nói ${l.giay_goi} giây` : ""}
            {l.tu_bao_cao ? " · từ báo cáo cuộc gọi" : ""}
          </span>
        </span>
        {l.tu_bao_cao && <span className="nhan" style={{ background: "var(--s1)", color: "#fff" }}>GOOGLE ADS</span>}
        <span className={`nhan ${l.da_duyet ? "n-good" : "n-warn"}`}>{l.da_duyet ? "ĐÃ DUYỆT" : "CHỜ DUYỆT"}</span>
      </div>

      {v.length > 0 && (
        <div className="vande">
          {v.map((x, i) => (
            <span key={i} className={`vd vd-${x.muc}`}>
              {x.ma === "cu" ? "🔁" : x.ma === "trung" ? "⛔" : x.muc === "info" ? "·" : "⚠"} {x.chu}
            </span>
          ))}
        </div>
      )}

      <div className="dd-o">
        <div>
          <div className="lb">Số điện thoại</div>
          <input className="inp" defaultValue={dinhDangSdt(l.so_dien_thoai)} inputMode="tel"
                 onBlur={(e) => {
                   const s = chuanSdt(e.target.value);
                   if (s && s !== l.so_dien_thoai) sua({ so_dien_thoai: s });
                 }} />
        </div>
        <div>
          <div className="lb">Tên khách</div>
          <input className="inp" defaultValue={l.ten ?? ""}
                 onBlur={(e) => e.target.value.trim() !== (l.ten ?? "") && sua({ ten: e.target.value.trim() || null })} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="lb">Nguồn quảng cáo <i>khách này gọi từ đâu</i></div>
        <div className="chips">
          {hotlines.map((h) => (
            <button key={h.id} className="chip" aria-pressed={l.hotline_id === h.id}
                    onClick={() => ganNguon(l.hotline_id === h.id ? null : h.id)}>
              <span className="sw" style={{ background: h.mau }} />{h.kenh}
            </button>
          ))}
        </div>
      </div>

      {truoc && <KhoiTrung l={l} truoc={truoc} hotlines={hotlines} ganNguon={ganNguon} xoa={xoa} xacNhanXoa={xacNhanXoa} boQua={boQua} duyet={duyet} />}

      {mo && <SuaThem l={l} sua={sua} />}

      <div className="dd-hd">
        <button className="ghost" onClick={doiMo}>{mo ? "Thu gọn ▴" : "Sửa thêm ▾"}</button>
        {l.da_duyet
          ? <button className="ghost" onClick={() => duyet(false)}>Bỏ duyệt</button>
          : <button className="ok" onClick={() => duyet(true)}>✓ Xác nhận đơn này</button>}
      </div>
    </div>
  );
}

function KhoiTrung({
  l, truoc, hotlines, ganNguon, xoa, xacNhanXoa, boQua, duyet,
}: {
  l: KhachHang; truoc: KhachHang; hotlines: Hotline[];
  ganNguon: (id: string | null) => void; xoa: () => void; xacNhanXoa: boolean;
  boQua: () => void; duyet: (v: boolean) => void;
}) {
  const gio = gioCach(l, truoc);
  const laTrung = gio < 12;
  const p = new Date(truoc.thoi_diem);
  const khachCu = hotlines.find((h) => /kh[áa]ch c[ũu]|gi[ớo]i thi[ệe]u/i.test(h.kenh));

  return (
    <div className="trung">
      <h4>{laTrung ? "⛔ Có thể là đơn nhập trùng" : "🔁 Khách cũ gọi lại"}</h4>
      <div className="cu">
        Số <b>{dinhDangSdt(l.so_dien_thoai)}</b> đã có đơn{" "}
        <b>{p.toLocaleDateString("vi-VN")} {p.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</b>{" "}
        <span style={{ color: "var(--ink3)" }}>
          (cách {laTrung ? `${Math.round(gio)} tiếng` : `${Math.round(gio / 24)} ngày`})
        </span>
        <br />
        <span style={{ color: "var(--ink3)" }}>
          {truoc.dich_vu?.join(", ") || "chưa ghi dịch vụ"} ·{" "}
          {truoc.trang_thai === "da_chot"
            ? `đã chốt ${truoc.doanh_thu ? vnd(truoc.doanh_thu) : "(chưa có tiền công)"}`
            : truoc.trang_thai === "hoi_gia" ? "chỉ hỏi giá" : "từ chối"}
        </span>
      </div>
      <div className="hd">
        {!laTrung && khachCu && (
          <button className="chinh" onClick={() => { ganNguon(khachCu.id); duyet(true); }}>
            Khách cũ gọi lại
            <small>gán nguồn “{khachCu.kenh}”, không tính vào chi phí quảng cáo</small>
          </button>
        )}
        <button className="xoa" onClick={xoa}>
          {xacNhanXoa ? "Bấm lần nữa để xoá thật" : "Đơn nhập trùng — xoá"}
          <small>{xacNhanXoa ? "Không khôi phục lại được" : "Xoá hẳn đơn này khỏi hệ thống"}</small>
        </button>
        <button onClick={boQua}>
          Hai khách khác nhau
          <small>trùng số do bấm nhầm, cứ để nguyên</small>
        </button>
      </div>
    </div>
  );
}

function SuaThem({ l, sua }: { l: KhachHang; sua: (t: Record<string, unknown>) => void }) {
  return (
    <div className="dd-o">
      <div>
        <div className="lb">Giới tính</div>
        <div className="chips">
          {([["nam", "Anh"], ["nu", "Chị"]] as const).map(([v, c]) => (
            <button key={v} className="chip" aria-pressed={l.gioi_tinh === v}
                    onClick={() => sua({ gioi_tinh: l.gioi_tinh === v ? null : v })}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="lb">Kết quả</div>
        <div className="chips">
          {([["hoi_gia", "Hỏi giá"], ["da_chot", "Đã chốt"], ["tu_choi", "Từ chối"]] as [TrangThai, string][]).map(([v, c]) => (
            <button key={v} className="chip" aria-pressed={l.trang_thai === v}
                    onClick={() => sua({ trang_thai: v, ...(v === "tu_choi" ? {} : { ly_do_tu_choi: null }) })}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="lb">Tiền công</div>
        <input className="inp" inputMode="numeric" placeholder="chưa có"
               defaultValue={l.doanh_thu ? l.doanh_thu.toLocaleString("vi-VN") : ""}
               onBlur={(e) => {
                 const n = Number(e.target.value.replace(/\D/g, "")) || null;
                 if (n !== l.doanh_thu) sua({ doanh_thu: n });
               }} />
      </div>
      <div>
        <div className="lb">Phường / xã</div>
        <select className="inp" defaultValue={l.khu_vuc ?? ""}
                onChange={(e) => sua({ khu_vuc: e.target.value || null })}>
          <option value="">— chọn —</option>
          {KHU_VUC.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>
      <div>
        <div className="lb">Loại công trình</div>
        <select className="inp" defaultValue={l.loai_cong_trinh ?? ""}
                onChange={(e) => sua({ loai_cong_trinh: e.target.value || null })}>
          <option value="">— chọn —</option>
          {LOAI_CONG_TRINH.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>
      {l.trang_thai === "tu_choi" && (
        <div>
          <div className="lb">Lý do từ chối</div>
          <select className="inp" defaultValue={l.ly_do_tu_choi ?? ""}
                  onChange={(e) => sua({ ly_do_tu_choi: e.target.value || null })}>
            <option value="">— chọn —</option>
            {LY_DO_TU_CHOI.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
      )}
      <div style={{ gridColumn: "1/-1" }}>
        <div className="lb">Dịch vụ</div>
        <div className="chips">
          {DICH_VU.map((dv) => {
            const co = l.dich_vu?.includes(dv);
            return (
              <button key={dv} className="chip" aria-pressed={co}
                      onClick={() => sua({ dich_vu: co ? l.dich_vu.filter((x) => x !== dv) : [...(l.dich_vu ?? []), dv] })}>
                {dv}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ gridColumn: "1/-1" }}>
        <div className="lb">Ghi chú</div>
        <input className="inp" defaultValue={l.ghi_chu ?? ""}
               onBlur={(e) => e.target.value !== (l.ghi_chu ?? "") && sua({ ghi_chu: e.target.value || null })} />
      </div>
      {l.doanh_thu != null && (
        <p style={{ gridColumn: "1/-1", margin: 0, fontSize: 12.5, color: "var(--ink3)" }}>
          Tiền công đang ghi: <b>{ngan(l.doanh_thu)}</b>
        </p>
      )}
    </div>
  );
}
