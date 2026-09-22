// Service worker tối giản: giữ được vỏ app để mở offline, còn dữ liệu thì
// luôn lấy từ mạng. Đơn nhập lúc mất sóng nằm trong hàng đợi phía trang, không
// phải ở đây — để logic gửi lại chỉ nằm một chỗ cho dễ lần.
const KHO = "csr-vo-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(KHO).then((c) => c.addAll(["/nhap", "/manifest.webmanifest", "/icon-192.png"]))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== KHO).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                       // POST/PATCH luôn đi thẳng ra mạng
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;           // dữ liệu không bao giờ lấy từ kho

  e.respondWith(
    fetch(req)
      .then((res) => {
        const ban = res.clone();
        caches.open(KHO).then((c) => c.put(req, ban)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/nhap")))
  );
});
