import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const pw = process.env.DB_PASSWORD ?? "";
  return NextResponse.json({
    DB_HOST: process.env.DB_HOST ? "set" : "MISSING",
    DB_USER: process.env.DB_USER ?? "MISSING",
    DB_NAME: process.env.DB_NAME ?? "MISSING",
    // show password length + first/last 2 chars only, never the full value
    DB_PASSWORD_len: pw.length,
    DB_PASSWORD_preview: pw.length > 0 ? pw[0] + pw[1] + "..." + pw[pw.length - 2] + pw[pw.length - 1] : "MISSING",
  });
}
