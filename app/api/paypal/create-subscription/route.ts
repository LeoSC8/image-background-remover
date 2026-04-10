import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPayPalSubscription } from '@/lib/paypal';
import { getD1 } from '@/lib/db';

/**
 * Create PayPal subscription for Premium/VIP membership
 * POST /api/paypal/create-subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { membershipType, planId } = body;

    if (!membershipType || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['premium', 'vip'].includes(membershipType)) {
      return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
    }

    // Create transaction record
    const db = getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const amount = membershipType === 'premium' ? 1.99 : 4.99;
    const creditsAdded = membershipType === 'premium' ? 100 : 0;

    await db
      .prepare(
        `INSERT INTO transactions (id, user_id, transaction_type, amount_usd, credits_added, membership_type, membership_duration_days, status, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(transactionId, session.user.id, 'membership_upgrade', amount, creditsAdded, membershipType, 30, 'pending', 'paypal')
      .run();

    // Create PayPal subscription
    const baseUrl = process.env.AUTH_URL || 'https://leosc8.online';
    const returnUrl = `${baseUrl}/api/paypal/activate-subscription?transactionId=${transactionId}`;
    const cancelUrl = `${baseUrl}/pricing?cancelled=true`;

    const subscription = await createPayPalSubscription(planId, returnUrl, cancelUrl);

    // Store PayPal subscription ID
    await db
      .prepare(`UPDATE transactions SET paypal_subscription_id = ? WHERE id = ?`)
      .bind(subscription.id, transactionId)
      .run();

    // Find approval URL
    const approvalUrl = subscription.links.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl,
      transactionId,
    });
  } catch (error: any) {
    console.error('Create PayPal subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
