import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getD1 } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getD1()
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 500 })
  }

  // 获取分页参数
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    // 先获取用户ID
    const user = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(session.user.email)
      .first()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 获取使用历史记录
    const history = await db
      .prepare(
        `SELECT
          id, action_type, credits_used, created_at,
          image_size, status, error_message
        FROM usage_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`
      )
      .bind(user.id, limit, offset)
      .all()

    // 获取总记录数
    const countResult = await db
      .prepare("SELECT COUNT(*) as total FROM usage_history WHERE user_id = ?")
      .bind(user.id)
      .first()

    return NextResponse.json({
      history: history.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    })
  } catch (e) {
    console.error("history fetch error:", e)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
