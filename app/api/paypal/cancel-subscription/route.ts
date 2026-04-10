import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cancelPayPalSubscription } from '@/lib/paypal';
import { getD1 } from '@/lib/db';

/**
 * Cancel PayPal subscription (user-initiated)
 * POST /api/paypal/cancel-subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get user's subscription ID
    const user = await db
      .prepare(`SELECT paypal_subscription_id, paypal_subscription_status FROM users WHERE id = ?`)
      .bind(session.user.id)
      .first();

    if (!user?.paypal_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (user.paypal_subscription_status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Cancel subscription on PayPal
    await cancelPayPalSubscription(user.paypal_subscription_id);

    // Mark subscription as cancelled (will downgrade at period end)
    await db
      .prepare(
        `UPDATE users
         SET subscription_cancel_at_period_end = 1,
             paypal_subscription_status = ?
         WHERE id = ?`
      )
      .bind('cancelled', session.user.id)
      .run();

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
    });
  } catch (error: any) {
    console.error('Cancel PayPal subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
