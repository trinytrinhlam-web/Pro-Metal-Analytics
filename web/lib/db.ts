import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client dùng service role — CHỈ được gọi từ code chạy trên server.
 * Toàn bộ phân quyền nằm ở các route handler, còn RLS trong Supabase bật
 * mà không có policy nào nên không ai vào thẳng database được.
 */
let _db: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Trang Data API của Supabase hiện URL kèm đuôi `/rest/v1/`, rất dễ copy cả
 * đuôi. Thư viện tự thêm đuôi đó vào nên để nguyên là thành `/rest/v1/rest/v1/`
 * rồi hỏng — cắt sẵn cho khỏi phải đi dò.
 */
export function donUrl(x: string | undefined): string {
  return String(x || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(rest|auth|storage|realtime)\/v1$/i, "");
}

export function db() {
  if (_db) return _db;
  const url = donUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. Xem web/.env.example."
    );
  }
  _db = createClient<Database>(url, key, { auth: { persistSession: false } });
  return _db;
}
