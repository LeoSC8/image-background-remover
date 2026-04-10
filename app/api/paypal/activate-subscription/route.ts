import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPayPalSubscription } from '@/lib/paypal';
import { getD1 } from '@/lib/db';

/**
 * Activate PayPal subscription after user approval (return URL)
 * GET /api/paypal/activate-subscription?subscription_id=xxx&transactionId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscription_id');
    const transactionId = searchParams.get('transactionId');

    if (!subscriptionId || !transactionId) {
      return NextResponse.redirect(new URL('/pricing?error=missing_params', request.url));
    }

    const db = getD1();
    if (!db) {
      return NextResponse.redirect(new URL('/pricing?error=database_error', request.url));
    }

    // Get transaction details
    const transaction = await db
      .prepare(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`)
      .bind(transactionId, session.user.id)
      .first();

    if (!transaction) {
      return NextResponse.redirect(new URL('/pricing?error=transaction_not_found', request.url));
    }

    if (transaction.status === 'completed') {
      return NextResponse.redirect(new URL('/profile?success=already_completed', request.url));
    }

    // Get subscription details from PayPal
    const subscription = await getPayPalSubscription(subscriptionId);

    if (subscription.status !== 'ACTIVE') {
      await db
        .prepare(`UPDATE transactions SET status = ? WHERE id = ?`)
        .bind('failed', transactionId)
        .run();
      return NextResponse.redirect(new URL('/pricing?error=subscription_not_active', request.url));
    }

    // Update transaction status
    await db
      .prepare(`UPDATE transactions SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind('completed', transactionId)
      .run();

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user membership
    const creditsToAdd = transaction.membership_type === 'premium' ? 100 : 0;

    await db
      .prepare(
        `UPDATE users
         SET membership_type = ?,
             membership_expires_at = ?,
             credits_remaining = credits_remaining + ?,
             paypal_subscription_id = ?,
             paypal_subscription_status = ?,
             subscription_cancel_at_period_end = 0
         WHERE id = ?`
      )
      .bind(
        transaction.membership_type,
        expiresAt.toISOString(),
        creditsToAdd,
        subscriptionId,
        'active',
        session.user.id
      )
      .run();

    return NextResponse.redirect(new URL('/profile?success=subscription_activated', request.url));
  } catch (error: any) {
    console.error('Activate PayPal subscription error:', error);
    return NextResponse.redirect(new URL('/pricing?error=activation_failed', request.url));
  }
}
