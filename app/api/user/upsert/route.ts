import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { id, email, name, image } = await req.json()

  if (!id || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const db = (req as any).env?.DB
  if (!db) {
    return NextResponse.json({ ok: true })
  }

  try {
    await db
      .prepare(
        `INSERT INTO users (id, email, name, image, last_login)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(email) DO UPDATE SET
           name = excluded.name,
           image = excluded.image,
           last_login = CURRENT_TIMESTAMP`
      )
      .bind(id, email, name ?? null, image ?? null)
      .run()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("upsert error:", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}
