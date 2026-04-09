import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = (req as any).env?.DB
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 500 })
  }

  try {
    const result = await db
      .prepare(
        `SELECT
          id, email, name, image, created_at, last_login,
          usage_count, credits_remaining, membership_type,
          membership_expires_at, total_credits_purchased
        FROM users
        WHERE email = ?`
      )
      .bind(session.user.email)
      .first()

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 检查会员是否过期
    const now = new Date()
    let membershipType = result.membership_type
    if (result.membership_expires_at && new Date(result.membership_expires_at) < now) {
      membershipType = 'free'
    }

    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      image: result.image,
      createdAt: result.created_at,
      lastLogin: result.last_login,
      usageCount: result.usage_count,
      creditsRemaining: result.credits_remaining,
      membershipType,
      membershipExpiresAt: result.membership_expires_at,
      totalCreditsPurchased: result.total_credits_purchased,
    })
  } catch (e) {
    console.error("profile fetch error:", e)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
