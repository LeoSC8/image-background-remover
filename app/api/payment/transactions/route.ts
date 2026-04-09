import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = (request as any).env?.DB;
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get user
    const user = await db
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .bind(session.user.email)
      .first();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // Get pagination params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get transactions
    const transactions = await db
      .prepare(
        `SELECT id, transaction_type, amount_usd, credits_added, membership_type,
                membership_duration_days, status, created_at, completed_at
         FROM transactions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(user.id, limit, offset)
      .all();

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM transactions WHERE user_id = ?`)
      .bind(user.id)
      .first();

    return NextResponse.json({
      transactions: transactions.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
