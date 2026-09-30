import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initNotificationsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        notification_id VARCHAR(50) PRIMARY KEY DEFAULT CONCAT('NOTIF-', FLOOR(RANDOM() * 1000000)),
        sector VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) DEFAULT 'ADD',
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
      SELECT 
        notification_id, 
        sector, 
        action_type, 
        title, 
        message, 
        link, 
        is_read, 
        created_at 
      FROM system_notifications 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    return NextResponse.json({ success: true, notifications: res.rows || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initNotificationsTable();
    const body = await req.json();
    const { action, action_type, sector, title, message, link } = body;

    // دعم كافة أشكال طلبات إرسال الإشعارات القادمة من الـ APIs أو الواجهات
    if (action === 'ADD_NOTIFICATION' || title || message) {
      const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await query(`
        INSERT INTO system_notifications (
          notification_id, sector, action_type, title, message, link, is_read, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, FALSE, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        notifId,
        sector || 'GENERAL',
        action_type || body.action_type || 'ADD',
        title || 'تنبيه نظام',
        message || '',
        link || '/'
      ]);

      return NextResponse.json({ success: true, notification: res.rows[0] });
    }

    if (action === 'MARK_AS_READ') {
      await query(`UPDATE system_notifications SET is_read = TRUE WHERE is_read = FALSE`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (err: any) {
    console.error("Save Notification Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}