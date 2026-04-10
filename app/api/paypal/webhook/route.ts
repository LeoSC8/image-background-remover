import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { getD1 } from '@/lib/db';

/**
 * PayPal Webhook Handler
 * POST /api/paypal/webhook
 *
 * Handles PayPal webhook events:
 * - BILLING.SUBSCRIPTION.ACTIVATED
 * - BILLING.SUBSCRIPTION.CANCELLED
 * - BILLING.SUBSCRIPTION.EXPIRED
 * - BILLING.SUBSCRIPTION.PAYMENT.FAILED
 * - PAYMENT.SALE.COMPLETED
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers: Record<string, string> = {};

    // Extract PayPal headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('paypal-')) {
        headers[key.toLowerCase()] = value;
      }
    });

    // Verify webhook signature (optional but recommended for production)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      const isValid = await verifyPayPalWebhook(webhookId, headers, body);
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const eventType = body.event_type;
    const resource = body.resource;

    console.log('PayPal webhook event:', eventType, resource);

    const db = getD1();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Subscription activated (first payment successful)
        const subscriptionId = resource.id;

        await db
          .prepare(
            `UPDATE users
             SET paypal_subscription_status = ?
             WHERE paypal_subscription_id = ?`
          )
          .bind('active', subscriptionId)
          .run();

        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // Subscription cancelled by user or system
        const subscriptionId = resource.id;

        await db
          .prepare(
            `UPDATE users
             SET paypal_subscription_status = ?,
                 subscription_cancel_at_period_end = 1
             WHERE paypal_subscription_id = ?`
          )
          .bind('cancelled', subscriptionId)
          .run();

        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        // Subscription expired (billing cycle ended)
        const subscriptionId = resource.id;

        // Downgrade to free tier
        await db
          .prepare(
            `UPDATE users
             SET membership_type = ?,
                 paypal_subscription_status = ?,
                 paypal_subscription_id = NULL,
                 subscription_cancel_at_period_end = 0
             WHERE paypal_subscription_id = ?`
          )
          .bind('free', 'expired', subscriptionId)
          .run();

        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        // Payment failed for subscription renewal
        const subscriptionId = resource.id;

        await db
          .prepare(
            `UPDATE users
             SET paypal_subscription_status = ?
             WHERE paypal_subscription_id = ?`
          )
          .bind('payment_failed', subscriptionId)
          .run();

        break;
      }

      case 'BILLING.SUBSCRIPTION.RENEWED':
      case 'PAYMENT.SALE.COMPLETED': {
        // Subscription renewed successfully
        const subscriptionId = resource.billing_agreement_id || resource.id;

        if (subscriptionId) {
          // Get user and membership type
          const user = await db
            .prepare(`SELECT id, membership_type FROM users WHERE paypal_subscription_id = ?`)
            .bind(subscriptionId)
            .first();

          if (user) {
            // Extend membership by 30 days
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            // Add credits for premium users
            const creditsToAdd = user.membership_type === 'premium' ? 100 : 0;

            await db
              .prepare(
                `UPDATE users
                 SET membership_expires_at = ?,
                     credits_remaining = credits_remaining + ?,
                     paypal_subscription_status = ?
                 WHERE id = ?`
              )
              .bind(expiresAt.toISOString(), creditsToAdd, 'active', user.id)
              .run();
          }
        }

        break;
      }

      default:
        console.log('Unhandled PayPal webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
