import QRCode from "qrcode";
import { phienHienTai } from "@/lib/phien";

/**
 * Mã QR để thợ quét bằng camera điện thoại, khỏi phải gõ địa chỉ.
 * Sinh ngay trên máy chủ mình, không nhờ dịch vụ QR nào bên ngoài — địa chỉ
 * app không đi ra khỏi hệ thống.
 */
export async function GET(req: Request) {
  const phien = await phienHienTai();
  if (!phien || phien.vaiTro !== "admin") {
    return new Response("Chỉ admin.", { status: 403 });
  }

  const noiDung = new URL(req.url).searchParams.get("t") || "";
  if (!noiDung || noiDung.length > 300) {
    return new Response("Thiếu nội dung.", { status: 400 });
  }

  const svg = await QRCode.toString(noiDung, {
    type: "svg",
    margin: 1,
    width: 240,
    errorCorrectionLevel: "M",
    color: { dark: "#101720", light: "#ffffff" },
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "private, max-age=3600",
    },
  });
}
