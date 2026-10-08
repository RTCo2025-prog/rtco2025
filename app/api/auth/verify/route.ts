import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // قراءة مفتاح الجلسة المحمي
    const token = cookieStore.get('rtco_secure_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, valid: false }, { status: 401 });
    }

    // التحقق الصارم من وجود التوكن ومطابقته لحساب فعال
    const res = await query(`
      SELECT user_id, username, full_name, job_title, is_super_admin, status, assigned_branch_id, permissions 
      FROM system_users 
      WHERE session_token = $1 AND status = 'ACTIVE'
    `, [token]);
    
    if (res.rows && res.rows.length > 0) {
      const rawUser = res.rows[0];
      
      // الإصلاح: إعادة دمج رتبة الإدارة (role) كما في واجهة تسجيل الدخول
      // هذا يضمن عدم اختفاء أدوات الإدارة العليا (النسخ الاحتياطي، قفل الشهر) عند تحديث الصفحة
      const enhancedUser = {
        ...rawUser,
        role: rawUser.is_super_admin ? 'ADMIN' : rawUser.role || 'SITE_ENGINEER'
      };

      return NextResponse.json({ success: true, valid: true, user: enhancedUser });
    } else {
      // توكن مزيف أو منتهي الصلاحية
      return NextResponse.json({ success: false, valid: false }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, valid: false }, { status: 500 });
  }
}