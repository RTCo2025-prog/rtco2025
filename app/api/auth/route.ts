import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS erp_users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'SITE_ENGINEER',
      avatar_url TEXT,
      session_token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // التأكد من وجود العمود في حال كان الجدول منشأ سابقاً
  await query(`
    ALTER TABLE erp_users ADD COLUMN IF NOT EXISTS session_token TEXT;
  `).catch(() => {});
}

// 1. جلب قائمة المستخدمين أو التحقق من الجلسة الحصرية
export async function GET(req: Request) {
  try {
    await initUsersTable();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // التحقق من صحة جلسة الجهاز الحالي
    if (action === 'VERIFY_SESSION') {
      const userId = searchParams.get('user_id');
      const token = searchParams.get('session_token');

      if (!userId || !token) {
        return NextResponse.json({ valid: false, error: 'بيانات الجلسة غير مكتملة' }, { status: 400 });
      }

      const res = await query(
        `SELECT session_token FROM erp_users WHERE user_id = $1`,
        [userId]
      );

      if (res.rows.length === 0 || res.rows[0].session_token !== token) {
        return NextResponse.json({ valid: false, message: 'تم فتح الحساب من جهاز آخر' }, { status: 401 });
      }

      return NextResponse.json({ valid: true });
    }

    const requesterRole = searchParams.get('requester_role');

    if (requesterRole !== 'ADMIN') {
      return NextResponse.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    }

    const res = await query(`
      SELECT user_id, full_name, username, role, avatar_url, created_at 
      FROM erp_users 
      ORDER BY created_at ASC
    `);

    return NextResponse.json({ success: true, users: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. تسجيل الدخول وإنشاء الحساب
export async function POST(req: Request) {
  try {
    await initUsersTable();
    const body = await req.json().catch(() => ({}));
    const { action, username, password, full_name, role, avatar_url, requester_role } = body;

    // تسجيل الدخول
    if (action === 'LOGIN') {
      if (!username || !password) {
        return NextResponse.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
      }

      const cleanUsername = String(username).trim().toLowerCase();

      const res = await query(`
        SELECT user_id, full_name, username, role, avatar_url, password 
        FROM erp_users 
        WHERE username = $1
      `, [cleanUsername]);

      if (res.rows.length === 0 || res.rows[0].password !== String(password)) {
        return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
      }

      // توليد رمز جلسة جديد حصري للجهاز الحالي
      const newSessionToken = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // تحديث الجلسة في قاعدة البيانات لإبطال الجلسات في الأجهزة السابقة
      await query(
        `UPDATE erp_users SET session_token = $1 WHERE user_id = $2`,
        [newSessionToken, res.rows[0].user_id]
      );

      const user = {
        user_id: res.rows[0].user_id,
        full_name: res.rows[0].full_name,
        username: res.rows[0].username,
        role: res.rows[0].role,
        avatar_url: res.rows[0].avatar_url,
        session_token: newSessionToken
      };

      const response = NextResponse.json({ success: true, user });

      // حفظ الرمز في الكوكيز
      response.cookies.set('erp_session_token', newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 أيام
      });

      return response;
    }

    // إنشاء حساب جديد بواسطة الإدارة
    if (action === 'REGISTER') {
      const userCountRes = await query(`SELECT count(*) FROM erp_users`);
      const totalUsers = Number(userCountRes.rows[0]?.count || 0);

      if (totalUsers > 0 && requester_role !== 'ADMIN') {
        return NextResponse.json({ error: 'مرفوض: إنشاء الحسابات مسموح فقط للإدارة العليا' }, { status: 403 });
      }

      if (!username || !password || !full_name) {
        return NextResponse.json({ error: 'يرجى ملء جميع الحقول الإلزامية' }, { status: 400 });
      }

      const cleanUsername = String(username).trim().toLowerCase();

      const existing = await query(`SELECT user_id FROM erp_users WHERE username = $1`, [cleanUsername]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 });
      }

      const finalRole = totalUsers === 0 ? 'ADMIN' : (role || 'SITE_ENGINEER');

      const res = await query(`
        INSERT INTO erp_users (full_name, username, password, role, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id, full_name, username, role, avatar_url
      `, [
        String(full_name).trim(),
        cleanUsername,
        String(password),
        finalRole,
        avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      ]);

      return NextResponse.json({ success: true, user: res.rows[0] });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. تعديل بيانات المستخدم أو كلمة المرور
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { user_id, full_name, role, avatar_url, password, requester_role } = body;

    if (requester_role !== 'ADMIN') {
      return NextResponse.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    if (password && String(password).trim() !== '') {
      await query(`
        UPDATE erp_users 
        SET full_name = $1, role = $2, avatar_url = $3, password = $4
        WHERE user_id = $5
      `, [String(full_name).trim(), role, avatar_url, String(password), user_id]);
    } else {
      await query(`
        UPDATE erp_users 
        SET full_name = $1, role = $2, avatar_url = $3
        WHERE user_id = $4
      `, [String(full_name).trim(), role, avatar_url, user_id]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. حذف مستخدم
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const requesterRole = searchParams.get('requester_role');

    if (requesterRole !== 'ADMIN') {
      return NextResponse.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    await query(`DELETE FROM erp_users WHERE user_id = $1`, [userId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}