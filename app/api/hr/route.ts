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

async function initHRTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

    await query(`
      CREATE TABLE IF NOT EXISTS hr_adjustments (
        adj_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
        adj_type VARCHAR(50) NOT NULL,
        amount NUMERIC NOT NULL DEFAULT 0,
        hours_count NUMERIC DEFAULT 0,
        installments_count INT DEFAULT 1,
        monthly_installment NUMERIC DEFAULT 0,
        reason TEXT,
        effective_month VARCHAR(20),
        is_settled BOOLEAN DEFAULT FALSE,
        leave_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS leave_id UUID;`).catch(() => {});
    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS installments_count INT DEFAULT 1;`).catch(() => {});
    await query(`ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS monthly_installment NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;`).catch(() => {});
    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS contract_end_date DATE;`).catch(() => {});
    await query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS cv_data JSONB DEFAULT '{}';`).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS hr_leaves (
        leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
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
      CREATE TABLE IF NOT EXISTS hr_payroll_runs (
        run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payroll_month VARCHAR(20) NOT NULL,
        employee_id UUID REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
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
      CREATE TABLE IF NOT EXISTS hr_penalties_appraisals (
        record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
        record_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        rating_score INT DEFAULT 5,
        record_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error("Init HR Tables Error:", e);
  }
}

export async function GET() {
  try {
    await initHRTables();

    const empRes = await query(`SELECT * FROM hr_employees ORDER BY created_at DESC`).catch(() => ({ rows: [] }));
    const adjRes = await query(`SELECT a.*, e.full_name, e.emp_code FROM hr_adjustments a JOIN hr_employees e ON a.employee_id = e.employee_id ORDER BY a.created_at DESC`).catch(() => ({ rows: [] }));
    const payRes = await query(`SELECT p.*, e.full_name, e.emp_code, e.job_title, e.department, e.avatar_url, e.phone, e.bank_account FROM hr_payroll_runs p JOIN hr_employees e ON p.employee_id = e.employee_id ORDER BY p.created_at DESC LIMIT 300`).catch(() => ({ rows: [] }));
    const leaveRes = await query(`SELECT l.*, e.full_name, e.emp_code FROM hr_leaves l JOIN hr_employees e ON l.employee_id = e.employee_id ORDER BY l.created_at DESC`).catch(() => ({ rows: [] }));
    const penRes = await query(`SELECT pa.*, e.full_name, e.emp_code FROM hr_penalties_appraisals pa JOIN hr_employees e ON pa.employee_id = e.employee_id ORDER BY pa.created_at DESC`).catch(() => ({ rows: [] }));

    const employees = empRes.rows || [];
    const adjustments = adjRes.rows || [];
    const payrollRuns = payRes.rows || [];
    const leaves = leaveRes.rows || [];
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
      const code = String(emp_code || `EMP-${Date.now().toString().slice(-4)}`).trim().toUpperCase();

      const res = await query(`
        INSERT INTO hr_employees (
          emp_code, full_name, job_title, department, base_salary, allowances, phone, national_id, avatar_url, annual_leave_balance, bank_account, hire_date, contract_end_date, notes, cv_data, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12::date, CURRENT_DATE), $13, $14, $15, 'ACTIVE')
        RETURNING *
      `, [
        code,
        full_name,
        job_title,
        department || 'الإدارة العامة',
        Number(base_salary) || 0,
        Number(allowances) || 0,
        phone || '',
        national_id || '',
        avatar_url || '',
        Number(annual_leave_balance) || 21,
        bank_account || '',
        hire_date || null,
        contract_end_date || null,
        notes || '',
        JSON.stringify(cv_data || {})
      ]);

      await logNotification(
        'HR',
        'ADD',
        `تعيين موظف جديد: ${full_name}`,
        `تم تسجيل الموظف (${full_name} - ${job_title}) في قسم (${department}) براتب أساسي ${Number(base_salary).toLocaleString('en-US')} د.ع`,
        '/hr'
      );

      return NextResponse.json({ success: true, employee: res.rows[0] });
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
        WHERE employee_id = $11
        RETURNING *
      `, [
        emp_code,
        full_name,
        job_title,
        department,
        hire_date || null,
        contract_end_date || null,
        Number(base_salary) || 0,
        Number(allowances) || 0,
        phone || '',
        Number(annual_leave_balance) || 0,
        employee_id
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
        WHERE employee_id = $3
        RETURNING *
      `, [JSON.stringify(cv_data || {}), avatar_url || null, employee_id]);

      const empRes = await query(`SELECT full_name FROM hr_employees WHERE employee_id = $1`, [employee_id]);
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
      const { employee_id, adj_type, amount, hours_count, installments_count, reason, effective_month } = body;
      const numAmt = Number(amount) || 0;
      const numHours = Number(hours_count) || 0;
      const instCount = Number(installments_count) || 1;
      const startMonth = effective_month || new Date().toISOString().substring(0, 7);

      const emp = await query(`SELECT full_name FROM hr_employees WHERE employee_id = $1`, [employee_id]);
      const empName = emp.rows[0]?.full_name || 'موظف';

      if (adj_type === 'LOAN' && instCount > 1) {
        const monthlyInst = Math.round(numAmt / instCount);
        const parentLoanId = crypto.randomUUID();
        const [startYear, startM] = startMonth.split('-').map(Number);
        
        for (let i = 0; i < instCount; i++) {
          const d = new Date(startYear, (startM - 1) + i, 1);
          const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const installmentReason = `${reason || 'سلفة مقسطة'} (قسط ${i + 1} من ${instCount})`;

          await query(`
            INSERT INTO hr_adjustments (
              employee_id, adj_type, amount, hours_count, installments_count, monthly_installment, reason, effective_month, leave_id
            )
            VALUES ($1, 'LOAN', $2, 0, $3, $4, $5, $6, $7)
          `, [employee_id, monthlyInst, instCount, monthlyInst, installmentReason, monthStr, parentLoanId]);
        }

        const vNum = `V-LOAN-${Date.now().toString().slice(-5)}`;
        const notes = JSON.stringify({
          sector: 'HR_PAYROLL',
          partyAr: empName,
          forReasonAr: `سلفة نقدية مقسطة على (${instCount} أشهر) - ${reason || ''}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, 'PAYMENT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
        `, [vNum, numAmt, notes]).catch(() => {});

        await logNotification(
          'HR',
          'ADD',
          `سلفة مقسطة للموظف: ${empName}`,
          `تم منح سلفة بمبلغ ${numAmt.toLocaleString('en-US')} د.ع مقسطة على (${instCount} أشهر) للموظف (${empName})`,
          '/hr'
        );

        return NextResponse.json({ success: true, count: instCount });
      }

      const res = await query(`
        INSERT INTO hr_adjustments (employee_id, adj_type, amount, hours_count, installments_count, monthly_installment, reason, effective_month)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        employee_id,
        adj_type,
        numAmt,
        numHours,
        1,
        numAmt,
        reason || '',
        startMonth
      ]);

      if (adj_type === 'LOAN') {
        const vNum = `V-LOAN-${Date.now().toString().slice(-5)}`;
        const notes = JSON.stringify({
          sector: 'HR_PAYROLL',
          partyAr: empName,
          forReasonAr: `سلفة نقدية على الراتب - ${reason || ''}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, 'PAYMENT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
        `, [vNum, numAmt, notes]).catch(() => {});
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
      const { employee_id, leave_type, days_count, start_date, end_date, reason } = body;
      const days = Number(days_count) || 1;

      const leaveRes = await query(`
        INSERT INTO hr_leaves (employee_id, leave_type, days_count, start_date, end_date, reason, is_deducted)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [employee_id, leave_type, days, start_date, end_date, reason || '', leave_type === 'UNPAID']);

      const newLeave = leaveRes.rows[0];

      await query(`
        UPDATE hr_employees 
        SET annual_leave_balance = GREATEST(0, annual_leave_balance - $1)
        WHERE employee_id = $2
      `, [days, employee_id]);

      if (leave_type === 'UNPAID') {
        const empRes = await query(`SELECT base_salary FROM hr_employees WHERE employee_id = $1`, [employee_id]);
        const baseSal = Number(empRes.rows[0]?.base_salary || 0);
        const dailyRate = baseSal > 0 ? Math.round(baseSal / 30) : 0;
        const totalDeduction = dailyRate * days;

        const effectiveMonth = String(start_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
        const autoReason = `استقطاع إجازة بدون راتب (${days} يوم)`;

        await query(`
          INSERT INTO hr_adjustments (
            employee_id, adj_type, amount, monthly_installment, reason, effective_month, is_settled, leave_id
          )
          VALUES ($1, 'DEDUCTION', $2, $3, $4, $5, FALSE, $6)
        `, [employee_id, totalDeduction, totalDeduction, autoReason, effectiveMonth, newLeave.leave_id]);
      }

      const emp = await query(`SELECT full_name FROM hr_employees WHERE employee_id = $1`, [employee_id]);
      const empName = emp.rows[0]?.full_name || 'موظف';

      await logNotification(
        'HR',
        'ADD',
        `تسجيل إجازة: ${empName}`,
        `تم تسجيل إجازة (${leave_type === 'UNPAID' ? 'بدون راتب' : 'اعتيادية'}) للموظف (${empName}) لمدة ${days} أيام وخصمها من الرصيد والراتب`,
        '/hr'
      );

      return NextResponse.json({ success: true, leave: newLeave });
    }

    if (action === 'ADD_PENALTY_APPRAISAL') {
      const { employee_id, record_type, title, details, rating_score, record_date } = body;
      const res = await query(`
        INSERT INTO hr_penalties_appraisals (employee_id, record_type, title, details, rating_score, record_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [employee_id, record_type, title, details || '', Number(rating_score) || 5, record_date || new Date().toISOString().substring(0, 10)]);

      const emp = await query(`SELECT full_name FROM hr_employees WHERE employee_id = $1`, [employee_id]);
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
      const { month } = body;
      const targetMonth = month || new Date().toISOString().substring(0, 7);

      const activeEmployees = await query(`SELECT * FROM hr_employees WHERE status = 'ACTIVE'`);
      const emps = activeEmployees.rows || [];

      for (const emp of emps) {
        const base = Number(emp.base_salary) || 0;
        const allow = Number(emp.allowances) || 0;

        const adjs = await query(`
          SELECT * FROM hr_adjustments 
          WHERE employee_id = $1 AND (effective_month = $2 OR (effective_month IS NULL AND is_settled = FALSE))
        `, [emp.employee_id, targetMonth]);

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

        const vNum = `V-PAY-${targetMonth.replace('-', '')}-${emp.emp_code}`;
        const vNotes = JSON.stringify({
          sector: 'HR_PAYROLL',
          partyAr: emp.full_name,
          forReasonAr: `راتب شهر (${targetMonth}) للموظف ${emp.full_name}`,
          method: 'CASH',
          details: { base, allow, bonus, overtime, loanDeduct, penalty, deductionNotes, net }
        });

        await query(`DELETE FROM hr_payroll_runs WHERE employee_id = $1 AND payroll_month = $2`, [emp.employee_id, targetMonth]);
        await query(`DELETE FROM vouchers WHERE voucher_number = $1`, [vNum]).catch(() => {});

        await query(`
          INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, 'PAYMENT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
        `, [vNum, net, vNotes]).catch(() => {});

        await query(`
          INSERT INTO hr_payroll_runs (
            payroll_month, employee_id, base_salary, allowances, bonuses, overtime_amount, loans_deducted, penalties, deduction_reasons, net_salary, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PAID')
        `, [targetMonth, emp.employee_id, base, allow, bonus, overtime, loanDeduct, penalty, deductionNotes, net]);

        await query(`
          UPDATE hr_adjustments 
          SET is_settled = TRUE 
          WHERE employee_id = $1 AND (effective_month = $2 OR (effective_month IS NULL AND is_settled = FALSE))
        `, [emp.employee_id, targetMonth]);
      }

      await logNotification(
        'HR',
        'UPDATE',
        `ترحيل مسير رواتب شهر: ${targetMonth}`,
        `تم احتساب واعتماد وترحيل رواتب شهر (${targetMonth}) لجميع الكوادر وتوليد سندات الصرف في الصندوق`,
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
      const leaveObj = await query(`SELECT * FROM hr_leaves WHERE leave_id = $1`, [leaveId]);
      if (leaveObj.rows.length > 0) {
        const l = leaveObj.rows[0];
        await query(`
          UPDATE hr_employees 
          SET annual_leave_balance = annual_leave_balance + $1 
          WHERE employee_id = $2
        `, [Number(l.days_count || 1), l.employee_id]);
      }

      await query(`DELETE FROM hr_adjustments WHERE leave_id = $1`, [leaveId]);
      await query(`DELETE FROM hr_leaves WHERE leave_id = $1`, [leaveId]);
      return NextResponse.json({ success: true });
    }

    if (adjId) {
      const adjObj = await query(`SELECT leave_id, adj_type FROM hr_adjustments WHERE adj_id = $1`, [adjId]);
      if (adjObj.rows.length > 0) {
        const lId = adjObj.rows[0].leave_id;
        const aType = adjObj.rows[0].adj_type;
        
        if (lId && aType === 'DEDUCTION') {
          await query(`DELETE FROM hr_leaves WHERE leave_id = $1`, [lId]);
        }
        if (lId && aType === 'LOAN') {
          await query(`DELETE FROM hr_adjustments WHERE leave_id = $1`, [lId]);
        }
      }

      await query(`DELETE FROM hr_adjustments WHERE adj_id = $1`, [adjId]);
      return NextResponse.json({ success: true });
    }

    if (recId) {
      await query(`DELETE FROM hr_penalties_appraisals WHERE record_id = $1`, [recId]);
      return NextResponse.json({ success: true });
    }

    if (empId) {
      const empInfo = await query(`SELECT full_name FROM hr_employees WHERE employee_id = $1`, [empId]);
      const empName = empInfo.rows[0]?.full_name || 'موظف';

      await query(`DELETE FROM hr_employees WHERE employee_id = $1`, [empId]);

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}