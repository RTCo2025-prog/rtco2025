import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function logNotification(sector: string, action_type: string, title: string, message: string, link: string) {
  try {
    await query(`
      INSERT INTO system_notifications (sector, action_type, title, message, link)
      VALUES ($1, $2, $3, $4, $5)
    `, [sector, action_type, title, message, link]);
  } catch (e) {
    console.error("Log Notification Error:", e);
  }
}

// جلب قائمة السندات مع اسم المشروع وحساب المبالغ بمرونة
export async function GET() {
  try {
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS project_id UUID;`);
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;`);
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;`);

    const res = await query(`
      SELECT 
        v.voucher_id, 
        v.voucher_number, 
        v.voucher_type, 
        v.issue_date, 
        COALESCE(v.currency, 'IQD') as currency, 
        v.status, 
        v.notes, 
        v.project_id,
        COALESCE(b.name_ar, 'قطاع النقل العام واللوجستيات') as branch_name,
        COALESCE(p.project_name, cp.project_name) as project_name,
        CASE 
          WHEN COALESCE(SUM(jl.debit), 0) > 0 THEN SUM(jl.debit)
          WHEN COALESCE(v.total_amount, 0) > 0 THEN v.total_amount
          ELSE COALESCE(v.amount, 0)
        END as total_amount
      FROM vouchers v
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN projects p ON v.project_id = p.project_id
      LEFT JOIN contracting_projects cp ON v.project_id = cp.project_id
      LEFT JOIN journal_lines jl ON v.voucher_id = jl.voucher_id
      GROUP BY v.voucher_id, b.name_ar, p.project_name, cp.project_name, v.total_amount, v.amount
      ORDER BY v.created_at DESC
      LIMIT 200
    `);

    return NextResponse.json({ vouchers: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// إنشاء سند جديد وربطه بالمشروع أو قطاع النقل مع التحقق من إقفال الفترة
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch_id, project_id, voucher_type, amount, currency, notes } = body;

    // فحص ما إذا كان شهر الإصدار مقفلاً
    const issueMonth = new Date().toISOString().slice(0, 7);
    const lockCheck = await query(
      `SELECT * FROM closed_financial_periods WHERE period_month = $1`,
      [issueMonth]
    ).catch(() => ({ rows: [] }));

    if (lockCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `الفترة المالية لشهر (${issueMonth}) مقفلة رقابياً ولا يمكن إضافة سندات جديدة بها.` },
        { status: 403 }
      );
    }

    const vNum = `VCH-${Date.now().toString().slice(-6)}`;

    let userId = null;
    try {
      const userRes = await query('SELECT user_id FROM users LIMIT 1');
      userId = userRes.rows[0]?.user_id || null;
    } catch {}

    let cashAccId = null;
    let revAccId = null;
    try {
      const cashAccRes = await query("SELECT account_id FROM chart_of_accounts WHERE account_code = '111001' LIMIT 1");
      const revAccRes = await query("SELECT account_id FROM chart_of_accounts WHERE account_code = '410001' LIMIT 1");
      cashAccId = cashAccRes.rows[0]?.account_id || null;
      revAccId = revAccRes.rows[0]?.account_id || null;
    } catch {}

    const numAmount = parseFloat(amount) || 0;

    const vRes = await query(`
      INSERT INTO vouchers (
        branch_id, 
        project_id, 
        voucher_number, 
        voucher_type, 
        amount,
        total_amount,
        issue_date, 
        currency, 
        status, 
        notes, 
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $5, CURRENT_DATE, $6, 'POSTED', $7, $8)
      RETURNING voucher_id
    `, [
      branch_id || null, 
      project_id ? project_id : null, 
      vNum, 
      voucher_type, 
      numAmount, 
      currency || 'IQD', 
      notes, 
      userId
    ]);

    const voucherId = vRes.rows[0].voucher_id;

    if (cashAccId && revAccId) {
      if (voucher_type === 'RECEIPT') {
        await query(`
          INSERT INTO journal_lines (voucher_id, account_id, debit, credit, line_order, description)
          VALUES 
            ($1, $2, $3, 0, 1, 'قبض نقدية'),
            ($1, $4, 0, $3, 2, 'إيراد / دفعة مستلمة')
        `, [voucherId, cashAccId, numAmount, revAccId]);
      } else {
        await query(`
          INSERT INTO journal_lines (voucher_id, account_id, debit, credit, line_order, description)
          VALUES 
            ($1, $4, $3, 0, 1, 'صرف مستحقات ومواد مشروع'),
            ($1, $2, 0, $3, 2, 'صرف نقدية من الصندوق')
        `, [voucherId, cashAccId, numAmount, revAccId]);
      }
    }

    // استخراج اسم الطرف والبيان للإشعار
    let partyTitle = 'غير محدد';
    let reasonTitle = '';
    try {
      const parsedNotes = JSON.parse(notes || '{}');
      if (parsedNotes.partyAr) partyTitle = parsedNotes.partyAr;
      if (parsedNotes.forReasonAr) reasonTitle = ` - البيان: ${parsedNotes.forReasonAr}`;
    } catch {
      if (notes) reasonTitle = ` - ${notes}`;
    }

    const typeTitle = voucher_type === 'RECEIPT' ? 'وصل قبض مالي' : 'سند صرف مالي';

    // تسجيل إشعار فوري للحركة المالية
    await logNotification(
      'FINANCE',
      'ADD',
      `${typeTitle}: ${vNum}`,
      `تم قيد ${typeTitle} بمبلغ ${numAmount.toLocaleString('en-US')} ${currency || 'IQD'} لصالح (${partyTitle})${reasonTitle}`,
      '/vouchers'
    );

    return NextResponse.json({ success: true, voucher_number: vNum });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// تعديل ربط السند بمشروع أو إلغاء السند (VOID) مع التحقق من إقفال الفترة
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { voucher_id, cancel_reason, assign_project_id } = body;

    if (!voucher_id) {
      return NextResponse.json({ error: 'معرّف السند مطلوب' }, { status: 400 });
    }

    // فحص قفل الفترة المالية عند طلب الإلغاء
    if (cancel_reason) {
      const vDateRes = await query('SELECT issue_date FROM vouchers WHERE voucher_id = $1', [voucher_id]);
      const vMonth = String(vDateRes.rows[0]?.issue_date || '').slice(0, 7);
      const lockCheck = await query(
        `SELECT * FROM closed_financial_periods WHERE period_month = $1`,
        [vMonth]
      ).catch(() => ({ rows: [] }));

      if (lockCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `لا يمكن إلغاء السند لأنه ينتمي لفترة مالية مقفلة (${vMonth}).` },
          { status: 403 }
        );
      }
    }

    if (assign_project_id !== undefined) {
      await query(
        `UPDATE vouchers SET project_id = $1 WHERE voucher_id = $2`,
        [assign_project_id || null, voucher_id]
      );

      const vInfo = await query(`SELECT voucher_number FROM vouchers WHERE voucher_id = $1`, [voucher_id]);
      const vNum = vInfo.rows[0]?.voucher_number || 'سند';

      let pName = 'فك الارتباط';
      if (assign_project_id) {
        const pInfo = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(assign_project_id)]);
        pName = pInfo.rows[0]?.project_name || 'مشروع';
      }

      await logNotification(
        'FINANCE',
        'UPDATE',
        `ربط سند بمشروع: ${vNum}`,
        `تم تحديث ربط السند رقم (${vNum}) بحساب (${pName})`,
        '/vouchers'
      );

      return NextResponse.json({ success: true, message: 'تم تحديث ربط المشروع بنجاح' });
    }

    const checkRes = await query('SELECT * FROM vouchers WHERE voucher_id = $1', [voucher_id]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'السند غير موجود' }, { status: 404 });
    }

    const currentVoucher = checkRes.rows[0];
    if (currentVoucher.status === 'VOID' || currentVoucher.status === 'CANCELLED') {
      return NextResponse.json({ error: 'السند ملغي بالفعل مسبقاً' }, { status: 400 });
    }

    let notesData: any = {};
    try {
      notesData = JSON.parse(currentVoucher.notes || '{}');
    } catch {
      notesData = { forReasonAr: currentVoucher.notes || '' };
    }
    notesData.isCancelled = true;
    notesData.cancelReason = cancel_reason || 'تم الإلغاء رقابياً';

    await query(
      `UPDATE vouchers 
       SET status = 'VOID', notes = $1 
       WHERE voucher_id = $2`,
      [JSON.stringify(notesData), voucher_id]
    );

    try {
      await query(
        `UPDATE journal_lines 
         SET description = description || ' (ملغي)' 
         WHERE voucher_id = $1`,
        [voucher_id]
      );
    } catch {}

    const vNum = currentVoucher.voucher_number || 'سند';
    const vAmt = Number(currentVoucher.total_amount || currentVoucher.amount || 0);

    // تسجيل إشعار فوري بالإلغاء
    await logNotification(
      'FINANCE',
      'DELETE',
      `إلغاء سند مالي: ${vNum}`,
      `تم إلغاء السند المالي رقم (${vNum}) بمبلغ ${vAmt.toLocaleString('en-US')} د.ع - السبب: ${cancel_reason || 'إلغاء وتصفير القيد'}`,
      '/vouchers'
    );

    return NextResponse.json({ 
      success: true, 
      message: 'تم إلغاء السند واعتماده كـ VOID بنجاح' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}