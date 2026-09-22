"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ManPin from "./ManPin";
import ChonKhuVuc from "./ChonKhuVuc";
import { guiLai, soDonCho, taoKhoa, themVaoHangDoi } from "./hangDoi";
import { coGiDangKe, docBanNhap, luuBanNhap, xoaBanNhap } from "./banNhap";
import { choInputNgayGio, ddmm, hhmm, ngan, tat } from "./tienIch";
import { DICH_VU, LOAI_CONG_TRINH, LY_DO_TU_CHOI, chuanSdt, dinhDangSdt } from "@/lib/danh-muc";
import type { GioiTinh, KhachHang, TrangThai } from "@/lib/kieu";

type Form = {
  thoiDiem: Date;
  ten: string;
  sdt: string;
  gioiTinh: GioiTinh | "";
  dichVu: string[];
  khuVuc: string;
  loaiCongTrinh: string;
  trangThai: TrangThai | "";
  lyDo: string;
  doanhThu: string;
  ghiChu: string;
  ai: Record<string, boolean>;
};
const formRong = (): Form => ({
  thoiDiem: new Date(), ten: "", sdt: "", gioiTinh: "", dichVu: [], khuVuc: "",
  loaiCongTrinh: "", trangThai: "", lyDo: "", doanhThu: "", ghiChu: "", ai: {},
});

type KhachCu = {
  soLan: number; soDon: number; tong: number; ten: string | null;
  gioiTinh: string | null; khuVuc: string | null; lanGanNhat: string; dichVuGanNhat: string[];
};
type TrangThaiVoice = "tat" | "cho" | "ghi" | "gui" | "xong";

