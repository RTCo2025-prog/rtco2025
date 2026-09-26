import { NextResponse } from 'next/server';
import { switchDatabase, query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { new_database_url } = await req.json();

    if (!new_database_url || !new_database_url.startsWith('postgres')) {
      return NextResponse.json({ 
        success: false, 
        error: 'يرجى إدخال رابط اتصال صالح يبدأ بـ postgresql://' 
      }, { status: 400 });
    }

    // تنفيذ التبديل وفحص الاتصال
    await switchDatabase(new_database_url.trim());

    // تهيئة جدول الإعدادات في القاعدة الجديدة لحفظ الرابط
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
      `, [new_database_url.trim()]);
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