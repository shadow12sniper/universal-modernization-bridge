import { NextResponse } from "next/server";
import { query } from "@/lib/adapters/sql-adapter";

export async function GET() {
  const rows = await query(
    `SELECT * FROM audit_log ORDER BY id DESC LIMIT 50`,
    []
  );
  return NextResponse.json({ ok: true, requests: rows });
}