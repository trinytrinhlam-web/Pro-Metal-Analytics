import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loiHeThong } from "@/lib/loi";
import { chanAdmin } from "@/lib/quyen";
import { chuanSdt } from "@/lib/danh-muc";
import { daTungGoi } from "@/lib/khach";
import { dongBoHangMuc } from "@/lib/bao-hanh";
import { ghiChuCuoc } from "@/lib/doc-csv";
import type { TrangThai } from "@/lib/kieu";

const COT =
  "id, thoi_diem, ten, so_dien_thoai, gioi_tinh, hotline_id, dich_vu, khu_vuc, loai_cong_trinh, trang_thai, ly_do_tu_choi, doanh_thu, ghi_chu, giay_goi, tu_bao_cao, la_khach_cu, tho_id, da_duyet, tao_luc, sua_luc" as const;

/** Đơn trong một khoảng thời gian. Phần phân tích tự tính từ đây. */
export async function GET(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const sp = new URL(req.url).searchParams;
  const tu = sp.get("tu");
  const den = sp.get("den");
  const chuaDuyet = sp.get("chua_duyet") === "1";

  let q = db().from("khach_hang").select(COT);
  if (tu) q = q.gte("thoi_diem", tu);
  if (den) q = q.lte("thoi_diem", den);
  if (chuaDuyet) q = q.eq("da_duyet", false);

  const { data, error } = await q.order("thoi_diem", { ascending: false }).limit(5000);
  if (error) return loiHeThong("admin/don: doc", error);
  return NextResponse.json({ ds: data ?? [] });
}

/**
 * Tạo đơn nháp từ báo cáo cuộc gọi — những khách đã gọi mà không có trong hệ
 * thống. Tiền quảng cáo cho các cuộc đó đã trả rồi, bỏ qua là số liệu sai.
 */
export async function POST(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const b = (await req.json().catch(() => ({}))) as {
    hotline_id?: string | null;
    ds?: { sdt: string; luc?: string | null; giay?: number; tinh_trang?: string | null }[];
  };
  const ds = (b.ds ?? []).filter((x) => chuanSdt(x.sdt).length >= 9);
  if (!ds.length) return NextResponse.json({ loi: "Không có cuộc gọi nào để tạo." }, { status: 400 });

  const dong = [];
  for (const x of ds) {
    const sdt = chuanSdt(x.sdt);
    const luc = x.luc ? new Date(x.luc) : new Date();
    dong.push({
      thoi_diem: luc.toISOString(),
      so_dien_thoai: sdt,
      hotline_id: b.hotline_id ?? null,
      dich_vu: [] as string[],
      trang_thai: "hoi_gia" as const,
      giay_goi: x.giay ?? null,
      ghi_chu: ghiChuCuoc(x.tinh_trang, x.giay),
      tu_bao_cao: true,
      la_khach_cu: await daTungGoi(sdt, luc),
      da_duyet: false,
    });
  }

  const { data, error } = await db().from("khach_hang").insert(dong).select(COT);
  if (error) return loiHeThong("admin/don: tao tu bao cao", error);
  return NextResponse.json({ ds: data ?? [], so: data?.length ?? 0 });
}

/** Sửa một đơn, hoặc sửa hàng loạt. Admin sửa được mọi trường. */
export async function PATCH(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;

  const b = (await req.json().catch(() => ({}))) as {
    ids?: string[];
    hotline_id?: string | null;
    da_duyet?: boolean;
    truong?: Record<string, unknown>;
  };
  const ids = (b.ids ?? []).filter(Boolean);
  if (!ids.length) return NextResponse.json({ loi: "Chưa chọn đơn nào." }, { status: 400 });

  const capNhat: Record<string, unknown> = { ...(b.truong ?? {}) };
  if (b.hotline_id !== undefined) capNhat.hotline_id = b.hotline_id;
  if (b.da_duyet !== undefined) {
    capNhat.da_duyet = b.da_duyet;
    capNhat.duyet_luc = b.da_duyet ? new Date().toISOString() : null;
    capNhat.duyet_boi = b.da_duyet ? g.phien.thoId : null;
  }
  if (!Object.keys(capNhat).length) {
    return NextResponse.json({ loi: "Không có gì để sửa." }, { status: 400 });
  }

  const { data, error } = await db().from("khach_hang").update(capNhat).in("id", ids).select(COT);
  if (error) return loiHeThong("admin/don: sua", error);

  // Admin sửa trạng thái hoặc dịch vụ ở màn Duyệt đơn thì bảo hành phải theo:
  // chốt đơn là sinh hạn bảo hành, bỏ chốt là gỡ đi.
  const truong = b.truong ?? {};
  if ("trang_thai" in truong || "dich_vu" in truong) {
    for (const d of data ?? []) {
      await dongBoHangMuc(
        d.id as string,
        d.trang_thai as TrangThai,
        (d.dich_vu as string[] | null) ?? [],
        new Date(d.thoi_diem as string)
      );
    }
  }
  return NextResponse.json({ ds: data ?? [], so: data?.length ?? 0 });
}

/** Xoá đơn nhập trùng. Hạng mục bảo hành đi theo nhờ khoá ngoại on delete cascade. */
export async function DELETE(req: Request) {
  const g = await chanAdmin();
  if ("tra" in g) return g.tra;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ loi: "Thiếu id." }, { status: 400 });

  const { error } = await db().from("khach_hang").delete().eq("id", id);
  if (error) return loiHeThong("admin/don: xoa", error);
  return NextResponse.json({ xong: true });
}
