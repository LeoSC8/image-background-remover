import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { capturePayPalOrder } from '@/lib/paypal';
import { getD1 } from '@/lib/db';

/**
 * Capture PayPal order after user approval (return URL)
 * GET /api/paypal/capture-order?token=xxx&transactionId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token'); // PayPal order ID
    const transactionId = searchParams.get('transactionId');

    if (!token || !transactionId) {
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

    // Capture the order
    const capture = await capturePayPalOrder(token);

    if (capture.status !== 'COMPLETED') {
      await db
        .prepare(`UPDATE transactions SET status = ? WHERE id = ?`)
        .bind('failed', transactionId)
        .run();
      return NextResponse.redirect(new URL('/pricing?error=payment_failed', request.url));
    }

    // Update transaction status
    await db
      .prepare(`UPDATE transactions SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind('completed', transactionId)
      .run();

    // Add credits to user
    await db
      .prepare(
        `UPDATE users
         SET credits_remaining = credits_remaining + ?,
             total_credits_purchased = total_credits_purchased + ?
         WHERE id = ?`
      )
      .bind(transaction.credits_added, transaction.credits_added, session.user.id)
      .run();

    return NextResponse.redirect(new URL('/profile?success=credits_added', request.url));
  } catch (error: any) {
    console.error('Capture PayPal order error:', error);
    return NextResponse.redirect(new URL('/pricing?error=capture_failed', request.url));
  }
}
