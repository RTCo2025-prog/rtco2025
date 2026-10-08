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

// خريطة مسميات الفروع المعتمدة الحصرية
const BRANCH_NAMES_MAP: Record<string, string> = {
  'BR-HQ-01': 'المقر الرئيسي (النجف الأشرف)',
  'BR-CONST-02': 'فرع المقاولات والمشاريع الهندسية',
  'BR-TRADE-03': 'فرع التجارة العامة والمخازن',
  'BR-TRANS-04': 'فرع النقل العام واللوجستيات',
  'BR-RE-05': 'فرع الاستثمارات والتطوير العقاري',
  'ALL': 'كافة الفروع (عرض المنظومة الموحدة)'
};

async function initHRTables() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // التأكد من وجود هيكل جدول الفروع فقط دون زرع أي بيانات قسرية
    await query(`
      CREATE TABLE IF NOT EXISTS branches (
        branch_id VARCHAR(50) PRIMARY KEY,
        branch_code VARCHAR(50),
        name_ar VARCHAR(255) NOT NULL,
        branch_type VARCHAR(100),
        manager_name VARCHAR(150),
        phone VARCHAR(50),
        city VARCHAR(100) DEFAULT 'النجف الأشرف',
        address VARCHAR(255),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await query(`ALTER TABLE branches ALTER COLUMN branch_code DROP NOT NULL;`).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        employee_id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) DEFAULT 'BR-HQ-01',
        emp_code VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        job_title VARCHAR(150) NOT NULL,
        department VARCHAR(100) NOT NULL,
        base_salary NUMERIC NOT NULL DEFAULT 0,
        allowances NUMERIC DEFAULT 0,
        phone VARCHAR(50),
        national_id VARCHAR(50),
        avatar_url TEXT,
        annual_leave_balance NUMERIC DEFAULT 21,
        hire_date DATE DEFAULT CURRENT_DATE,
        contract_end_date DATE,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        bank_account VARCHAR(100),
        notes TEXT,
        cv_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ-01';`).catch(() => {});

    await query(`
      DO $$
      BEGIN
        ALTER TABLE hr_adjustments DROP CONSTRAINT IF EXISTS hr_adjustments_employee_id_fkey;
        ALTER TABLE hr_leaves DROP CONSTRAINT IF EXISTS hr_leaves_employee_id_fkey;
        ALTER TABLE hr_payroll_runs DROP CONSTRAINT IF EXISTS hr_payroll_runs_employee_id_fkey;
        ALTER TABLE hr_penalties_appraisals DROP CONSTRAINT IF EXISTS hr_penalties_appraisals_employee_id_fkey;

        ALTER TABLE hr_employees ALTER COLUMN employee_id TYPE VARCHAR(50) USING employee_id::varchar;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS hr_adjustments (
        adj_id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        adj_type VARCHAR(50) NOT NULL,
        amount NUMERIC NOT NULL DEFAULT 0,
        hours_count NUMERIC DEFAULT 0,
        installments_count INT DEFAULT 1,
        monthly_installment NUMERIC DEFAULT 0,
        reason TEXT,
        effective_month VARCHAR(20),
        is_settled BOOLEAN DEFAULT FALSE,
        leave_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      DO $$
      BEGIN
        ALTER TABLE hr_adjustments ALTER COLUMN employee_id TYPE VARCHAR(50) USING employee_id::varchar;
        ALTER TABLE hr_adjustments ALTER COLUMN adj_id TYPE VARCHAR(50) USING adj_id::varchar;
        ALTER TABLE hr_adjustments ALTER COLUMN leave_id TYPE VARCHAR(50) USING leave_id::varchar;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `).catch(() => {});

    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE;`).catch(() => {});
    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS leave_id VARCHAR(50);`).catch(() => {});
    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS installments_count INT DEFAULT 1;`).catch(() => {});
    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS monthly_installment NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;`).catch(() => {});
    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS contract_end_date DATE;`).catch(() => {});
    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS cv_data JSONB DEFAULT '{}';`).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS hr_leaves (
        leave_id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        leave_type VARCHAR(50) NOT NULL,
        days_count NUMERIC NOT NULL DEFAULT 1,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'APPROVED',
        is_deducted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      DO $$
      BEGIN
        ALTER TABLE hr_leaves ALTER COLUMN employee_id TYPE VARCHAR(50) USING employee_id::varchar;
        ALTER TABLE hr_leaves ALTER COLUMN leave_id TYPE VARCHAR(50) USING leave_id::varchar;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `).catch(() => {});

    await query(`ALTER TABLE hr_leaves ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';`).catch(() => {});
    await query(`ALTER TABLE hr_leaves ADD COLUMN IF NOT EXISTS is_deducted BOOLEAN DEFAULT FALSE;`).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS hr_payroll_runs (
        run_id VARCHAR(50) PRIMARY KEY,
        payroll_month VARCHAR(20) NOT NULL,
        employee_id VARCHAR(50) NOT NULL,
        base_salary NUMERIC NOT NULL DEFAULT 0,
        allowances NUMERIC DEFAULT 0,
        bonuses NUMERIC DEFAULT 0,
        overtime_amount NUMERIC DEFAULT 0,
        loans_deducted NUMERIC DEFAULT 0,
        penalties NUMERIC DEFAULT 0,
        deduction_reasons TEXT,
        net_salary NUMERIC NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PAID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      DO $$
      BEGIN
        ALTER TABLE hr_payroll_runs ALTER COLUMN employee_id TYPE VARCHAR(50) USING employee_id::varchar;
        ALTER TABLE hr_payroll_runs ALTER COLUMN run_id TYPE VARCHAR(50) USING run_id::varchar;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS hr_penalties_appraisals (
        record_id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        rating_score INT DEFAULT 5,
        record_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      DO $$
      BEGIN
        ALTER TABLE hr_penalties_appraisals ALTER COLUMN employee_id TYPE VARCHAR(50) USING employee_id::varchar;
        ALTER TABLE hr_penalties_appraisals ALTER COLUMN record_id TYPE VARCHAR(50) USING record_id::varchar;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `).catch(() => {});
  } catch (e) {
    console.error("Init HR Tables Error:", e);
  }
}

export async function GET(req: Request) {
  try {
    await initHRTables();

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get('branch_id');
    const isSpecificBranch = branchFilter && branchFilter !== 'ALL' && branchFilter.trim() !== '';

    let empSql = `
      SELECT 
        e.*, 
        e.employee_id::text AS employee_id,
        e.branch_id::text AS branch_id,
        COALESCE(b.name_ar, 'فرع الشركة') AS branch_name
      FROM hr_employees e
      LEFT JOIN branches b ON TRIM(e.branch_id::text) = TRIM(b.branch_id::text)
    `;
    const empParams: any[] = [];
    if (isSpecificBranch) {
      empSql += ` WHERE TRIM(e.branch_id::text) = TRIM($1)`;
      empParams.push(String(branchFilter));
    }
    empSql += ` ORDER BY e.created_at DESC`;

    let adjSql = `
      SELECT a.*, a.employee_id::text AS employee_id, a.adj_id::text AS adj_id, e.full_name, e.emp_code 
      FROM hr_adjustments a 
      JOIN hr_employees e ON TRIM(a.employee_id::text) = TRIM(e.employee_id::text) 
    `;
    const adjParams: any[] = [];
    if (isSpecificBranch) {
      adjSql += ` WHERE TRIM(e.branch_id::text) = TRIM($1)`;
      adjParams.push(String(branchFilter));
    }
    adjSql += ` ORDER BY a.created_at DESC`;

    let paySql = `
      SELECT p.*, p.employee_id::text AS employee_id, p.run_id::text AS run_id, e.full_name, e.emp_code, e.job_title, e.department, e.avatar_url, e.phone, e.bank_account 
      FROM hr_payroll_runs p 
      JOIN hr_employees e ON TRIM(p.employee_id::text) = TRIM(e.employee_id::text) 
    `;
    const payParams: any[] = [];
    if (isSpecificBranch) {
      paySql += ` WHERE TRIM(e.branch_id::text) = TRIM($1)`;
      payParams.push(String(branchFilter));
    }
    paySql += ` ORDER BY p.created_at DESC LIMIT 300`;

    let leaveSql = `
      SELECT 
        l.leave_id::text AS leave_id,
        l.employee_id::text AS employee_id,
        l.leave_type,
        l.days_count,
        to_char(l.start_date, 'YYYY-MM-DD') AS start_date,
        to_char(l.end_date, 'YYYY-MM-DD') AS end_date,
        l.reason,
        COALESCE(l.status, 'APPROVED') AS status,
        l.is_deducted,
        to_char(l.created_at, 'YYYY-MM-DD') AS created_at,
        e.full_name, 
        e.emp_code 
      FROM hr_leaves l 
      JOIN hr_employees e ON TRIM(l.employee_id::text) = TRIM(e.employee_id::text) 
    `;
    const leaveParams: any[] = [];
    if (isSpecificBranch) {
      leaveSql += ` WHERE TRIM(e.branch_id::text) = TRIM($1)`;
      leaveParams.push(String(branchFilter));
    }
    leaveSql += ` ORDER BY l.start_date DESC`;

    let penSql = `
      SELECT pa.*, pa.employee_id::text AS employee_id, pa.record_id::text AS record_id, e.full_name, e.emp_code 
      FROM hr_penalties_appraisals pa 
      JOIN hr_employees e ON TRIM(pa.employee_id::text) = TRIM(e.employee_id::text) 
    `;
    const penParams: any[] = [];
    if (isSpecificBranch) {
      penSql += ` WHERE TRIM(e.branch_id::text) = TRIM($1)`;
      penParams.push(String(branchFilter));
    }
    penSql += ` ORDER BY pa.created_at DESC`;

    const [empRes, adjRes, payRes, leaveRes, penRes] = await Promise.all([
      query(empSql, empParams).catch(() => ({ rows: [] })),
      query(adjSql, adjParams).catch(() => ({ rows: [] })),
      query(paySql, payParams).catch(() => ({ rows: [] })),
      query(leaveSql, leaveParams).catch(() => ({ rows: [] })),
      query(penSql, penParams).catch(() => ({ rows: [] }))
    ]);

    const employees = (empRes.rows || []).map((e: any) => ({
      ...e,
      branch_name: e.branch_name || BRANCH_NAMES_MAP[e.branch_id] || 'فرع الشركة'
    }));
    const adjustments = adjRes.rows || [];
    const payrollRuns = payRes.rows || [];
    const leaves = (leaveRes.rows || []).map((l: any) => ({
      ...l,
      type_label: l.leave_type === 'SICK' ? 'مرضية' : l.leave_type === 'UNPAID' ? 'بدون راتب' : 'اعتيادية'
    }));
    const penaltiesAppraisals = penRes.rows || [];

    const totalEmployees = employees.filter((e: any) => e.status === 'ACTIVE').length;
    const totalMonthlyPayroll = employees.filter((e: any) => e.status === 'ACTIVE').reduce((acc: number, e: any) => {
      return acc + (Number(e.base_salary || 0) + Number(e.allowances || 0));
    }, 0);

    const activeLoans = adjustments
      .filter((a: any) => a.adj_type === 'LOAN' && !a.is_settled)
      .reduce((acc: number, a: any) => acc + Number(a.amount || 0), 0);

    return NextResponse.json({
      success: true,
      employees,
      adjustments,
      payrollRuns,
      leaves,
      penaltiesAppraisals,
      summary: {
        totalEmployees,
        totalMonthlyPayroll,
        activeLoans,
        leavesCount: leaves.length
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initHRTables();
    const body = await req.json();
    const { action } = body;

    if (action === 'ADD_EMPLOYEE') {
      const { 
        employee_id,
        id,
        branch_id,
        emp_code, 
        full_name, 
        job_title, 
        department, 
        base_salary, 
        allowances, 
        phone, 
        national_id, 
        avatar_url, 
        annual_leave_balance, 
        bank_account, 
        hire_date, 
        contract_end_date, 
        notes, 
        cv_data 
      } = body;

      const finalEmpId = String(employee_id || id || `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      
      const finalBranchId = branch_id && String(branch_id).trim() !== '' && String(branch_id).trim() !== 'ALL'
        ? String(branch_id).trim()
        : null;

      const code = String(emp_code || `EMP-${Date.now().toString().slice(-4)}`).trim().toUpperCase();

      const res = await query(`
        INSERT INTO hr_employees (
          employee_id, branch_id, emp_code, full_name, job_title, department, base_salary, allowances, phone, national_id, avatar_url, annual_leave_balance, bank_account, hire_date, contract_end_date, notes, cv_data, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, COALESCE($14::date, CURRENT_DATE), $15, $16, $17, 'ACTIVE')
        RETURNING *
      `, [
        finalEmpId,
        finalBranchId,
        code,
        full_name || 'موظف جديد',
        job_title || 'كادر عام',
        department || 'الإدارة العامة',
        Number(base_salary) || 0,
        Number(allowances) || 0,
        phone || '',
        national_id || '',
        avatar_url || '',
        Number(annual_leave_balance) || 21,
        bank_account || '',
        hire_date && String(hire_date).trim() !== '' ? hire_date : null,
        contract_end_date && String(contract_end_date).trim() !== '' ? contract_end_date : null,
        notes || '',
        JSON.stringify(cv_data || {})
      ]);

      const bRes = finalBranchId ? await query(`SELECT name_ar FROM branches WHERE branch_id::text = $1`, [finalBranchId]) : { rows: [] };
      const bName = bRes.rows[0]?.name_ar || 'فرع الشركة';

      await logNotification(
        'HR',
        'ADD',
        `تعيين موظف جديد: ${full_name} (${bName})`,
        `تم تسجيل الموظف (${full_name} - ${job_title}) في فرع (${bName}) بقسم (${department}) براتب أساسي ${Number(base_salary).toLocaleString('en-US')} د.ع`,
        '/hr'
      );

      return NextResponse.json({ success: true, employee: { ...res.rows[0], branch_name: bName } });
    }

    if (action === 'UPDATE_EMPLOYEE') {
      const {
        employee_id,
        emp_code,
        full_name,
        job_title,
        department,
        hire_date,
        contract_end_date,
        base_salary,
        allowances,
        phone,
        annual_leave_balance
      } = body;

      const res = await query(`
        UPDATE hr_employees
        SET emp_code = $1,
            full_name = $2,
            job_title = $3,
            department = $4,
            hire_date = $5::date,
            contract_end_date = $6::date,
            base_salary = $7,
            allowances = $8,
            phone = $9,
            annual_leave_balance = $10
        WHERE employee_id::text = $11::text
        RETURNING *
      `, [
        emp_code,
        full_name,
        job_title,
        department,
        hire_date && String(hire_date).trim() !== '' ? hire_date : null,
        contract_end_date && String(contract_end_date).trim() !== '' ? contract_end_date : null,
        Number(base_salary) || 0,
        Number(allowances) || 0,
        phone || '',
        Number(annual_leave_balance) || 0,
        String(employee_id)
      ]);

      await logNotification(
        'HR',
        'UPDATE',
        `تعديل بيانات الموظف: ${full_name}`,
        `تم تعديل وتحديث الملف الوظيفي للموظف (${full_name} - ${job_title})`,
        '/hr'
      );

      return NextResponse.json({ success: true, employee: res.rows[0] });
    }

    if (action === 'UPDATE_EMPLOYEE_CV') {
      const { employee_id, cv_data, avatar_url } = body;
      const res = await query(`
        UPDATE hr_employees
        SET cv_data = $1,
            avatar_url = COALESCE($2, avatar_url)
        WHERE employee_id::text = $3::text
        RETURNING *
      `, [JSON.stringify(cv_data || {}), avatar_url || null, String(employee_id)]);

      const empRes = await query(`SELECT full_name FROM hr_employees WHERE employee_id::text = $1::text`, [String(employee_id)]);
      const empName = empRes.rows[0]?.full_name || 'موظف';

      await logNotification(
        'HR',
        'UPDATE',
        `تحديث السيرة الذاتية: ${empName}`,
        `تم حفظ وتحديث السيرة الذاتية والأرشيف الوظيفي للموظف (${empName})`,
        '/hr'
      );

      return NextResponse.json({ success: true, employee: res.rows[0] });
    }

    if (action === 'ADD_ADJUSTMENT') {
      const { adj_id, employee_id, adj_type, amount, hours_count, installments_count, reason, effective_month } = body;
      const numAmt = Number(amount) || 0;
      const numHours = Number(hours_count) || 0;
      const instCount = Number(installments_count) || 1;
      const startMonth = effective_month || new Date().toISOString().substring(0, 7);

      const emp = await query(`SELECT full_name, branch_id FROM hr_employees WHERE employee_id::text = $1::text`, [String(employee_id)]);
      const empName = emp.rows[0]?.full_name || 'موظف';
      const empBranchId = emp.rows[0]?.branch_id || null;

      if (adj_type === 'LOAN' && instCount > 1) {
        const monthlyInst = Math.round(numAmt / instCount);
        const parentLoanId = `LOAN-P-${Date.now()}`;
        const [startYear, startM] = startMonth.split('-').map(Number);
        
        for (let i = 0; i < instCount; i++) {
          const d = new Date(startYear, (startM - 1) + i, 1);
          const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const installmentReason = `${reason || 'سلفة مقسطة'} (قسط ${i + 1} من ${instCount})`;
          const subAdjId = `ADJ-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;

          await query(`
            INSERT INTO hr_adjustments (
              adj_id, employee_id, adj_type, amount, hours_count, installments_count, monthly_installment, reason, effective_month, is_settled, leave_id
            )
            VALUES ($1, $2, 'LOAN', $3, 0, $4, $5, $6, $7, FALSE, $8)
          `, [subAdjId, String(employee_id), monthlyInst, instCount, monthlyInst, installmentReason, monthStr, parentLoanId]);
        }

        const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const vNum = `V-LOAN-${Date.now().toString().slice(-5)}`;
        const notes = JSON.stringify({
          sector: 'HR_PAYROLL',
          partyAr: empName,
          forReasonAr: `سلفة نقدية مقسطة على (${instCount} أشهر) - ${reason || ''}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, created_by, issue_date)
          VALUES ($1, $2, $3, 'PAYMENT', $4, $4, $5, 'POSTED', 'إدارة الموارد البشرية والرواتب', CURRENT_DATE)
        `, [vId, empBranchId, vNum, numAmt, notes]).catch(() => {});

        await logNotification(
          'HR',
          'ADD',
          `سلفة مقسطة للموظف: ${empName}`,
          `تم منح سلفة بمبلغ ${numAmt.toLocaleString('en-US')} د.ع مقسطة على (${instCount} أشهر) للموظف (${empName})`,
          '/hr'
        );

        return NextResponse.json({ success: true, count: instCount });
      }

      const singleAdjId = String(adj_id || `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      const res = await query(`
        INSERT INTO hr_adjustments (adj_id, employee_id, adj_type, amount, hours_count, installments_count, monthly_installment, reason, effective_month, is_settled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
        RETURNING *
      `, [
        singleAdjId,
        String(employee_id),
        adj_type,
        numAmt,
        numHours,
        1,
        numAmt,
        reason || '',
        startMonth
      ]);

      if (adj_type === 'LOAN') {
        const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const vNum = `V-LOAN-${Date.now().toString().slice(-5)}`;
        const notes = JSON.stringify({
          sector: 'HR_PAYROLL',
          partyAr: empName,
          forReasonAr: `سلفة نقدية على الراتب - ${reason || ''}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, created_by, issue_date)
          VALUES ($1, $2, $3, 'PAYMENT', $4, $4, $5, 'POSTED', 'إدارة الموارد البشرية والرواتب', CURRENT_DATE)
        `, [vId, empBranchId, vNum, numAmt, notes]).catch(() => {});
      }

      const adjTitle = adj_type === 'DEDUCTION' ? 'استقطاع / قطع راتب' : adj_type === 'OVERTIME' ? 'ساعات إضافية' : adj_type === 'LOAN' ? 'سلفة نقدية' : 'مكافأة إنجاز';

      await logNotification(
        'HR',
        'ADD',
        `${adjTitle}: ${empName}`,
        `تم قيد (${adjTitle}) بمبلغ ${numAmt.toLocaleString('en-US')} د.ع للموظف (${empName}) - لشهر: ${startMonth}`,
        '/hr'
      );

      return NextResponse.json({ success: true, adjustment: res.rows[0] });
    }

    if (action === 'RECORD_LEAVE') {
      const { leave_id, employee_id, leave_type, days_count, start_date, end_date, reason } = body;
      const days = Number(days_count) || 1;
      const finalLeaveId = String(leave_id || `LEV-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

      const conflictCheck = await query(`
        SELECT leave_id, to_char(start_date, 'YYYY-MM-DD') as s_date, to_char(end_date, 'YYYY-MM-DD') as e_date 
        FROM hr_leaves 
        WHERE employee_id::text = $1::text 
          AND COALESCE(status, 'APPROVED') != 'REJECTED'
          AND (
            ($2::date BETWEEN start_date AND end_date) OR
            ($3::date BETWEEN start_date AND end_date) OR
            (start_date BETWEEN $2::date AND $3::date)
          )
      `, [String(employee_id), start_date, end_date]).catch(() => ({ rows: [] }));

      if (conflictCheck.rows && conflictCheck.rows.length > 0) {
        const conflict = conflictCheck.rows[0];
        return NextResponse.json({ 
          success: false, 
          error: `يوجد تداخل زمني! الموظف لديه إجازة قائمة بالفعل من تاريخ ${conflict.s_date} إلى ${conflict.e_date}` 
        }, { status: 400 });
      }

      const rawType = String(leave_type || '').toUpperCase();
      let normalizedType = 'ANNUAL';
      let typeLabelAr = 'اعتيادية';
      const isUnpaid = rawType === 'UNPAID' || rawType.includes('بدون') || rawType.includes('خصم');
      const isSick = rawType === 'SICK' || rawType.includes('مرض');

      if (isUnpaid) {
        normalizedType = 'UNPAID';
        typeLabelAr = 'بدون راتب (خصم مباشر)';
      } else if (isSick) {
        normalizedType = 'SICK';
        typeLabelAr = 'مرضية';
      } else {
        normalizedType = 'ANNUAL';
        typeLabelAr = 'اعتيادية';
      }

      const leaveRes = await query(`
        INSERT INTO hr_leaves (leave_id, employee_id, leave_type, days_count, start_date, end_date, reason, status, is_deducted)
        VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, 'APPROVED', $8)
        RETURNING *, to_char(start_date, 'YYYY-MM-DD') as start_date, to_char(end_date, 'YYYY-MM-DD') as end_date
      `, [finalLeaveId, String(employee_id), normalizedType, days, start_date, end_date, reason || '', isUnpaid]);

      const newLeave = leaveRes.rows[0];

      if (normalizedType === 'ANNUAL') {
        await query(`
          UPDATE hr_employees 
          SET annual_leave_balance = GREATEST(0, annual_leave_balance - $1)
          WHERE employee_id::text = $2::text
        `, [days, String(employee_id)]);
      }

      if (isUnpaid) {
        const empRes = await query(`SELECT base_salary FROM hr_employees WHERE employee_id::text = $1::text`, [String(employee_id)]);
        const baseSal = Number(empRes.rows[0]?.base_salary || 0);
        const dailyRate = baseSal > 0 ? Math.round(baseSal / 30) : 0;
        const totalDeduction = dailyRate * days;

        const effectiveMonth = String(start_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
        const autoReason = `استقطاع إجازة بدون راتب (${days} يوم)`;
        const unpaidAdjId = `ADJ-LEV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await query(`
          INSERT INTO hr_adjustments (
            adj_id, employee_id, adj_type, amount, monthly_installment, reason, effective_month, is_settled, leave_id
          )
          VALUES ($1, $2, 'DEDUCTION', $3, $4, $5, $6, FALSE, $7)
        `, [unpaidAdjId, String(employee_id), totalDeduction, totalDeduction, autoReason, effectiveMonth, finalLeaveId]);
      }

      const emp = await query(`SELECT full_name FROM hr_employees WHERE employee_id::text = $1::text`, [String(employee_id)]);
      const empName = emp.rows[0]?.full_name || 'موظف';

      await logNotification(
        'HR',
        'ADD',
        `تسجيل إجازة: ${empName}`,
        `تم تسجيل إجازة (${typeLabelAr}) للموظف (${empName}) لمدة ${days} أيام من تاريخ ${start_date} إلى ${end_date}`,
        '/hr'
      );

      return NextResponse.json({ success: true, leave: newLeave });
    }

    if (action === 'ADD_PENALTY_APPRAISAL') {
      const { record_id, employee_id, record_type, title, details, rating_score, record_date } = body;
      const finalRecId = String(record_id || `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

      const res = await query(`
        INSERT INTO hr_penalties_appraisals (record_id, employee_id, record_type, title, details, rating_score, record_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        finalRecId, 
        String(employee_id), 
        record_type, 
        title, 
        details || '', 
        Number(rating_score) || 5, 
        record_date && String(record_date).trim() !== '' ? record_date : new Date().toISOString().substring(0, 10)
      ]);

      const emp = await query(`SELECT full_name FROM hr_employees WHERE employee_id::text = $1::text`, [String(employee_id)]);
      const empName = emp.rows[0]?.full_name || 'موظف';

      await logNotification(
        'HR',
        'ADD',
        `${record_type === 'APPRAISAL' ? 'تقييم أداء' : 'إنذار إداري'}: ${empName}`,
        `تم قيد سجل إداري (${title}) للموظف (${empName}) بدرجة (${rating_score}/5)`,
        '/hr'
      );

      return NextResponse.json({ success: true, record: res.rows[0] });
    }

    if (action === 'RESET_PAYROLL') {
      const { month } = body;
      const targetMonth = month || new Date().toISOString().substring(0, 7);

      await query(`DELETE FROM hr_payroll_runs WHERE payroll_month = $1`, [targetMonth]);
      const vPattern = `V-PAY-${targetMonth.replace('-', '')}-%`;
      await query(`DELETE FROM vouchers WHERE voucher_number LIKE $1`, [vPattern]).catch(() => {});
      await query(`UPDATE hr_adjustments SET is_settled = FALSE WHERE effective_month = $1 OR effective_month IS NULL`, [targetMonth]);
      await query(`UPDATE hr_leaves SET is_deducted = FALSE WHERE leave_type = 'UNPAID'`);

      await logNotification(
        'HR',
        'DELETE',
        `تصفير مسير رواتب شهر: ${targetMonth}`,
        `تم تصفير واسترجاع بودرة الرواتب لشهر (${targetMonth}) لإعادة المراجعة والتعديل`,
        '/hr'
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'PROCESS_PAYROLL') {
      const { month, branch_id } = body;
      const targetMonth = month || new Date().toISOString().substring(0, 7);
      const isSpecificBranch = branch_id && branch_id !== 'ALL' && branch_id.trim() !== '';

      let empQuery = `SELECT * FROM hr_employees WHERE status = 'ACTIVE'`;
      const empQueryParams: any[] = [];
      if (isSpecificBranch) {
        empQuery += ` AND TRIM(branch_id::text) = TRIM($1)`;
        empQueryParams.push(String(branch_id));
      }

      const activeEmployees = await query(empQuery, empQueryParams);
      const emps = activeEmployees.rows || [];

      for (const emp of emps) {
        const base = Number(emp.base_salary) || 0;
        const allow = Number(emp.allowances) || 0;
        const empBranchId = emp.branch_id || null;

        const adjs = await query(`
          SELECT * FROM hr_adjustments 
          WHERE employee_id::text = $1::text AND (effective_month = $2 OR (effective_month IS NULL AND is_settled = FALSE))
        `, [String(emp.employee_id), targetMonth]);

        let bonus = 0;
        let overtime = 0;
        let loanDeduct = 0;
        let penalty = 0;
        const reasonsList: string[] = [];

        for (const a of adjs.rows) {
          const val = Number(a.amount) || 0;
          const monthlyInst = (Number(a.monthly_installment) > 0) ? Number(a.monthly_installment) : val;

          if (a.adj_type === 'BONUS') bonus += val;
          if (a.adj_type === 'OVERTIME') overtime += val;
          if (a.adj_type === 'LOAN') {
            loanDeduct += monthlyInst;
            reasonsList.push(a.reason || `قسط سلفة (${monthlyInst} د.ع)`);
          }
          if (a.adj_type === 'DEDUCTION') {
            penalty += val;
            if (a.reason) reasonsList.push(a.reason);
          }
        }

        const net = Math.max(0, (base + allow + bonus + overtime) - (loanDeduct + penalty));
        const deductionNotes = reasonsList.join(' | ');

        const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const vNum = `V-PAY-${targetMonth.replace('-', '')}-${emp.emp_code}`;
        const vNotes = JSON.stringify({
          sector: 'HR_PAYROLL',
          partyAr: emp.full_name,
          forReasonAr: `راتب شهر (${targetMonth}) للموظف ${emp.full_name}`,
          method: 'CASH',
          details: { base, allow, bonus, overtime, loanDeduct, penalty, deductionNotes, net }
        });

        await query(`DELETE FROM hr_payroll_runs WHERE employee_id::text = $1::text AND payroll_month = $2`, [String(emp.employee_id), targetMonth]);
        await query(`DELETE FROM vouchers WHERE voucher_number = $1`, [vNum]).catch(() => {});

        await query(`
          INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, created_by, issue_date)
          VALUES ($1, $2, $3, 'PAYMENT', $4, $4, $5, 'POSTED', 'إدارة الموارد البشرية والرواتب', CURRENT_DATE)
        `, [vId, empBranchId, vNum, net, vNotes]).catch(() => {});

        const runId = `RUN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await query(`
          INSERT INTO hr_payroll_runs (
            run_id, payroll_month, employee_id, base_salary, allowances, bonuses, overtime_amount, loans_deducted, penalties, deduction_reasons, net_salary, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PAID')
        `, [runId, targetMonth, String(emp.employee_id), base, allow, bonus, overtime, loanDeduct, penalty, deductionNotes, net]);

        await query(`
          UPDATE hr_adjustments 
          SET is_settled = TRUE 
          WHERE employee_id::text = $1::text AND (effective_month = $2 OR (effective_month IS NULL AND is_settled = FALSE))
        `, [String(emp.employee_id), targetMonth]);
      }

      await logNotification(
        'HR',
        'UPDATE',
        `ترحيل مسير رواتب شهر: ${targetMonth}`,
        `تم احتساب واعتماد وترحيل رواتب شهر (${targetMonth}) للكوادر وتوليد سندات الصرف بصناديق الفروع`,
        '/hr'
      );

      return NextResponse.json({ success: true, processedCount: emps.length });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empId = searchParams.get('id');
    const leaveId = searchParams.get('leave_id');
    const adjId = searchParams.get('adj_id');
    const recId = searchParams.get('rec_id');

    if (leaveId) {
      const leaveObj = await query(`SELECT * FROM hr_leaves WHERE leave_id::text = $1::text`, [String(leaveId)]);
      if (leaveObj.rows.length > 0) {
        const l = leaveObj.rows[0];
        if (l.leave_type === 'ANNUAL') {
          await query(`
            UPDATE hr_employees 
            SET annual_leave_balance = annual_leave_balance + $1 
            WHERE employee_id::text = $2::text
          `, [Number(l.days_count || 1), String(l.employee_id)]);
        }
      }

      await query(`DELETE FROM hr_adjustments WHERE leave_id::text = $1::text`, [String(leaveId)]);
      await query(`DELETE FROM hr_leaves WHERE leave_id::text = $1::text`, [String(leaveId)]);
      return NextResponse.json({ success: true });
    }

    if (adjId) {
      const adjObj = await query(`SELECT leave_id, adj_type FROM hr_adjustments WHERE adj_id::text = $1::text`, [String(adjId)]);
      if (adjObj.rows.length > 0) {
        const lId = adjObj.rows[0].leave_id;
        const aType = adjObj.rows[0].adj_type;
        
        if (lId && aType === 'DEDUCTION') {
          await query(`DELETE FROM hr_leaves WHERE leave_id::text = $1::text`, [String(lId)]);
        }
        if (lId && aType === 'LOAN') {
          await query(`DELETE FROM hr_adjustments WHERE leave_id::text = $1::text`, [String(lId)]);
        }
      }

      await query(`DELETE FROM hr_adjustments WHERE adj_id::text = $1::text`, [String(adjId)]);
      return NextResponse.json({ success: true });
    }

    if (recId) {
      await query(`DELETE FROM hr_penalties_appraisals WHERE record_id::text = $1::text`, [String(recId)]);
      return NextResponse.json({ success: true });
    }

    if (empId) {
      const empInfo = await query(`SELECT full_name FROM hr_employees WHERE employee_id::text = $1::text`, [String(empId)]);
      const empName = empInfo.rows[0]?.full_name || 'موظف';

      await query(`DELETE FROM hr_employees WHERE employee_id::text = $1::text`, [String(empId)]);

      await logNotification(
        'HR',
        'DELETE',
        `حذف موظف: ${empName}`,
        `تم حذف ملف وسجلات الموظف (${empName}) نهائياً من أرشيف الكوادر`,
        '/hr'
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'معرف غير محدد للحذف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}