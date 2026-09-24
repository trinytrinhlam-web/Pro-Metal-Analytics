import { phienHienTai } from "@/lib/phien";
import NhapApp from "./NhapApp";

export const dynamic = "force-dynamic";

export default async function TrangNhap() {
  const phien = await phienHienTai();
  return (
    <NhapApp
      thoBanDau={phien ? { ten: phien.ten, vaiTro: phien.vaiTro } : null}
      coAI={Boolean(process.env.GEMINI_API_KEY)}
    />
  );
}
