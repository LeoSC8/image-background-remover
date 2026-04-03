export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = (process.env as any).DB
  if (!db) {
    return NextResponse.json({ ok: true })
  }

  try {
    await db
      .prepare(
        "UPDATE users SET usage_count = usage_count + 1, last_login = CURRENT_TIMESTAMP WHERE email = ?"
      )
      .bind(session.user.email)
      .run()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("usage update error:", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}
