import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const branchFilter = searchParams.get('branch_id');
    const isSpecificBranch = branchFilter && branchFilter !== 'ALL' && branchFilter.trim() !== '';

    // 1. جلب السندات المحاسبية المقيدة مع دعم الفلترة بحسب الفرع والتاريخ
    let voucherQuery = `
      SELECT 
        v.voucher_id::text AS voucher_id,
        COALESCE(v.branch_id::text, 'BR-HQ-01') AS branch_id,
        v.voucher_number,
        v.voucher_type,
        v.currency,
        v.status,
        v.notes,
        v.issue_date,
        v.project_id::text AS v_proj_id,
        CASE 
          WHEN COALESCE(SUM(jl.debit), 0) > 0 THEN SUM(jl.debit)
          WHEN COALESCE(v.total_amount, 0) > 0 THEN v.total_amount
          ELSE COALESCE(v.amount, 0)
        END AS amount
      FROM vouchers v
      LEFT JOIN journal_lines jl ON v.voucher_id::text = jl.voucher_id::text
      WHERE v.status::text NOT IN ('VOID', 'CANCELLED')
    `;

    const vParams: any[] = [];
    if (isSpecificBranch) {
      vParams.push(String(branchFilter));
      voucherQuery += ` AND v.branch_id::text = $${vParams.length}`;
    }
    if (startDate) {
      vParams.push(startDate);
      voucherQuery += ` AND v.issue_date >= $${vParams.length}`;
    }
    if (endDate) {
      vParams.push(endDate);
      voucherQuery += ` AND v.issue_date <= $${vParams.length}`;
    }

    voucherQuery += `
      GROUP BY v.voucher_id, v.branch_id, v.voucher_number, v.voucher_type, v.currency, v.status, v.notes, v.issue_date, v.total_amount, v.amount, v.project_id
    `;

    const vouchersRes = await query(voucherQuery, vParams).catch(() => ({ rows: [] }));

    // 2. جلب أسطول النقل اللوجستي مع الفلترة بحسب الفرع
    let fleetTripsSql = `SELECT COALESCE(SUM(trip_cost), 0) AS transport_revenue FROM fleet_trips WHERE trip_status::text = 'COMPLETED'`;
    let fleetMaintSql = `
      SELECT COALESCE(SUM(m.cost), 0) AS transport_expenses 
      FROM fleet_maintenance_logs m
      LEFT JOIN fleet_vehicles v ON m.vehicle_id::text = v.vehicle_id::text
    `;
    const fleetParams: any[] = [];

    if (isSpecificBranch) {
      fleetParams.push(String(branchFilter));
      fleetTripsSql += ` AND branch_id::text = $1`;
      fleetMaintSql += ` WHERE v.branch_id::text = $1`;
    }

    const [fleetTripsRes, fleetMaintRes] = await Promise.all([
      query(fleetTripsSql, fleetParams).catch(() => ({ rows: [{ transport_revenue: 0 }] })),
      query(fleetMaintSql, fleetParams).catch(() => ({ rows: [{ transport_expenses: 0 }] }))
    ]);

    // 3. جلب بيانات مشاريع المقاولات + المواد + مقاولي الباطن مع الفلترة بحسب الفرع
    let projSql = `SELECT *, project_id::text AS project_id, COALESCE(branch_id::text, 'BR-HQ-01') AS branch_id FROM projects`;
    const projParams: any[] = [];
    if (isSpecificBranch) {
      projParams.push(String(branchFilter));
      projSql += ` WHERE branch_id::text = $1`;
    }
    projSql += ` ORDER BY created_at DESC`;

    const [projRes, matRes, subsRes] = await Promise.all([
      query(projSql, projParams).catch(() => ({ rows: [] })),
      query(`SELECT *, project_id::text AS project_id FROM project_materials`).catch(() => ({ rows: [] })),
      query(`SELECT *, project_id::text AS project_id FROM project_subcontractors`).catch(() => ({ rows: [] }))
    ]);

    // 4. جلب بيانات الموارد البشرية ومسير الرواتب المعتمد بحسب الفرع
    let payrollSql = `
      SELECT p.*, p.employee_id::text AS employee_id 
      FROM hr_payroll_runs p
      LEFT JOIN hr_employees e ON p.employee_id::text = e.employee_id::text
    `;
    let empSql = `SELECT *, employee_id::text AS employee_id, COALESCE(branch_id::text, 'BR-HQ-01') AS branch_id FROM hr_employees WHERE status::text = 'ACTIVE'`;
    const hrParams: any[] = [];

    if (isSpecificBranch) {
      hrParams.push(String(branchFilter));
      payrollSql += ` WHERE e.branch_id::text = $1`;
      empSql += ` AND branch_id::text = $1`;
    }
    payrollSql += ` ORDER BY p.created_at DESC`;

    const [payrollRunsRes, employeesRes] = await Promise.all([
      query(payrollSql, hrParams).catch(() => ({ rows: [] })),
      query(empSql, hrParams).catch(() => ({ rows: [] }))
    ]);

    // 5. جلب بيانات العقارات والاستثمار بحسب الفرع
    let unitsSql = `SELECT *, unit_id::text AS unit_id, COALESCE(branch_id::text, 'BR-HQ-01') AS branch_id FROM real_estate_units`;
    let instSql = `
      SELECT i.*, u.branch_id 
      FROM real_estate_installments i
      LEFT JOIN real_estate_units u ON i.unit_id::text = u.unit_id::text
    `;
    const realEstateParams: any[] = [];

    if (isSpecificBranch) {
      realEstateParams.push(String(branchFilter));
      unitsSql += ` WHERE branch_id::text = $1`;
      instSql += ` WHERE u.branch_id::text = $1`;
    }

    const [realEstateUnitsRes, realEstateContractsRes] = await Promise.all([
      query(unitsSql, realEstateParams).catch(() => ({ rows: [] })),
      query(instSql, realEstateParams).catch(() => ({ rows: [] }))
    ]);

    const vouchersList = vouchersRes.rows || [];
    const projectsList = projRes.rows || [];
    const materialsList = matRes.rows || [];
    const subsList = subsRes.rows || [];
    const payrollRunsList = payrollRunsRes.rows || [];
    const employeesList = employeesRes.rows || [];
    const realEstateInstallmentsList = realEstateContractsRes.rows || [];

    const clean = (t: string) => (t || '').trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ');

    let totalProjectReceipts = 0;
    let totalProjectSiteCosts = 0;

    // 6. معالجة مشاريع المقاولات
    const enrichedProjects = projectsList.map((proj: any) => {
      const pId = String(proj.project_id || '');
      const pName = clean(proj.project_name);

      let projReceived = 0;
      let directExpenses = 0;

      for (const v of vouchersList) {
        let amt = Number(v.amount) || 0;
        if (amt === 0 && v.notes) {
          try {
            const parsed = JSON.parse(v.notes);
            if (parsed.amount) amt = Number(parsed.amount);
          } catch {}
        }

        const vProjId = String(v.v_proj_id || '');
        const vNotes = clean(v.notes || '');

        const isMatched = 
          (vProjId !== '' && vProjId === pId) ||
          (pName.length > 4 && vNotes.includes(pName));

        if (isMatched) {
          if (v.voucher_type === 'RECEIPT') projReceived += amt;
          if (v.voucher_type === 'PAYMENT') directExpenses += amt;
        }
      }

      const projMaterials = materialsList.filter((m: any) => String(m.project_id) === pId);
      const materialsCost = projMaterials.reduce((acc: number, m: any) => {
        return acc + ((Number(m.quantity_received) || 0) * (Number(m.unit_price) || 0));
      }, 0);

      const projSubs = subsList.filter((s: any) => String(s.project_id) === pId);
      const subsCost = projSubs.reduce((acc: number, s: any) => acc + (Number(s.contract_value) || 0), 0);

      const totalSiteCosts = materialsCost + subsCost + directExpenses;

      totalProjectReceipts += projReceived;
      totalProjectSiteCosts += totalSiteCosts;

      return {
        ...proj,
        actualReceived: projReceived,
        actualExpenses: totalSiteCosts,
        netCash: projReceived - totalSiteCosts
      };
    });

    // 7. حسابات قطاع النقل اللوجستي
    const transportRevenue = Number(fleetTripsRes.rows[0]?.transport_revenue || 0);
    const transportExpenses = Number(fleetMaintRes.rows[0]?.transport_expenses || 0);
    const transportNet = transportRevenue - transportExpenses;

    // 8. حسابات قطاع الموارد البشرية والرواتب
    let totalPayrollPaid = 0;
    if (payrollRunsList.length > 0) {
      totalPayrollPaid = payrollRunsList.reduce((acc: number, r: any) => acc + Number(r.net_salary || 0), 0);
    } else {
      totalPayrollPaid = employeesList.reduce((acc: number, e: any) => acc + (Number(e.base_salary || 0) + Number(e.allowances || 0)), 0);
    }

    // 9. حسابات قطاع العقارات والاستثمار
    const realEstateRevenue = realEstateInstallmentsList.filter((c: any) => c.is_paid).reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);
    const realEstateExpenses = 0;
    const realEstateNet = realEstateRevenue - realEstateExpenses;

    const totalContractValue = projectsList.reduce((acc: number, p: any) => acc + Number(p.contract_value || 0), 0);

    const grandTotalRevenue = totalProjectReceipts + transportRevenue + realEstateRevenue;
    const grandTotalExpenses = totalProjectSiteCosts + transportExpenses + totalPayrollPaid;
    const grandNetProfit = grandTotalRevenue - grandTotalExpenses;

    return NextResponse.json({
      success: true,
      summary: {
        grandTotalRevenue,
        grandTotalExpenses,
        grandNetProfit,
        transportRevenue,
        transportExpenses,
        transportNet,
        generalReceipts: totalProjectReceipts,
        generalPayments: totalProjectSiteCosts,
        totalPayrollPaid,
        realEstateRevenue,
        realEstateExpenses,
        realEstateNet,
        totalContractValue,
        projectsCount: projectsList.length,
        employeesCount: employeesList.length
      },
      projects: enrichedProjects
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}