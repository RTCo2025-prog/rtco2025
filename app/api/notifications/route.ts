import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initNotificationsTable() {
  try {
    // 1. جدول الإشعارات المركزي العام
    await query(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        notification_id VARCHAR(50) PRIMARY KEY,
        sector VARCHAR(50) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(255),
        branch_id VARCHAR(50) DEFAULT 'ALL',
        created_by_user VARCHAR(100) DEFAULT 'SYSTEM',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`ALTER TABLE system_notifications ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'ALL';`).catch(() => {});
    await query(`ALTER TABLE system_notifications ADD COLUMN IF NOT EXISTS created_by_user VARCHAR(100) DEFAULT 'SYSTEM';`).catch(() => {});

    // 2. جدول حالات المستخدمين (القراءة والحذف المنفصل لكل موظف)
    await query(`
      CREATE TABLE IF NOT EXISTS user_notification_states (
        user_id VARCHAR(100) NOT NULL,
        notification_id VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        PRIMARY KEY (user_id, notification_id)
      );
    `);
  } catch (err) {
    console.error("Init Notifications Table Error:", err);
  }
}

export async function GET(req: Request) {
  try {
    await initNotificationsTable();

    const { searchParams } = new URL(req.url);
    const username = (searchParams.get('username') || '').trim().toLowerCase();
    const branchId = (searchParams.get('branch_id') || 'ALL').trim();
    const role = (searchParams.get('role') || '').trim().toUpperCase();

    const isSuperAdmin = username === 'admin' || username === 'pro' || role === 'ADMIN' || role.includes('SUPER');

    let sql = '';
    const params: any[] = [];

    if (isSuperAdmin) {
      // الأدمن و pro يشاهدون كافة الإشعارات دون استثناء، وحالة القراءة/الحذف خاصة بهم كأدمن
      sql = `
        SELECT 
          n.notification_id,
          n.notification_id AS id,
          n.sector, 
          n.action_type, 
          n.title, 
          n.message, 
          n.link, 
          n.branch_id,
          n.created_by_user,
          COALESCE(s.is_read, FALSE) AS is_read, 
          to_char(n.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
        FROM system_notifications n
        LEFT JOIN user_notification_states s 
          ON n.notification_id = s.notification_id AND s.user_id = $1
        WHERE COALESCE(s.is_deleted, FALSE) = FALSE
        ORDER BY n.created_at DESC 
        LIMIT 200
      `;
      params.push(username || 'admin');
    } else {
      // الموظف العادي: يرى إشعارات فرعه أو العمليات العامة أو التي أُنشئت بواسطته، ومستبعد منها ما قام بحذفه
      sql = `
        SELECT 
          n.notification_id,
          n.notification_id AS id,
          n.sector, 
          n.action_type, 
          n.title, 
          n.message, 
          n.link, 
          n.branch_id,
          n.created_by_user,
          COALESCE(s.is_read, FALSE) AS is_read, 
          to_char(n.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
        FROM system_notifications n
        LEFT JOIN user_notification_states s 
          ON n.notification_id = s.notification_id AND s.user_id = $1
        WHERE COALESCE(s.is_deleted, FALSE) = FALSE
          AND (
            n.created_by_user = $1
            OR n.branch_id = 'ALL'
            OR n.branch_id = $2
            OR $2 = 'ALL'
          )
        ORDER BY n.created_at DESC 
        LIMIT 100
      `;
      params.push(username, branchId);
    }

    const res = await query(sql, params);

    return NextResponse.json({
      success: true,
      notifications: res.rows || []
    });
  } catch (error: any) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ success: true, notifications: [] });
  }
}

