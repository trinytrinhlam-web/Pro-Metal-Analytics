/**
 * Tạo tài khoản admin đầu tiên. Chạy một lần sau khi đã chạy migration:
 *   node scripts/tao-admin.mjs "Anh Lâm" 1234
 *
 * Từ lần sau admin tự thêm thợ trong màn Cài đặt, không cần script này nữa.
 */
import { readFileSync } from "node:fs";
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const scrypt = promisify(_scrypt);

// Đọc .env.local cho tiện, khỏi phải export tay
for (const ten of [".env.local", ".env"]) {
  try {
    for (const dong of readFileSync(new URL(`../${ten}`, import.meta.url), "utf8").split("\n")) {
      const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const [ten, pin] = process.argv.slice(2);
if (!ten || !/^\d{4,6}$/.test(pin || "")) {
  console.error('Cách dùng: node scripts/tao-admin.mjs "Tên admin" 1234');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

// Mã PIN không được trùng vì đăng nhập chỉ dựa vào mã.
const { data: daCo, error: loiDoc } = await db.from("tho").select("id, ten, pin_bam");
if (loiDoc) {
  console.error("Không đọc được bảng tho:", loiDoc.message);
  console.error("Đã chạy file supabase/migrations/0001_khoi_tao.sql chưa?");
  process.exit(1);
}
for (const t of daCo ?? []) {
  const [, muoi, bam] = String(t.pin_bam).split("$");
  if (muoi && bam && (await scrypt(pin, muoi, 32)).toString("hex") === bam) {
    console.error(`Mã ${pin} đã có ${t.ten} dùng. Chọn mã khác.`);
    process.exit(1);
  }
}

const muoi = randomBytes(16).toString("hex");
const pin_bam = `scrypt$${muoi}$${(await scrypt(pin, muoi, 32)).toString("hex")}`;
const { error } = await db.from("tho").insert({ ten, pin_bam, vai_tro: "admin" });
if (error) {
  console.error("Không tạo được:", error.message);
  process.exit(1);
}
console.log(`✓ Đã tạo admin "${ten}" với mã PIN ${pin}.`);
console.log("  Vào /nhap nhập mã này, rồi mở /admin để thêm thợ.");
