import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { switchDatabase, query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // 1. التحقق من أمان وحماية الطلب (صلاحيات المسؤول)
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || req.headers.get('x-user-role');
    
    // يرجى تعديل الشرط إذا كانت تسمية الدور لديك مختلفة مثل 'admin' أو 'SUPER_ADMIN'
    if (!userRole || (userRole !== 'admin' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ 
        success: false, 
        error: 'غير مصرح لك ببدء هذه العملية. هذه الصلاحية للمسؤولين فقط.' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { new_database_url } = body;

    // 2. التحقق من صيغة رابط قاعدة البيانات
    if (
      !new_database_url || 
      typeof new_database_url !== 'string' ||
      (!new_database_url.trim().startsWith('postgres://') && !new_database_url.trim().startsWith('postgresql://'))
    ) {
      return NextResponse.json({ 
        success: false, 
        error: 'يرجى إدخال رابط اتصال صالح يبدأ بـ postgresql:// أو postgres://' 
      }, { status: 400 });
    }

    const sanitizedUrl = new_database_url.trim();

    // 3. تنفيذ التبديل وفحص الاتصال بالقاعدة الجديدة
    await switchDatabase(sanitizedUrl);

    // 4. تهيئة جدول الإعدادات في القاعدة الجديدة لحفظ الرابط
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS company_settings (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255) DEFAULT 'شركة البرج المتألق',
          tagline VARCHAR(255) DEFAULT 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
          phone_primary VARCHAR(50) DEFAULT '',
          phone_secondary VARCHAR(50) DEFAULT '',
          email VARCHAR(100) DEFAULT '',
          website VARCHAR(100) DEFAULT '',
          address VARCHAR(255) DEFAULT 'العراق - النجف الأشرف - حي الفرات',
          logo_url TEXT DEFAULT '',
          letterhead_url TEXT DEFAULT '',
          primary_color VARCHAR(30) DEFAULT '#d97706',
          secondary_color VARCHAR(30) DEFAULT '#ea580c',
          database_url TEXT DEFAULT '',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        INSERT INTO company_settings (id, database_url)
        VALUES (1, $1)
        ON CONFLICT (id) DO UPDATE SET database_url = $1, updated_at = CURRENT_TIMESTAMP
      `, [sanitizedUrl]);
    } catch (e) {
      console.error('Note: could not update company_settings in new db, but connection switched:', e);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم الاتصال بقاعدة البيانات الجديدة وتفعيلها بنجاح!' 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'فشل الاتصال بقاعدة البيانات الجديدة: ' + (err.message || 'تأكد من صحة الرابط وسماحية الاتصال الخارجي') 
    }, { status: 500 });
  }
}