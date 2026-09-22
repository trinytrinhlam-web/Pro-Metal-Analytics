import { NextResponse } from "next/server";
import { xoaPhien } from "@/lib/phien";

export async function POST() {
  await xoaPhien();
  return NextResponse.json({ xong: true });
}
