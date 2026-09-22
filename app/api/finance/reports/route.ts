import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // 1. جلب السندات المحاسبية المقيدة
    let voucherQuery = `
      SELECT 
        v.voucher_id,
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
      LEFT JOIN journal_lines jl ON v.voucher_id = jl.voucher_id
      WHERE v.status NOT IN ('VOID', 'CANCELLED')
    `;

    const vParams: any[] = [];
    if (startDate) {
      vParams.push(startDate);
      voucherQuery += ` AND v.issue_date >= $${vParams.length}`;
    }
    if (endDate) {
      vParams.push(endDate);
      voucherQuery += ` AND v.issue_date <= $${vParams.length}`;
    }

    voucherQuery += `
      GROUP BY v.voucher_id, v.voucher_number, v.voucher_type, v.currency, v.status, v.notes, v.issue_date, v.total_amount, v.amount, v.project_id
    `;

    const vouchersRes = await query(voucherQuery, vParams).catch(() => ({ rows: [] }));

    // 2. جلب أسطول النقل اللوجستي
    const [fleetTripsRes, fleetMaintRes] = await Promise.all([
      query(`SELECT COALESCE(SUM(trip_cost), 0) AS transport_revenue FROM fleet_trips WHERE trip_status = 'COMPLETED'`).catch(() => ({ rows: [{ transport_revenue: 0 }] })),
      query(`SELECT COALESCE(SUM(cost), 0) AS transport_expenses FROM fleet_maintenance_logs`).catch(() => ({ rows: [{ transport_expenses: 0 }] }))
    ]);

    // 3. جلب بيانات مشاريع المقاولات + المواد + مقاولي الباطن
    const [projRes, matRes, subsRes] = await Promise.all([
      query(`SELECT * FROM projects ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_materials`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_subcontractors`).catch(() => ({ rows: [] }))
    ]);

    // 4. جلب بيانات الموارد البشرية ومسير الرواتب المعتمد
    const [payrollRunsRes, employeesRes] = await Promise.all([
      query(`SELECT * FROM hr_payroll_runs ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM hr_employees WHERE status = 'ACTIVE'`).catch(() => ({ rows: [] }))
    ]);

    // 5. جلب بيانات العقارات والاستثمار
    const [realEstateUnitsRes, realEstateContractsRes] = await Promise.all([
      query(`SELECT * FROM real_estate_units`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM real_estate_contracts`).catch(() => ({ rows: [] }))
    ]);

    const vouchersList = vouchersRes.rows || [];
    const projectsList = projRes.rows || [];
    const materialsList = matRes.rows || [];
    const subsList = subsRes.rows || [];
    const payrollRunsList = payrollRunsRes.rows || [];
    const employeesList = employeesRes.rows || [];
    const realEstateContracts = realEstateContractsRes.rows || [];

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
    const realEstateRevenue = realEstateContracts.reduce((acc: number, c: any) => acc + Number(c.total_amount || c.amount || 0), 0);
    const realEstateExpenses = 0; // أو أي مصاريف مسندة في حال إدراجها
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