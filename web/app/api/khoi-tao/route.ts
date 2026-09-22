import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bamPin } from "@/lib/mat-khau";
import { datPhien } from "@/lib/phien";
import { loiHeThong } from "@/lib/loi";

/**
 * Tạo tài khoản admin đầu tiên ngay trên trình duyệt, khỏi phải mở terminal.
 *
 * Chỉ chạy được khi bảng thợ còn trống. Có một người rồi là route này đóng
 * hẳn, nên không ai dùng nó để tự cấp quyền admin về sau.
 */
async function conTrong(): Promise<boolean | null> {
  const { count, error } = await db().from("tho").select("id", { count: "exact", head: true });
  if (error) return null;
  return (count ?? 0) === 0;
}

export async function GET() {
  const trong = await conTrong();
  if (trong === null) {
    return NextResponse.json(
      { san_sang: false, loi: "Chưa nối được database. Đã chạy file SQL tạo bảng chưa?" },
      { status: 503 }
    );
  }
  return NextResponse.json({ san_sang: trong });
}

export async function POST(req: Request) {
  const trong = await conTrong();
  if (trong === null) {
    return NextResponse.json(
      { loi: "Chưa nối được database. Đã chạy file SQL tạo bảng chưa?" },
      { status: 503 }
    );
  }
  if (!trong) {
    return NextResponse.json(
      { loi: "Đã có tài khoản rồi. Đăng nhập bằng mã PIN, hoặc nhờ admin thêm thợ trong Cài đặt." },
      { status: 403 }
    );
  }

  const b = (await req.json().catch(() => ({}))) as { ten?: string; pin?: string };
  const ten = String(b.ten || "").trim();
  const pin = String(b.pin || "").replace(/\D/g, "");
  if (!ten) return NextResponse.json({ loi: "Chưa điền tên của bạn." }, { status: 400 });
  if (pin.length < 4) return NextResponse.json({ loi: "Mã PIN phải đủ 4 số." }, { status: 400 });

  const { data, error } = await db()
    .from("tho")
    .insert({ ten, pin_bam: await bamPin(pin), vai_tro: "admin" })
    .select("id, ten, vai_tro")
    .single();
  if (error) return loiHeThong("khoi-tao", error);

  // Tạo xong đăng nhập luôn, khỏi bắt gõ lại mã vừa đặt.
  await datPhien({ thoId: data.id, ten: data.ten, vaiTro: "admin" });
  return NextResponse.json({ tho: data });
}
