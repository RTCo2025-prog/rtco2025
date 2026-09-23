import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// إجبار Next.js على جلب الإشعارات ديناميكياً بدون تخزين مؤقت على خوادم الاستضافة
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function initNotificationsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sector VARCHAR(50) NOT NULL,
        action_type VARCHAR(50) NOT NULL DEFAULT 'ADD',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(255) DEFAULT '/',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error("Init Notifications Table Error:", e);
  }
}

export async function GET() {
  try {
    await initNotificationsTable();
    const res = await query(`
      SELECT DISTINCT ON (title, message) * 
      FROM system_notifications 
      ORDER BY title, message, created_at DESC
      LIMIT 100
    `);
    
    const notifications = (res.rows || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (err: any) {
    console.error("Notifications GET Error:", err);
    return NextResponse.json({ success: false, error: err.message, notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initNotificationsTable();
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'MARK_AS_READ') {
      const { notification_id } = body;
      if (notification_id) {
        await query(
          `UPDATE system_notifications SET is_read = TRUE WHERE notification_id = $1`,
          [notification_id]
        );
      } else {
        await query(`UPDATE system_notifications SET is_read = TRUE`);
      }
      return NextResponse.json({ success: true });
    }

    const title = String(body.title || 'إشعار إداري').slice(0, 255);
    const message = String(body.message || '');
    const sector = String(body.sector || 'ADMIN_DOCS').slice(0, 50);
    const action_type = String(body.action_type || 'ADD').slice(0, 50);
    const link = String(body.link || '/').slice(0, 255);

    // حماية ضد التكرار خلال 30 ثانية
    const duplicateCheck = await query(`
      SELECT notification_id FROM system_notifications 
      WHERE title = $1 AND message = $2 AND created_at > NOW() - INTERVAL '30 seconds'
    `, [title, message]);

    if (duplicateCheck.rows && duplicateCheck.rows.length > 0) {
      return NextResponse.json({ success: true, duplicated: true });
    }

    const res = await query(`
      INSERT INTO system_notifications (sector, action_type, title, message, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [sector, action_type, title, message, link]);

    return NextResponse.json({ success: true, notification: res.rows ? res.rows[0] : null });
  } catch (err: any) {
    console.error("Notifications API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secretKey = searchParams.get('key');
    
    // منع الحذف إلا برمز سري محمي
    if (secretKey !== 'rtco_admin_purge_secured') {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بمسح سجل الإشعارات' }, { status: 403 });
    }

    await query(`DELETE FROM system_notifications`);
    return NextResponse.json({ success: true, message: 'تم تطهير سجل الإشعارات بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}