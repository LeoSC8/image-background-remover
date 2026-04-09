import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getD1 } from '@/lib/db';

// Helper function to add watermark to image
async function addWatermark(imageBlob: Blob): Promise<Blob> {
  // For now, return the original blob
  // In production, you would use canvas or image processing library
  // to add a watermark overlay
  return imageBlob;
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const db = getD1();

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image_file') as File;
    const imageSize = imageFile?.size || 0;

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let userId: string | null = null;
    let creditsRemaining = 0;
    let hasWatermark = false;
    let membershipType = 'anonymous';

    // Handle unauthenticated users
    if (!session?.user?.email) {
      const clientIP = getClientIP(request);

      // Check file size limit (2MB for anonymous users)
      if (imageSize > 2 * 1024 * 1024) {
        return NextResponse.json({
          error: '未登录用户文件大小限制为2MB，请登录以使用完整功能'
        }, { status: 413 });
      }

      // Check daily usage for anonymous users
      const anonUsage = await db
        .prepare(
          `SELECT id, usage_count FROM anonymous_usage
           WHERE ip_address = ? AND usage_date = ?`
        )
        .bind(clientIP, today)
        .first();

      if (anonUsage && anonUsage.usage_count >= 3) {
        return NextResponse.json({
          error: '未登录用户每日限制3次，请登录以获取更多额度',
          dailyLimit: 3,
          usedToday: anonUsage.usage_count
        }, { status: 403 });
      }

      hasWatermark = true;
      creditsRemaining = 3 - (anonUsage?.usage_count || 0) - 1;

      // Call remove.bg API
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Remove.bg API error:', error);
        return NextResponse.json({ error: '图片处理失败' }, { status: response.status });
      }

      // Update or insert anonymous usage
      if (anonUsage) {
        await db
          .prepare(
            `UPDATE anonymous_usage
             SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(anonUsage.id)
          .run();
      } else {
        await db
          .prepare(
            `INSERT INTO anonymous_usage (id, ip_address, usage_count, usage_date)
             VALUES (?, ?, 1, ?)`
          )
          .bind(crypto.randomUUID(), clientIP, today)
          .run();
      }

      let blob = await response.blob();
      if (hasWatermark) {
        blob = await addWatermark(blob);
      }

      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'image/png',
          'X-Credits-Remaining': String(creditsRemaining),
          'X-Has-Watermark': 'true',
          'X-User-Type': 'anonymous',
        },
      });
    }

    // Handle authenticated users
    const user = await db
      .prepare(
        `SELECT id, credits_remaining, membership_type, membership_expires_at,
                daily_usage_count, daily_usage_reset_date
         FROM users WHERE email = ?`
      )
      .bind(session.user.email)
      .first();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    userId = user.id;
    const now = new Date();

    // Check and update membership expiration
    membershipType = user.membership_type;
    if (user.membership_expires_at && new Date(user.membership_expires_at) < now) {
      membershipType = 'free';
      await db
        .prepare(`UPDATE users SET membership_type = 'free' WHERE id = ?`)
        .bind(user.id)
        .run();
    }

    // Reset daily usage if needed
    let dailyUsageCount = user.daily_usage_count || 0;
    if (user.daily_usage_reset_date !== today) {
      dailyUsageCount = 0;
      await db
        .prepare(
          `UPDATE users
           SET daily_usage_count = 0, daily_usage_reset_date = ?
           WHERE id = ?`
        )
        .bind(today, user.id)
        .run();
    }

    // Check daily limits based on membership
    if (membershipType === 'free') {
      if (dailyUsageCount >= 5) {
        return NextResponse.json({
          error: '免费用户每日限制5次，请购买额度包或升级会员',
          dailyLimit: 5,
          usedToday: dailyUsageCount
        }, { status: 403 });
      }
    } else if (membershipType === 'premium') {
      // Premium: 100 credits per month (tracked via credits_remaining)
      if (user.credits_remaining <= 0) {
        return NextResponse.json({
          error: 'Premium会员月度额度已用完，请等待下月重置或购买额度包',
          creditsRemaining: 0
        }, { status: 403 });
      }
    }
    // VIP: unlimited (no check needed)

    // Check file size limit (10MB for authenticated users)
    if (imageSize > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: '文件大小超过10MB限制'
      }, { status: 413 });
    }

    // Call remove.bg API
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Remove.bg API error:', error);

      // Record failed usage
      await db
        .prepare(
          `INSERT INTO usage_history (id, user_id, action_type, credits_used, image_size, status, error_message)
           VALUES (?, ?, 'remove_bg', 0, ?, 'failed', ?)`
        )
        .bind(crypto.randomUUID(), user.id, imageSize, error)
        .run();

      return NextResponse.json({ error: '图片处理失败' }, { status: response.status });
    }

    // Deduct credits and update usage
    if (membershipType === 'free' || membershipType === 'premium') {
      await db
        .prepare(
          `UPDATE users
           SET credits_remaining = credits_remaining - 1,
               daily_usage_count = daily_usage_count + 1,
               usage_count = usage_count + 1,
               last_login = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(user.id)
        .run();
      creditsRemaining = user.credits_remaining - 1;
    } else {
      // VIP: unlimited, just update counters
      await db
        .prepare(
          `UPDATE users
           SET daily_usage_count = daily_usage_count + 1,
               usage_count = usage_count + 1,
               last_login = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(user.id)
        .run();
      creditsRemaining = -1; // unlimited
    }

    // Record successful usage
    await db
      .prepare(
        `INSERT INTO usage_history (id, user_id, action_type, credits_used, image_size, status)
         VALUES (?, ?, 'remove_bg', 1, ?, 'success')`
      )
      .bind(crypto.randomUUID(), user.id, imageSize)
      .run();

    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'image/png',
        'X-Credits-Remaining': String(creditsRemaining),
        'X-Has-Watermark': 'false',
        'X-User-Type': membershipType,
      },
    });
  } catch (error) {
    console.error('Remove.bg proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