export async function POST(req: Request) {
  try {
    await initNotificationsTable();
    const body = await req.json().catch(() => ({}));

    const username = String(body.username || 'SYSTEM').trim().toLowerCase();

    // 1. تسجيل إشعار جديد في النظام
    if (body.title && !body.action?.includes('READ')) {
      const { notification_id, id, sector, action_type, title, message, link, branch_id, created_by_user } = body;
      const notifId = String(notification_id || id || `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

      const res = await query(`
        INSERT INTO system_notifications (
          notification_id, sector, action_type, title, message, link, branch_id, created_by_user
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        notifId,
        sector || 'GENERAL',
        action_type || 'INFO',
        title,
        message || '',
        link || '/',
        branch_id || 'ALL',
        created_by_user || username || 'SYSTEM'
      ]);

      return NextResponse.json({ success: true, notification: res.rows[0] });
    }

    // 2. تعليم الكل كمقروء لمستخدم معين دون التأثير على البقية
    if (body.action === 'MARK_AS_READ' || body.mark_all_read) {
      if (!username) {
        return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 });
      }

      await query(`
        INSERT INTO user_notification_states (user_id, notification_id, is_read, read_at)
        SELECT $1, notification_id, TRUE, CURRENT_TIMESTAMP 
        FROM system_notifications
        ON CONFLICT (user_id, notification_id)
        DO UPDATE SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      `, [username]);

      return NextResponse.json({ success: true, message: 'تم تعليم الكل كمقروء لحسابك' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Notification Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await initNotificationsTable();
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || 'SYSTEM').trim().toLowerCase();
    const targetNotifId = String(body.notification_id || body.id || '');

    if (!targetNotifId || !username) {
      return NextResponse.json({ error: 'المعرف والمستخدم مطلوبان' }, { status: 400 });
    }

    // تحديث حالة قراءة هذا الإشعار للمستخدم فقط
    await query(`
      INSERT INTO user_notification_states (user_id, notification_id, is_read, read_at)
      VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, notification_id)
      DO UPDATE SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    `, [username, targetNotifId]);

    return NextResponse.json({ success: true, message: 'تم تعليم الإشعار كمقروء' });
  } catch (error: any) {
    console.error("PATCH Notification Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initNotificationsTable();
    const { searchParams } = new URL(req.url);
    const notifId = searchParams.get('id') || searchParams.get('notification_id');
    const username = (searchParams.get('username') || '').trim().toLowerCase();

    const isGlobalAdmin = username === 'admin' || username === 'pro';

    // إذا كان الموظف عادياً: نحذف الإشعار من عرضه فقط (Soft Delete) عبر جدول الحالات
    // ويبقى الإشعار موجوداً كاملاً للأدمن و pro
    if (!isGlobalAdmin) {
      if (notifId) {
        await query(`
          INSERT INTO user_notification_states (user_id, notification_id, is_deleted)
          VALUES ($1, $2, TRUE)
          ON CONFLICT (user_id, notification_id)
          DO UPDATE SET is_deleted = TRUE
        `, [username, String(notifId)]);
      } else {
        // حذف الكل بالنسبة للموظف فقط
        await query(`
          INSERT INTO user_notification_states (user_id, notification_id, is_deleted)
          SELECT $1, notification_id, TRUE FROM system_notifications
          ON CONFLICT (user_id, notification_id)
          DO UPDATE SET is_deleted = TRUE
        `, [username]);
      }
      return NextResponse.json({ success: true, message: 'تم حذف الإشعار من حسابك فقط' });
    }

    // إذا كان الحذف من الأدمن أو pro:
    if (notifId) {
      await query(`
        INSERT INTO user_notification_states (user_id, notification_id, is_deleted)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (user_id, notification_id)
        DO UPDATE SET is_deleted = TRUE
      `, [username, String(notifId)]);
      return NextResponse.json({ success: true, message: 'تم إخفاء الإشعار من لوحتك' });
    }

    // مسح السجل للأدمن أيضاً يخفيه من حسابه الخاص
    await query(`
      INSERT INTO user_notification_states (user_id, notification_id, is_deleted)
      SELECT $1, notification_id, TRUE FROM system_notifications
      ON CONFLICT (user_id, notification_id)
      DO UPDATE SET is_deleted = TRUE
    `, [username]);

    return NextResponse.json({ success: true, message: 'تم تفريغ السجل' });
  } catch (error: any) {
    console.error("DELETE Notification Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}