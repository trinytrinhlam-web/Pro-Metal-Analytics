import { phienHienTai } from "@/lib/phien";
import CaiDat from "./CaiDat";

export const dynamic = "force-dynamic";

export default async function TrangCaiDat() {
  const phien = await phienHienTai();
  return <CaiDat ten={phien?.ten ?? ""} />;
}
