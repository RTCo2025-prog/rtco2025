import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branch_id'); // إما معرف الفرع أو 'ALL'

    const isSpecificBranch = branchId && branchId !== 'ALL' && branchId.trim() !== '';

    // 1. حساب المقبوضات والمصروفات من جدول السندات vouchers
    let voucherSql = `
      SELECT 
        COALESCE(branch_id, 'BR-HQ-01') as branch_id,
        voucher_type,
        to_char(issue_date, 'YYYY-MM') as month,
        SUM(COALESCE(total_amount, amount, 0)) as total
      FROM vouchers
      WHERE status != 'VOID'
    `;
    const vParams: any[] = [];
    if (isSpecificBranch) {
      voucherSql += ` AND TRIM(branch_id::text) = TRIM($1)`;
      vParams.push(String(branchId));
    }
    voucherSql += ` GROUP BY branch_id, voucher_type, to_char(issue_date, 'YYYY-MM') ORDER BY month ASC`;

    // 2. حساب كتلة الرواتب المصروفة من جدول hr_payroll_runs
    let payrollSql = `
      SELECT 
        COALESCE(e.branch_id, 'BR-HQ-01') as branch_id,
        p.payroll_month as month,
        SUM(COALESCE(p.net_salary, 0)) as total
      FROM hr_payroll_runs p
      LEFT JOIN hr_employees e ON TRIM(p.employee_id::text) = TRIM(e.employee_id::text)
      WHERE p.status = 'PAID'
    `;
    const pParams: any[] = [];
    if (isSpecificBranch) {
      payrollSql += ` AND TRIM(e.branch_id::text) = TRIM($1)`;
      pParams.push(String(branchId));
    }
    payrollSql += ` GROUP BY e.branch_id, p.payroll_month ORDER BY month ASC`;

    const [vRes, pRes] = await Promise.all([
      query(voucherSql, vParams).catch(() => ({ rows: [] })),
      query(payrollSql, pParams).catch(() => ({ rows: [] }))
    ]);

    let totalReceipts = 0;
    let totalExpenses = 0;
    let totalPayroll = 0;

    // تجميع الشهور لبناء المخطط الخطي الزمني
    const monthlyMap: Record<string, { month: string; receipts: number; expenses: number; payroll: number; net: number }> = {};

    vRes.rows.forEach((r: any) => {
      const val = Number(r.total) || 0;
      const m = r.month || '2025-01';
      if (!monthlyMap[m]) {
        monthlyMap[m] = { month: m, receipts: 0, expenses: 0, payroll: 0, net: 0 };
      }
      if (r.voucher_type === 'RECEIPT') {
        totalReceipts += val;
        monthlyMap[m].receipts += val;
      } else if (r.voucher_type === 'PAYMENT') {
        totalExpenses += val;
        monthlyMap[m].expenses += val;
      }
    });

    pRes.rows.forEach((r: any) => {
      const val = Number(r.total) || 0;
      const m = r.month || '2025-01';
      totalPayroll += val;
      if (!monthlyMap[m]) {
        monthlyMap[m] = { month: m, receipts: 0, expenses: 0, payroll: 0, net: 0 };
      }
      monthlyMap[m].payroll += val;
    });

    // احتساب صافي السيولة التراكمية والشهرية
    const timeline = Object.keys(monthlyMap)
      .sort()
      .map((k) => {
        const item = monthlyMap[k];
        item.net = item.receipts - (item.expenses + item.payroll);
        return item;
      });

    const netLiquidity = totalReceipts - (totalExpenses + totalPayroll);

    return NextResponse.json({
      success: true,
      summary: {
        totalReceipts,
        totalExpenses,
        totalPayroll,
        netLiquidity
      },
      timeline
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}