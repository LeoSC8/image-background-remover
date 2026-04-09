import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getD1 } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { type, itemId, amount, credits, membershipType, durationDays } = body;

    // Validate input
    if (!type || !itemId || !amount) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // Get user
    const user = await db
      .prepare(`SELECT id, email FROM users WHERE email = ?`)
      .bind(session.user.email)
      .first();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const transactionId = crypto.randomUUID();

    if (type === 'credit_pack') {
      // Purchase credit pack
      if (!credits || credits <= 0) {
        return NextResponse.json({ error: '额度数量无效' }, { status: 400 });
      }

      // Create transaction record
      await db
        .prepare(
          `INSERT INTO transactions (id, user_id, transaction_type, amount_usd, credits_added, status, payment_method, completed_at)
           VALUES (?, ?, 'credit_pack', ?, ?, 'completed', 'demo', CURRENT_TIMESTAMP)`
        )
        .bind(transactionId, user.id, amount, credits)
        .run();

      // Add credits to user
      await db
        .prepare(
          `UPDATE users
           SET credits_remaining = credits_remaining + ?,
               total_credits_purchased = total_credits_purchased + ?
           WHERE id = ?`
        )
        .bind(credits, credits, user.id)
        .run();

      return NextResponse.json({
        success: true,
        transactionId,
        creditsAdded: credits,
        message: `成功购买 ${credits} 次额度`
      });

    } else if (type === 'membership') {
      // Upgrade membership
      if (!membershipType || !durationDays) {
        return NextResponse.json({ error: '会员类型或时长无效' }, { status: 400 });
      }

      // Calculate expiration date
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Determine credits to add based on membership type
      let creditsToAdd = 0;
      if (membershipType === 'premium') {
        creditsToAdd = 100; // Premium gets 100 credits per month
      }
      // VIP gets unlimited (no credits needed)

      // Create transaction record
      await db
        .prepare(
          `INSERT INTO transactions (id, user_id, transaction_type, amount_usd, credits_added, membership_type, membership_duration_days, status, payment_method, completed_at)
           VALUES (?, ?, 'membership_upgrade', ?, ?, ?, ?, 'completed', 'demo', CURRENT_TIMESTAMP)`
        )
        .bind(transactionId, user.id, amount, creditsToAdd, membershipType, durationDays)
        .run();

      // Update user membership
      if (membershipType === 'premium') {
        await db
          .prepare(
            `UPDATE users
             SET membership_type = ?,
                 membership_expires_at = ?,
                 credits_remaining = credits_remaining + ?
             WHERE id = ?`
          )
          .bind(membershipType, expiresAt.toISOString(), creditsToAdd, user.id)
          .run();
      } else {
        // VIP doesn't need credits
        await db
          .prepare(
            `UPDATE users
             SET membership_type = ?,
                 membership_expires_at = ?
             WHERE id = ?`
          )
          .bind(membershipType, expiresAt.toISOString(), user.id)
          .run();
      }

      return NextResponse.json({
        success: true,
        transactionId,
        membershipType,
        expiresAt: expiresAt.toISOString(),
        creditsAdded: creditsToAdd,
        message: `成功升级为 ${membershipType.toUpperCase()} 会员`
      });

    } else {
      return NextResponse.json({ error: '无效的购买类型' }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
