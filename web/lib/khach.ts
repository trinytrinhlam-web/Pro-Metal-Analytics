import { db } from "./db";

/**
 * Số này đã gọi trước đây chưa? Cách nhau dưới 12 tiếng thì coi là thợ nhập
 * trùng chứ không phải khách quay lại.
 */
export async function daTungGoi(sdt: string, moc: Date): Promise<boolean> {
  const { count } = await db()
    .from("khach_hang")
    .select("id", { count: "exact", head: true })
    .eq("so_dien_thoai", sdt)
    .lt("thoi_diem", new Date(moc.getTime() - 12 * 3600e3).toISOString());
  return (count ?? 0) > 0;
}