export default function NhapApp({
  thoBanDau,
}: {
  thoBanDau: { ten: string; vaiTro: string } | null;
}) {
  const [tho, setTho] = useState(thoBanDau);
  const [man, setMan] = useState<"nhap" | "hom-nay">("nhap");
  const [f, setF] = useState<Form>(formRong);
  const [suaId, setSuaId] = useState<string | null>(null);
  const [moKV, setMoKV] = useState(false);
  const [dsHomNay, setDsHomNay] = useState<KhachHang[]>([]);
  const [khachCu, setKhachCu] = useState<KhachCu | null>(null);
  const [toast, setToast] = useState<{ chu: string; xau?: boolean } | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [online, setOnline] = useState(true);
  const [cho, setCho] = useState(0);
  const [voice, setVoice] = useState<TrangThaiVoice>("cho");
  const [daKhoiPhuc, setDaKhoiPhuc] = useState(false);
  const [giay, setGiay] = useState(0);
  const [loiDoc, setLoiDoc] = useState("");
  const mrRef = useRef<MediaRecorder | null>(null);
  const dongHo = useRef<ReturnType<typeof setInterval> | null>(null);

  const bao = useCallback((chu: string, xau = false) => {
    setToast({ chu, xau });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const napHomNay = useCallback(async () => {
    try {
      const r = await fetch("/api/don?ngay=7");
      if (r.status === 401) return setTho(null);
      const j = await r.json();
      if (r.ok) setDsHomNay(j.ds as KhachHang[]);
    } catch {
      /* mất sóng — giữ nguyên danh sách đang có */
    }
  }, []);

  /* ── sóng lên thì tự gửi lại đơn còn nằm trên máy ─────────────────── */
  useEffect(() => {
    if (!tho) return;
    const dongBo = async () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine) return;
      const n = await guiLai();
      setCho(soDonCho());
      if (n > 0) {
        bao(`✓ Đã gửi ${n} đơn lưu tạm lúc mất sóng`);
        napHomNay();
      }
    };
    setCho(soDonCho());
    dongBo();
    napHomNay();
    window.addEventListener("online", dongBo);
    window.addEventListener("offline", () => setOnline(false));
    return () => {
      window.removeEventListener("online", dongBo);
    };
  }, [tho, bao, napHomNay]);

  /* ── mở lại app thì lấy lại đơn đang gõ dở ────────────────────────── */
  useEffect(() => {
    const b = docBanNhap();
    if (b && coGiDangKe(b)) {
      setF((p) => ({
        ...p,
        ...(b as unknown as Partial<Form>),
        thoiDiem: new Date(b.thoiDiem),
        ai: {},
      }));
      setDaKhoiPhuc(true);
    }
  }, []);

  /* Gõ tới đâu giữ tới đó, phòng khi điện thoại dọn app nền. */
  useEffect(() => {
    if (suaId) return;                 // đang sửa đơn cũ thì không đụng vào bản nháp
    const t = setTimeout(() => luuBanNhap(f), 400);
    return () => clearTimeout(t);
  }, [f, suaId]);

  /* ── nhận số chia sẻ từ app Điện thoại (Android) ──────────────────── */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const chia = sp.get("text") || sp.get("sdt") || sp.get("title") || "";
    const so = chuanSdt(chia);
    if (so.length >= 9) {
      setF((p) => ({ ...p, sdt: so }));
      history.replaceState(null, "", "/nhap");
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  /* ── nhận ra khách cũ khi gõ đủ số ────────────────────────────────── */
  useEffect(() => {
    const so = chuanSdt(f.sdt);
    if (so.length < 9) return setKhachCu(null);
    let bo = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/khach?sdt=${so}`);
        const j = await r.json();
        if (!bo) setKhachCu(j.cu ?? null);
      } catch {
        /* không tra được thì thôi, không chặn thợ nhập */
      }
    }, 350);
    return () => {
      bo = true;
      clearTimeout(t);
    };
  }, [f.sdt]);

  /* ── đọc bằng giọng nói ───────────────────────────────────────────── */
  async function batGhi() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(s);
      const manh: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && manh.push(e.data);
      mr.onstop = async () => {
        s.getTracks().forEach((t) => t.stop());
        if (dongHo.current) clearInterval(dongHo.current);
        const blob = new Blob(manh, { type: mr.mimeType || "audio/webm" });
        setVoice("gui");
        try {
          const r = await fetch("/api/giong-noi", {
            method: "POST",
            headers: { "content-type": blob.type },
            body: blob,
          });
          const j = await r.json();
          if (!r.ok) {
            setVoice("cho");
            return bao(j.loi || "Máy không nghe được, nhập tay giúp.", true);
          }
          apKetQua(j.ket_qua);
          setVoice("xong");
        } catch {
          setVoice("cho");
          bao("Mất sóng nên chưa gửi được tiếng, nhập tay giúp.", true);
        }
      };
      mrRef.current = mr;
      mr.start();
      setGiay(0);
      setVoice("ghi");
      dongHo.current = setInterval(() => setGiay((g) => g + 1), 1000);
    } catch {
      bao("Máy không cho dùng micro. Vào cài đặt trình duyệt bật quyền micro.", true);
    }
  }
  function dungGhi() {
    mrRef.current?.stop();
  }

  type KQ = {
    ten: string | null; so_dien_thoai: string | null; gioi_tinh: GioiTinh | null;
    dich_vu: string[]; khu_vuc: string | null; loai_cong_trinh: string | null;
    trang_thai: TrangThai; ly_do_tu_choi: string | null; doanh_thu: number | null; loi_doc: string;
  };
  function apKetQua(k: KQ) {
    const ai: Record<string, boolean> = {};
    setF((p) => {
      const n = { ...p };
      if (k.ten) { n.ten = k.ten; ai.ten = true; }
      if (k.so_dien_thoai) { n.sdt = k.so_dien_thoai; ai.sdt = true; }
      if (k.gioi_tinh) { n.gioiTinh = k.gioi_tinh; }
      if (k.dich_vu?.length) { n.dichVu = k.dich_vu; ai.dichVu = true; }
      if (k.khu_vuc) { n.khuVuc = k.khu_vuc; ai.khuVuc = true; }
      if (k.loai_cong_trinh) n.loaiCongTrinh = k.loai_cong_trinh;
      if (k.trang_thai) { n.trangThai = k.trang_thai; ai.trangThai = true; }
      if (k.ly_do_tu_choi) n.lyDo = k.ly_do_tu_choi;
      if (k.doanh_thu) { n.doanhThu = String(k.doanh_thu); ai.doanhThu = true; }
      // Giữ lại nguyên văn lời thợ đọc; file ghi âm thì không lưu ở đâu cả.
      if (k.loi_doc) { n.ghiChu = p.ghiChu ? `${p.ghiChu} · ${k.loi_doc}` : k.loi_doc; ai.ghiChu = true; }
      n.ai = ai;
      return n;
    });
    setLoiDoc(k.loi_doc || "");
  }

  async function danSo() {
    try {
      const t = await navigator.clipboard.readText();
      const so = chuanSdt(t);
      if (so.length >= 9) {
        setF((p) => ({ ...p, sdt: so }));
        bao("✓ Đã dán số");
      } else bao("Trong bộ nhớ tạm không có số điện thoại nào.", true);
    } catch {
      bao("Máy không cho đọc bộ nhớ tạm. Bấm giữ vào ô rồi chọn Dán.", true);
    }
  }

  /* ── lưu ──────────────────────────────────────────────────────────── */
  async function luu() {
    const so = chuanSdt(f.sdt);
    if (so.length < 9) return bao("Chưa có số điện thoại khách — thứ duy nhất bắt buộc.", true);
    setDangLuu(true);
    const than = {
      thoi_diem: f.thoiDiem.toISOString(),
      ten: f.ten,
      so_dien_thoai: so,
      gioi_tinh: (f.gioiTinh || null) as GioiTinh | null,
      dich_vu: f.dichVu,
      khu_vuc: f.khuVuc || null,
      loai_cong_trinh: f.loaiCongTrinh || null,
      trang_thai: (f.trangThai || "hoi_gia") as TrangThai,
      ly_do_tu_choi: f.trangThai === "tu_choi" ? f.lyDo || null : null,
      doanh_thu: f.doanhThu ? Number(f.doanhThu) : null,
      ghi_chu: f.ghiChu,
    };
    try {
      const r = await fetch(suaId ? `/api/don/${suaId}` : "/api/don", {
        method: suaId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(suaId ? than : { ...than, khoa_client: taoKhoa() }),
      });
      if (r.status === 401) { setTho(null); return; }
      const j = await r.json();
      if (!r.ok) return bao(j.loi || "Lưu không được.", true);
      bao(suaId ? "✓ Đã cập nhật đơn" : voice === "xong" ? "✓ Đã lưu · không giữ lại file ghi âm" : "✓ Đã lưu");
      xongMotDon();
      napHomNay();
    } catch {
      if (suaId) return bao("Mất sóng nên chưa sửa được. Thử lại khi có sóng.", true);
      themVaoHangDoi({ ...than, khoa_client: taoKhoa(), luc: Date.now() });
      setCho(soDonCho());
      bao("✓ Đã lưu trên máy · tự gửi khi có sóng");
      xongMotDon();
    } finally {
      setDangLuu(false);
    }
  }
  function xongMotDon() {
    xoaBanNhap();
    setDaKhoiPhuc(false);
    setF(formRong());
    setSuaId(null);
    setKhachCu(null);
    setVoice("cho");
    setLoiDoc("");
  }

  function moSua(d: KhachHang) {
    setF({
      thoiDiem: new Date(d.thoi_diem), ten: d.ten ?? "", sdt: d.so_dien_thoai,
      gioiTinh: d.gioi_tinh ?? "", dichVu: d.dich_vu ?? [], khuVuc: d.khu_vuc ?? "",
      loaiCongTrinh: d.loai_cong_trinh ?? "", trangThai: d.trang_thai,
      lyDo: d.ly_do_tu_choi ?? "", doanhThu: d.doanh_thu ? String(d.doanh_thu) : "",
      ghiChu: d.ghi_chu ?? "", ai: {},
    });
    setSuaId(d.id);
    setMan("nhap");
    setVoice("cho");
  }

  if (!tho) {
    return (
      <div className="app">
        <ManPin xong={(ten, vaiTro) => setTho({ ten, vaiTro })} />
      </div>
    );
  }

  const homNay = dsHomNay.filter(
    (d) => new Date(d.thoi_diem).toDateString() === new Date().toDateString()
  );
  const chot = homNay.filter((d) => d.trang_thai === "da_chot");
  const tien = chot.reduce((s, d) => s + (d.doanh_thu ?? 0), 0);
  const thieuTien = dsHomNay.filter((d) => d.trang_thai === "da_chot" && !d.doanh_thu).length;
  const lop = (k: string) => `fld${f.ai[k] ? " ai" : ""}`;

  return (
    <div className="app">
      <header className="appbar">
        <button
          className="avt"
          title="Đổi thợ"
          onClick={async () => {
            await fetch("/api/dang-xuat", { method: "POST" });
            setTho(null);
          }}
        >
          {tat(tho.ten)}
        </button>
        <div className="who">
          <b>{tho.ten}</b>
          <span>Thợ nhập liệu</span>
        </div>
        <span className="pill">
          Hôm nay <b>{homNay.length}</b> khách · {chot.length} chốt · {ngan(tien)}
        </span>
      </header>

      {!online && <div className="offline">Đang mất sóng — cứ nhập bình thường, có sóng máy tự gửi</div>}
      {cho > 0 && online && <div className="offline">{cho} đơn đang chờ gửi lên…</div>}

      {man === "nhap" ? (
        <div className="scroll">
          {!suaId && (
            <VoiceBar
              trangThai={voice}
              giay={giay}
              loiDoc={loiDoc}
              soO={Object.keys(f.ai).length}
              bat={batGhi}
              dung={dungGhi}
              lamLai={() => { setVoice("cho"); setLoiDoc(""); xongMotDon(); }}
            />
          )}

          {daKhoiPhuc && !suaId && (
            <div className="hint" style={{ borderLeftColor: "var(--good)", marginBottom: 14 }}>
              <b>Đã lấy lại đơn bạn đang gõ dở.</b> Nhập nốt rồi bấm Lưu, hoặc{" "}
              <button
                type="button"
                style={{ border: 0, background: "none", textDecoration: "underline", padding: 0, fontWeight: 700, color: "var(--accent)" }}
                onClick={xongMotDon}
              >
                bỏ đi nhập khách mới
              </button>
              .
            </div>
          )}

          <div className="fld">
            <div className="lb">Thời điểm khách gọi <i>máy tự điền – sửa được</i></div>
            <input
              className="inp"
              type="datetime-local"
              value={choInputNgayGio(f.thoiDiem)}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) setF((p) => ({ ...p, thoiDiem: d }));
              }}
            />
          </div>

          <div className={lop("sdt")}>
            <div className="lb">Số điện thoại</div>
            <input
              className="inp big"
              inputMode="tel"
              autoComplete="off"
              placeholder="0912 345 678"
              value={dinhDangSdt(f.sdt)}
              onChange={(e) => setF((p) => ({ ...p, sdt: chuanSdt(e.target.value).slice(0, 10) }))}
            />
            <div className="quick">
              <button type="button" onClick={danSo}>📋 Dán số vừa copy</button>
            </div>
            {khachCu && (
              <div className="hint">
                <b>Khách cũ · {khachCu.soLan} lần</b> — gần nhất {ddmm(new Date(khachCu.lanGanNhat))},{" "}
                {khachCu.dichVuGanNhat.join(", ") || "chưa ghi dịch vụ"}
                {khachCu.tong > 0 && `, tổng ${ngan(khachCu.tong)}`}
                {!f.ten && khachCu.ten && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      style={{ border: 0, background: "none", textDecoration: "underline", padding: 0, fontWeight: 700 }}
                      onClick={() =>
                        setF((p) => ({
                          ...p,
                          ten: khachCu.ten ?? "",
                          gioiTinh: (khachCu.gioiTinh as GioiTinh) || p.gioiTinh,
                          khuVuc: p.khuVuc || khachCu.khuVuc || "",
                        }))
                      }
                    >
                      điền lại tên cũ
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={lop("ten")}>
            <div className="lb">Tên khách</div>
            <input
              className="inp"
              placeholder="VD: Anh Minh"
              value={f.ten}
              onChange={(e) => setF((p) => ({ ...p, ten: e.target.value }))}
            />
            <div className="row2" style={{ marginTop: 8 }}>
              {([["nam", "Anh"], ["nu", "Chị"]] as const).map(([v, nhan]) => (
                <button
                  key={v}
                  className="chip"
                  style={{ justifyContent: "center", textAlign: "center" }}
                  aria-pressed={f.gioiTinh === v}
                  onClick={() => setF((p) => ({ ...p, gioiTinh: p.gioiTinh === v ? "" : v }))}
                >
                  {nhan}
                </button>
              ))}
            </div>
          </div>

          <div className={lop("dichVu")}>
            <div className="lb">Cần làm gì? <i>chọn nhiều được</i></div>
            <div className="chips">
              {DICH_VU.map((d) => (
                <button
                  key={d}
                  className="chip"
                  aria-pressed={f.dichVu.includes(d)}
                  onClick={() =>
                    setF((p) => ({
                      ...p,
                      dichVu: p.dichVu.includes(d) ? p.dichVu.filter((x) => x !== d) : [...p.dichVu, d],
                    }))
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={lop("khuVuc")}>
            <div className="lb">Phường / xã <i>gõ tên quận cũ cũng ra</i></div>
            <button className={`pick${f.khuVuc ? "" : " empty"}`} onClick={() => setMoKV(true)}>
              {f.khuVuc || "— Chọn phường / xã —"}
              <span style={{ color: "var(--ink3)" }}>▾</span>
            </button>
            <select
              className="inp"
              style={{ marginTop: 9 }}
              value={f.loaiCongTrinh}
              onChange={(e) => setF((p) => ({ ...p, loaiCongTrinh: e.target.value }))}
            >
              <option value="">— Loại công trình —</option>
              {LOAI_CONG_TRINH.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className={lop("trangThai")}>
            <div className="lb">Kết quả</div>
            <div className="row3">
              {([
                ["hoi_gia", "Hỏi giá", "chưa chốt"],
                ["da_chot", "Đã chốt", "nhận việc"],
                ["tu_choi", "Từ chối", "không làm"],
              ] as const).map(([v, nhan, phu]) => (
                <button
                  key={v}
                  className="tri"
                  data-v={v}
                  aria-pressed={f.trangThai === v}
                  onClick={() => setF((p) => ({ ...p, trangThai: v, lyDo: v === "tu_choi" ? p.lyDo : "" }))}
                >
                  {nhan}
                  <small>{phu}</small>
                </button>
              ))}
            </div>
            {f.trangThai === "tu_choi" && (
              <div className="chips" style={{ marginTop: 9 }}>
                {LY_DO_TU_CHOI.map((l) => (
                  <button
                    key={l}
                    className="chip"
                    aria-pressed={f.lyDo === l}
                    onClick={() => setF((p) => ({ ...p, lyDo: p.lyDo === l ? "" : l }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={lop("doanhThu")}>
            <div className="lb">Tiền công <i>chưa biết thì để trống, điền sau</i></div>
            <input
              className="inp big"
              inputMode="numeric"
              placeholder="0đ"
              value={f.doanhThu ? Number(f.doanhThu).toLocaleString("vi-VN") : ""}
              onChange={(e) => setF((p) => ({ ...p, doanhThu: e.target.value.replace(/\D/g, "") }))}
            />
            <div className="quick">
              {[500_000, 1_000_000, 2_000_000, 5_000_000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setF((p) => ({ ...p, doanhThu: String((Number(p.doanhThu) || 0) + v) }))}
                >
                  +{ngan(v)}
                </button>
              ))}
              <button type="button" onClick={() => setF((p) => ({ ...p, doanhThu: "" }))}>Xoá</button>
            </div>
          </div>

          <div className={lop("ghiChu")}>
            <div className="lb">
              Ghi chú {f.ai.ghiChu && <i>lời bạn vừa đọc, sửa hoặc xoá được</i>}
            </div>
            <input
              className="inp"
              placeholder="VD: hẹn qua khảo sát sáng mai"
              value={f.ghiChu}
              onChange={(e) => setF((p) => ({ ...p, ghiChu: e.target.value }))}
            />
          </div>

          {suaId && (
            <button
              className="chip"
              style={{ width: "100%", justifyContent: "center", padding: 13 }}
              onClick={xongMotDon}
            >
              Thôi, không sửa nữa
            </button>
          )}
        </div>
      ) : (
        <div className="scroll">
          {thieuTien > 0 && (
            <div className="hint" style={{ borderLeftColor: "var(--warn)", marginBottom: 12 }}>
              <b>{thieuTien} đơn đã chốt chưa điền tiền công.</b> Bấm vào đơn để bổ sung.
            </div>
          )}
          {dsHomNay.length ? (
            dsHomNay.map((d) => (
              <button key={d.id} className="lead" onClick={() => moSua(d)}>
                <span className="tm">{hhmm(new Date(d.thoi_diem))}</span>
                <span className="mn">
                  <b>{d.ten || "(chưa có tên)"}</b>
                  <span>
                    {dinhDangSdt(d.so_dien_thoai)} · {d.dich_vu?.join(", ") || "—"}
                  </span>
                  {d.khu_vuc && <span>{d.khu_vuc}</span>}
                </span>
                <span style={{ textAlign: "right" }}>
                  <span className={`tag t-${d.trang_thai}`}>
                    {d.trang_thai === "da_chot" ? "Đã chốt" : d.trang_thai === "hoi_gia" ? "Hỏi giá" : "Từ chối"}
                  </span>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 13, marginTop: 5, fontFamily: "Archivo,sans-serif" }}>
                    {d.doanh_thu ? ngan(d.doanh_thu) : d.trang_thai === "da_chot" ? (
                      <span style={{ color: "var(--crit)" }}>thiếu</span>
                    ) : "—"}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p style={{ color: "var(--ink3)", textAlign: "center", padding: "40px 0" }}>
              Chưa có đơn nào trong 7 ngày qua.
              <br />
              Bấm <b>Nhập khách</b> để bắt đầu.
            </p>
          )}
        </div>
      )}

      {man === "nhap" && (
        <div className="save">
          <button onClick={luu} disabled={dangLuu}>
            {dangLuu ? "ĐANG LƯU…" : suaId ? "CẬP NHẬT ĐƠN" : "LƯU KHÁCH"}
          </button>
        </div>
      )}

      <nav className="tabs">
        <button aria-selected={man === "nhap"} onClick={() => setMan("nhap")}>
          <span style={{ fontSize: 17 }}>✎</span>Nhập khách
        </button>
        <button aria-selected={man === "hom-nay"} onClick={() => { setMan("hom-nay"); napHomNay(); }}>
          <span style={{ fontSize: 17 }}>☰</span>Gần đây ({dsHomNay.length})
        </button>
      </nav>

      {moKV && (
        <ChonKhuVuc
          dangChon={f.khuVuc || null}
          chon={(k) => { setF((p) => ({ ...p, khuVuc: k })); setMoKV(false); }}
          dong={() => setMoKV(false)}
        />
      )}
      {toast && <div className={`toast${toast.xau ? " xau" : ""}`}>{toast.chu}</div>}
    </div>
  );
}

function VoiceBar({
  trangThai, giay, loiDoc, soO, bat, dung, lamLai,
}: {
  trangThai: TrangThaiVoice; giay: number; loiDoc: string; soO: number;
  bat: () => void; dung: () => void; lamLai: () => void;
}) {
  const dongHo = `${String(Math.floor(giay / 60)).padStart(2, "0")}:${String(giay % 60).padStart(2, "0")}`;
  if (trangThai === "ghi")
    return (
      <div className="voice">
        <h3>🎤 Đang nghe…</h3>
        <p>Đọc tên, số điện thoại, làm gì, ở đâu, chốt chưa, bao nhiêu tiền. Xong bấm dừng.</p>
        <button className="mic rec" onClick={dung}>Dừng lại · {dongHo}</button>
      </div>
    );
  if (trangThai === "gui")
    return (
      <div className="voice">
        <h3>🎤 Đang đọc lại nội dung…</h3>
        <p>Máy đang nghe và tự điền vào các ô bên dưới.</p>
        <button className="mic" disabled>Chờ vài giây…</button>
      </div>
    );
  if (trangThai === "xong")
    return (
      <div className="voice">
        <h3>🎤 Đã điền xong</h3>
        {loiDoc && (
          <div className="heard">
            <div className="k">Máy nghe được</div>
            <span>“{loiDoc}”</span>
          </div>
        )}
        <div className="vdone">
          <span style={{ fontSize: 17 }}>✓</span>
          <span>
            <b>Đã điền {soO} thông tin.</b>
            Kiểm lại giúp, sai chỗ nào sửa chỗ đó rồi bấm Lưu khách.
          </span>
        </div>
        <div className="xoafile">
          <span>🗑</span>
          <span>
            File ghi âm <b>không được lưu ở đâu cả</b> — nó đi thẳng tới máy nghe rồi bị bỏ. Riêng
            đoạn chữ ở trên được giữ trong ô Ghi chú cuối trang.
          </span>
        </div>
        <button className="mic" style={{ marginTop: 11, background: "var(--panel)", color: "var(--ink)", border: "1.5px solid var(--line2)" }} onClick={lamLai}>
          Đọc lại từ đầu
        </button>
      </div>
    );
  return (
    <div className="voice">
      <h3>🎤 Nói cho nhanh</h3>
      <p>
        Ngại gõ thì bấm nút rồi đọc một hơi: <b>tên, số điện thoại, làm gì, ở đâu, chốt chưa, bao
        nhiêu tiền</b>. Máy tự điền vào các ô bên dưới, bạn chỉ việc kiểm lại.
      </p>
      <button className="mic" onClick={bat}>● Bấm để nói</button>
    </div>
  );
}
