import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function logNotification(sector: string, action_type: string, title: string, message: string, link: string) {
  try {
    const notifId = `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await query(`
      INSERT INTO system_notifications (notification_id, sector, action_type, title, message, link, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
    `, [notifId, sector, action_type, title, message, link]);
  } catch (e) {
    try {
      await query(`
        INSERT INTO system_notifications (sector, action_type, title, message, link)
        VALUES ($1, $2, $3, $4, $5)
      `, [sector, action_type, title, message, link]);
    } catch (err2) {
      console.error("Log Notification Error:", err2);
    }
  }
}

async function initBranchesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS branches (
      branch_id VARCHAR(50) PRIMARY KEY,
      branch_code VARCHAR(50),
      name_ar VARCHAR(255) NOT NULL,
      branch_type VARCHAR(100) NOT NULL,
      manager_name VARCHAR(150),
      phone VARCHAR(50),
      city VARCHAR(100) DEFAULT 'النجف الأشرف',
      address VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_type VARCHAR(100);
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager_name VARCHAR(150);
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'النجف الأشرف';
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS address VARCHAR(255);
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  // إزالة قيد NOT NULL عن branch_code لضمان عدم حدوث تعارض أثناء الحفظ
  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'branches' AND column_name = 'branch_code'
      ) THEN
        ALTER TABLE branches ALTER COLUMN branch_code DROP NOT NULL;
      END IF;
    END $$;
  `).catch(() => {});
}

export async function GET() {
  try {
    await initBranchesTable();
    const res = await query(`
      SELECT 
        branch_id::text AS branch_id,
        COALESCE(branch_code, 'BR-01') AS branch_code,
        name_ar,
        COALESCE(branch_type, 'قطاع تجاري') AS branch_type,
        COALESCE(manager_name, 'غير محدد') AS manager_name,
        COALESCE(phone, '---') AS phone,
        COALESCE(city, 'النجف الأشرف') AS city,
        COALESCE(address, 'المركز الرئيسي') AS address,
        COALESCE(status, 'ACTIVE') AS status,
        created_at
      FROM branches 
      ORDER BY created_at ASC
    `);

    return NextResponse.json({ success: true, branches: res.rows || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initBranchesTable();
    const body = await req.json();
    const { branch_id, id, branch_code, name_ar, branch_type, manager_name, phone, city, address } = body;

    const cleanCode = String(branch_code || 'BR-01').trim().toUpperCase();
    const finalBranchId = String(branch_id || id || `BR-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

    const res = await query(`
      INSERT INTO branches (branch_id, branch_code, name_ar, branch_type, manager_name, phone, city, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
      ON CONFLICT (branch_id) DO UPDATE SET
        branch_code = EXCLUDED.branch_code,
        name_ar = EXCLUDED.name_ar,
        branch_type = EXCLUDED.branch_type,
        manager_name = EXCLUDED.manager_name,
        phone = EXCLUDED.phone,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        status = EXCLUDED.status
      RETURNING *
    `, [
      finalBranchId,
      cleanCode,
      String(name_ar).trim(),
      String(branch_type || 'قطاع تجاري').trim(),
      manager_name || 'غير محدد',
      phone || '---',
      city || 'النجف الأشرف',
      address || 'المركز الرئيسي'
    ]);

    await logNotification(
      'BRANCHES',
      'ADD',
      `افتتاح فرع جديد: ${name_ar}`,
      `تم تسجيل فرع جديد (${name_ar}) برمز (${cleanCode}) في مدينة (${city || 'النجف الأشرف'}) بإدارة (${manager_name || 'غير محدد'})`,
      '/branches'
    );

    return NextResponse.json({ success: true, branch: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { branch_id, branch_code, name_ar, branch_type, manager_name, phone, city, address, status } = body;

    if (!branch_id) {
      return NextResponse.json({ error: 'معرف الفرع مفقود' }, { status: 400 });
    }

    await query(`
      UPDATE branches
      SET name_ar = COALESCE($1, name_ar),
          branch_type = COALESCE($2, branch_type),
          manager_name = COALESCE($3, manager_name),
          phone = COALESCE($4, phone),
          city = COALESCE($5, city),
          address = COALESCE($6, address),
          status = COALESCE($7, status),
          branch_code = COALESCE($8, branch_code)
      WHERE branch_id::text = $9::text
    `, [name_ar, branch_type, manager_name, phone, city, address, status, branch_code, String(branch_id)]);

    const branchInfo = await query(`SELECT name_ar, branch_code FROM branches WHERE branch_id::text = $1::text`, [String(branch_id)]);
    const bName = branchInfo.rows[0]?.name_ar || name_ar || 'فرع الشركة';

    await logNotification(
      'BRANCHES',
      'UPDATE',
      `تحديث بيانات فرع: ${bName}`,
      `تم تحديث بيانات الفرع (${bName}) وحالته التشغيلية إلى (${status || 'نشط'})`,
      '/branches'
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('id') || searchParams.get('branch_id');

    if (!branchId) {
      return NextResponse.json({ error: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    const branchInfo = await query(`SELECT name_ar, branch_code FROM branches WHERE branch_id::text = $1::text`, [String(branchId)]);
    const bName = branchInfo.rows[0]?.name_ar || 'فرع';

    await query(`DELETE FROM branches WHERE branch_id::text = $1::text`, [String(branchId)]);

    await logNotification(
      'BRANCHES',
      'DELETE',
      `إلغاء فرع: ${bName}`,
      `تم حذف الفرع (${bName}) من السجل الإداري للفروع المعتمدة`,
      '/branches'
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}