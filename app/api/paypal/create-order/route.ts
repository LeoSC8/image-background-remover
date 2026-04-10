import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPayPalOrder } from '@/lib/paypal';
import { getD1 } from '@/lib/db';

/**
 * Create PayPal order for credit pack purchase
 * POST /api/paypal/create-order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credits, amount, packId } = body;

    if (!credits || !amount || !packId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create transaction record
    const db = getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(
        `INSERT INTO transactions (id, user_id, transaction_type, amount_usd, credits_added, status, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(transactionId, session.user.id, 'credit_pack', amount, credits, 'pending', 'paypal')
      .run();

    // Create PayPal order
    const baseUrl = process.env.AUTH_URL || 'https://leosc8.online';
    const returnUrl = `${baseUrl}/api/paypal/capture-order?transactionId=${transactionId}`;
    const cancelUrl = `${baseUrl}/pricing?cancelled=true`;

    const order = await createPayPalOrder(
      amount,
      `${credits} Credits Pack`,
      returnUrl,
      cancelUrl
    );

    // Store PayPal order ID
    await db
      .prepare(`UPDATE transactions SET paypal_order_id = ? WHERE id = ?`)
      .bind(order.id, transactionId)
      .run();

    // Find approval URL
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
      transactionId,
    });
  } catch (error: any) {
    console.error('Create PayPal order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
