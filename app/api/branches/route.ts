import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initBranchesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS branches (
      branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      branch_code VARCHAR(50) UNIQUE NOT NULL,
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

  // بذر الفروع الأساسية للشركة إن كان الجدول فارغاً
  const countRes = await query(`SELECT count(*) FROM branches`);
  if (Number(countRes.rows[0]?.count || 0) === 0) {
    await query(`
      INSERT INTO branches (branch_code, name_ar, branch_type, manager_name, phone, city, address)
      VALUES 
        ('HQ-01', 'الإدارة العامة - شركة البرج المتألق', 'الإدارة المركزية والمقر العام', 'الإدارة العليا', '07868006699', 'النجف الأشرف', 'حي الفرات'),
        ('CNT-01', 'فرع المقاولات العامة والإنشاءات', 'تنفيذ المشاريع الإنشائية والهندسية', 'المهندس المقيم', '07800000001', 'النجف الأشرف', 'المدينة القديمة'),
        ('TRD-01', 'فرع التجارة العامة والتجهيزات', 'استيراد وتوريد المواد الأولية', 'مدير المشتريات', '07800000002', 'النجف الأشرف', 'حي الحرفيين'),
        ('FLT-01', 'فرع النقل العام واللوجستيات', 'حركة الأسطول والنقل البري', 'كابتن الأسطول', '07800000003', 'النجف الأشرف', 'ساحة الآليات المركزية'),
        ('EST-01', 'فرع التطوير والاستثمار العقاري', 'إدارة العقارات والوحدات السكنية', 'مسؤول الاستثمار', '07800000004', 'النجف الأشرف', 'شارع الكوفة');
    `);
  }
}

export async function GET() {
  try {
    await initBranchesTable();
    const res = await query(`
      SELECT 
        branch_id,
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
      ORDER BY branch_code ASC
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
    const { branch_code, name_ar, branch_type, manager_name, phone, city, address } = body;

    const cleanCode = String(branch_code || '').trim().toUpperCase();

    const exist = await query(`SELECT branch_id FROM branches WHERE branch_code = $1`, [cleanCode]);
    if (exist.rows.length > 0) {
      return NextResponse.json({ error: `رمز الفرع (${cleanCode}) مسجل مسبقاً` }, { status: 400 });
    }

    const res = await query(`
      INSERT INTO branches (branch_code, name_ar, branch_type, manager_name, phone, city, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
      RETURNING *
    `, [
      cleanCode,
      String(name_ar).trim(),
      String(branch_type || 'قطاع تجاري').trim(),
      manager_name || 'غير محدد',
      phone || '---',
      city || 'النجف الأشرف',
      address || 'المركز الرئيسي'
    ]);

    return NextResponse.json({ success: true, branch: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { branch_id, name_ar, branch_type, manager_name, phone, city, address, status } = body;

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
          status = COALESCE($7, status)
      WHERE branch_id = $8
    `, [name_ar, branch_type, manager_name, phone, city, address, status, branch_id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('id');

    if (!branchId) {
      return NextResponse.json({ error: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    await query(`DELETE FROM branches WHERE branch_id = $1`, [branchId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}