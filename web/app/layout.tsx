import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cửa Sắt Lead Radar",
  description: "Nhập khách và phân tích quảng cáo cho xưởng cửa sắt",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Lead Radar", statusBarStyle: "default" },
  // Khai báo icon ở đây, nếu không trình duyệt cứ đi xin /favicon.ico rồi ăn
  // 404, còn iPhone lưu app ra màn hình chính bằng ảnh chụp trang thay vì icon.
  icons: {
    icon: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    shortcut: "/icon-192.png",
    apple: [{ url: "/icon-192.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1319" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
