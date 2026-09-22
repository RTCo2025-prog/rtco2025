import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initSystemGovernanceTables() {
  try {
    // 1. جدول الفترات المالية المقفلة
    await query(`
      CREATE TABLE IF NOT EXISTS closed_periods (
        period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_month VARCHAR(7) UNIQUE NOT NULL,
        closed_by VARCHAR(255) NOT NULL,
        closure_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. جدول سجل التدقيق الرقابي العام
    await query(`
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(100) DEFAULT 'موظف',
        action_type VARCHAR(50) NOT NULL,
        sector VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. جدول الكتب والمخاطبات الرسمية الصادرة والواردة
    await query(`
      CREATE TABLE IF NOT EXISTS official_documents (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(50) DEFAULT 'NORMAL',
        status VARCHAR(50) DEFAULT 'COMPLETED',
        doc_number VARCHAR(100) NOT NULL,
        doc_date DATE NOT NULL,
        sender_doc_number VARCHAR(100),
        sender_doc_date DATE,
        party_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT,
        attachments TEXT,
        carbon_copy TEXT,
        signatory_title VARCHAR(100),
        signatory_name VARCHAR(100),
        main_letter_url TEXT,
        scanned_file_urls JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. جدول العقود الإلكترونية
    await query(`
      CREATE TABLE IF NOT EXISTS electronic_contracts (
        id VARCHAR(100) PRIMARY KEY,
        contract_type VARCHAR(50) NOT NULL,
        contract_number VARCHAR(100) NOT NULL,
        contract_date DATE NOT NULL,
        seller_name VARCHAR(255) NOT NULL,
        buyer_name VARCHAR(255) NOT NULL,
        item_description TEXT NOT NULL,
        price NUMERIC(15, 2) DEFAULT 0,
        paid_amount NUMERIC(15, 2) DEFAULT 0,
        remaining_amount NUMERIC(15, 2) DEFAULT 0,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. جدول المبيعات بالأقساط المدمجة
    await query(`
      CREATE TABLE IF NOT EXISTS installment_contracts (
        id VARCHAR(100) PRIMARY KEY,
        customer_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        customer_id_card VARCHAR(100),
        customer_address TEXT,
        items JSONB DEFAULT '[]'::jsonb,
        goods_description TEXT,
        cash_price NUMERIC(15, 2) DEFAULT 0,
        profit_rate NUMERIC(5, 2) DEFAULT 0,
        total_installment_price NUMERIC(15, 2) DEFAULT 0,
        down_payment NUMERIC(15, 2) DEFAULT 0,
        remaining_balance NUMERIC(15, 2) DEFAULT 0,
        total_paid NUMERIC(15, 2) DEFAULT 0,
        months_count INT DEFAULT 1,
        monthly_installment NUMERIC(15, 2) DEFAULT 0,
        start_date DATE NOT NULL,
        guarantor_name VARCHAR(255),
        guarantor_phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        installments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error("Init System Governance Tables Error:", e);
  }
}

export async function GET(req: Request) {
  try {
    await initSystemGovernanceTables();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // تصدير وتنزيل النسخة الاحتياطية الشاملة
    if (action === 'BACKUP_DATABASE') {
      const [
        branches,
        projects,
        vehicles,
        trips,
        maintenance,
        items,
        transactions,
        units,
        employees,
        payrollRuns,
        adjustments,
        leaves,
        vouchers,
        auditLogs,
        closedPeriods,
        officialDocs,
        contracts,
        installments
      ] = await Promise.all([
        query(`SELECT * FROM branches`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM projects`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM fleet_vehicles`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM fleet_trips`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM fleet_maintenance`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM inventory_items`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM inventory_transactions`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM real_estate_units`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM employees`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM payroll_runs`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM hr_adjustments`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM employee_leaves`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM financial_vouchers`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM system_audit_logs`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM closed_periods`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM official_documents`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM electronic_contracts`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM installment_contracts`).catch(() => ({ rows: [] }))
      ]);

      const backupPackage = {
        company: 'شركة البرج المتألق للتجارة العامة والمقاولات والنقل والعقارات',
        system: 'RTCO Enterprise ERP System',
        backup_date: new Date().toISOString(),
        version: 'v2.5 Full Cloud Backup',
        data: {
          branches: branches.rows,
          projects: projects.rows,
          fleet: {
            vehicles: vehicles.rows,
            trips: trips.rows,
            maintenance: maintenance.rows
          },
          inventory: {
            items: items.rows,
            transactions: transactions.rows
          },
          real_estate: units.rows,
          human_resources: {
            employees: employees.rows,
            payroll_runs: payrollRuns.rows,
            adjustments: adjustments.rows,
            leaves: leaves.rows
          },
          financial_vouchers: vouchers.rows,
          official_documents: officialDocs.rows,
          electronic_contracts: contracts.rows,
          installment_contracts: installments.rows,
          governance: {
            closed_periods: closedPeriods.rows,
            audit_logs: auditLogs.rows
          }
        }
      };

      const jsonStr = JSON.stringify(backupPackage, null, 2);
      const filename = `RTCO_Backup_Complete_${new Date().toISOString().substring(0, 10)}.json`;

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    const [auditRes, periodsRes] = await Promise.all([
      query(`SELECT * FROM system_audit_logs ORDER BY created_at DESC LIMIT 100`),
      query(`SELECT * FROM closed_periods ORDER BY period_month DESC`)
    ]);

    return NextResponse.json({
      success: true,
      auditLogs: auditRes.rows || [],
      closedPeriods: periodsRes.rows || []
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initSystemGovernanceTables();
    const body = await req.json();
    const { action } = body;

    // 1. استعادة ورفع النسخة الاحتياطية الشاملة
    if (action === 'RESTORE_DATABASE') {
      const { backupData, restored_by } = body;
      if (!backupData || !backupData.data) {
        return NextResponse.json({ success: false, error: 'الملف غير صالح أو لا يحتوي على بنية صحيحة' }, { status: 400 });
      }

      const d = backupData.data;

      // الفروع
      if (Array.isArray(d.branches) && d.branches.length > 0) {
        for (const b of d.branches) {
          await query(`
            INSERT INTO branches (branch_id, branch_code, name_ar, sector, city, address, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (branch_id) DO UPDATE SET name_ar = EXCLUDED.name_ar, phone = EXCLUDED.phone
          `, [b.branch_id, b.branch_code, b.name_ar, b.sector, b.city, b.address, b.phone]).catch(console.error);
        }
      }

      // المشاريع
      if (Array.isArray(d.projects) && d.projects.length > 0) {
        for (const p of d.projects) {
          await query(`
            INSERT INTO projects (project_id, project_name, client_name, contract_value, completion_rate, status, materials, subcontractors, operating_expenses)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (project_id) DO UPDATE SET project_name = EXCLUDED.project_name, contract_value = EXCLUDED.contract_value
          `, [p.project_id, p.project_name, p.client_name, p.contract_value, p.completion_rate, p.status, JSON.stringify(p.materials || []), JSON.stringify(p.subcontractors || []), JSON.stringify(p.operating_expenses || [])]).catch(console.error);
        }
      }

      // أسطول النقل
      if (d.fleet) {
        if (Array.isArray(d.fleet.vehicles)) {
          for (const v of d.fleet.vehicles) {
            await query(`
              INSERT INTO fleet_vehicles (vehicle_id, plate_number, make_model, year, vehicle_type, status)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (vehicle_id) DO NOTHING
            `, [v.vehicle_id, v.plate_number, v.make_model, v.year, v.vehicle_type, v.status]).catch(console.error);
          }
        }
        if (Array.isArray(d.fleet.trips)) {
          for (const t of d.fleet.trips) {
            await query(`
              INSERT INTO fleet_trips (trip_id, vehicle_id, driver_name, trip_status, trip_cost, departure_time)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (trip_id) DO NOTHING
            `, [t.trip_id, t.vehicle_id, t.driver_name, t.trip_status, t.trip_cost, t.departure_time]).catch(console.error);
          }
        }
      }

      // المخزن والتجارة
      if (d.inventory) {
        if (Array.isArray(d.inventory.items)) {
          for (const it of d.inventory.items) {
            await query(`
              INSERT INTO inventory_items (item_id, item_code, name, category, unit, quantity_on_hand, unit_cost, selling_price)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (item_id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand
            `, [it.item_id, it.item_code, it.name, it.category, it.unit, it.quantity_on_hand, it.unit_cost, it.selling_price]).catch(console.error);
          }
        }
        if (Array.isArray(d.inventory.transactions)) {
          for (const tr of d.inventory.transactions) {
            await query(`
              INSERT INTO inventory_transactions (trans_id, item_id, trans_type, purpose, quantity, unit_price, total_amount, project_name, supplier_or_recipient, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (trans_id) DO NOTHING
            `, [tr.trans_id, tr.item_id, tr.trans_type, tr.purpose, tr.quantity, tr.unit_price, tr.total_amount, tr.project_name, tr.supplier_or_recipient, tr.created_at]).catch(console.error);
          }
        }
      }

      // الموارد البشرية
      if (d.human_resources && Array.isArray(d.human_resources.employees)) {
        for (const emp of d.human_resources.employees) {
          await query(`
            INSERT INTO employees (employee_id, emp_code, full_name, job_title, department, base_salary, allowances, phone, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (employee_id) DO UPDATE SET full_name = EXCLUDED.full_name, base_salary = EXCLUDED.base_salary
          `, [emp.employee_id, emp.emp_code, emp.full_name, emp.job_title, emp.department, emp.base_salary, emp.allowances, emp.phone, emp.status]).catch(console.error);
        }
      }

      // السندات المالية
      if (Array.isArray(d.financial_vouchers)) {
        for (const v of d.financial_vouchers) {
          await query(`
            INSERT INTO financial_vouchers (voucher_id, voucher_no, voucher_type, amount, total_amount, party_name, project_name, notes, issue_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (voucher_id) DO NOTHING
          `, [v.voucher_id, v.voucher_no, v.voucher_type, v.amount, v.total_amount, v.party_name, v.project_name, v.notes, v.issue_date, v.status]).catch(console.error);
        }
      }

      // الكتب الرسمية
      if (Array.isArray(d.official_documents)) {
        for (const doc of d.official_documents) {
          await query(`
            INSERT INTO official_documents (id, type, priority, status, doc_number, doc_date, sender_doc_number, sender_doc_date, party_name, subject, content, attachments, carbon_copy, signatory_title, signatory_name, main_letter_url, scanned_file_urls, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO NOTHING
          `, [doc.id, doc.type, doc.priority, doc.status, doc.doc_number, doc.doc_date, doc.sender_doc_number, doc.sender_doc_date, doc.party_name, doc.subject, doc.content, doc.attachments, doc.carbon_copy, doc.signatory_title, doc.signatory_name, doc.main_letter_url, JSON.stringify(doc.scanned_file_urls || []), doc.notes]).catch(console.error);
        }
      }

      // العقود الإلكترونية
      if (Array.isArray(d.electronic_contracts)) {
        for (const c of d.electronic_contracts) {
          await query(`
            INSERT INTO electronic_contracts (id, contract_type, contract_number, contract_date, seller_name, buyer_name, item_description, price, paid_amount, remaining_amount, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO NOTHING
          `, [c.id, c.contract_type, c.contract_number, c.contract_date, c.seller_name, c.buyer_name, c.item_description, c.price, c.paid_amount, c.remaining_amount, JSON.stringify(c.details || {})]).catch(console.error);
        }
      }

      // الأقساط
      if (Array.isArray(d.installment_contracts)) {
        for (const inst of d.installment_contracts) {
          await query(`
            INSERT INTO installment_contracts (id, customer_type, customer_name, customer_phone, customer_id_card, customer_address, items, goods_description, cash_price, profit_rate, total_installment_price, down_payment, remaining_balance, total_paid, months_count, monthly_installment, start_date, guarantor_name, guarantor_phone, status, installments)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (id) DO NOTHING
          `, [inst.id, inst.customer_type, inst.customer_name, inst.customer_phone, inst.customer_id_card, inst.customer_address, JSON.stringify(inst.items || []), inst.goods_description, inst.cash_price, inst.profit_rate, inst.total_installment_price, inst.down_payment, inst.remaining_balance, inst.total_paid, inst.months_count, inst.monthly_installment, inst.start_date, inst.guarantor_name, inst.guarantor_phone, inst.status, JSON.stringify(inst.installments || [])]).catch(console.error);
        }
      }

      await query(`
        INSERT INTO system_audit_logs (user_name, user_role, action_type, sector, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [restored_by || 'المدير المفوض', 'ADMIN', 'RESTORE', 'SYSTEM', `تم استعادة النسخة الاحتياطية المؤرخة (${backupData.backup_date || new Date().toISOString()}) بنجاح`]);

      return NextResponse.json({ success: true, message: 'تمت استعادة النسخة الاحتياطية بنجاح' });
    }

    // 2. إقفال فترة مالية
    if (action === 'CLOSE_PERIOD') {
      const { period_month, closed_by, closure_notes } = body;
      if (!period_month) {
        return NextResponse.json({ success: false, error: 'يرجى تحديد الشهر للإقفال' }, { status: 400 });
      }

      await query(
        `INSERT INTO closed_periods (period_month, closed_by, closure_notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (period_month) DO UPDATE 
         SET closed_by = EXCLUDED.closed_by, closure_notes = EXCLUDED.closure_notes, created_at = CURRENT_TIMESTAMP`,
        [period_month, closed_by || 'الإدارة العليا', closure_notes || 'إقفال مالي وتدقيق شامل لكافة القطاعات']
      );

      await query(
        `INSERT INTO system_audit_logs (user_name, user_role, action_type, sector, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [closed_by || 'المدير المفوض', 'ADMIN', 'LOCK', 'FINANCE', `تم تجميد وإقفال الفترة المالية لشهر (${period_month})`]
      );

      return NextResponse.json({ success: true, message: `تم إقفال شهر ${period_month} بنجاح` });
    }

    // 3. إعادة فتح فترة مالية
    if (action === 'REOPEN_PERIOD') {
      const { period_month, opened_by, reason } = body;
      await query(`DELETE FROM closed_periods WHERE period_month = $1`, [period_month]);

      await query(
        `INSERT INTO system_audit_logs (user_name, user_role, action_type, sector, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [opened_by || 'المدير المفوض', 'ADMIN', 'UNLOCK', 'FINANCE', `تمت إعادة فتح شهر (${period_month}) بالسبب: ${reason || 'مراجعة وتدقيق'}`]
      );

      return NextResponse.json({ success: true, message: `تمت إعادة فتح شهر ${period_month}` });
    }

    // 4. مزامنة الكتب الرسمية
    if (action === 'SYNC_OFFICIAL_DOC') {
      const { doc } = body;
      await query(
        `INSERT INTO official_documents 
         (id, type, priority, status, doc_number, doc_date, sender_doc_number, sender_doc_date, party_name, subject, content, attachments, carbon_copy, signatory_title, signatory_name, main_letter_url, scanned_file_urls, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET
         doc_number = EXCLUDED.doc_number, party_name = EXCLUDED.party_name, subject = EXCLUDED.subject`,
        [
          doc.id, doc.type, doc.priority, doc.status, doc.docNumber, doc.docDate,
          doc.senderDocNumber || null, doc.senderDocDate || null, doc.partyName, doc.subject,
          doc.content || '', doc.attachments || '', doc.carbonCopy || '', doc.signatoryTitle || '',
          doc.signatoryName || '', doc.mainLetterUrl || '', JSON.stringify(doc.scannedFileUrls || []), doc.notes || ''
        ]
      );
      return NextResponse.json({ success: true });
    }

    // 5. مزامنة العقود
    if (action === 'SYNC_CONTRACT') {
      const { contract } = body;
      await query(
        `INSERT INTO electronic_contracts 
         (id, contract_type, contract_number, contract_date, seller_name, buyer_name, item_description, price, paid_amount, remaining_amount, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
         seller_name = EXCLUDED.seller_name, buyer_name = EXCLUDED.buyer_name, price = EXCLUDED.price`,
        [
          contract.id, contract.contractType, contract.contractNumber, contract.contractDate,
          contract.sellerName, contract.buyerName, contract.itemDescription,
          contract.price || 0, contract.paidAmount || 0, contract.remainingAmount || 0,
          JSON.stringify(contract.details || {})
        ]
      );
      return NextResponse.json({ success: true });
    }

    // 6. مزامنة الأقساط
    if (action === 'SYNC_INSTALLMENT') {
      const { plan } = body;
      await query(
        `INSERT INTO installment_contracts 
         (id, customer_type, customer_name, customer_phone, customer_id_card, customer_address, items, goods_description, cash_price, profit_rate, total_installment_price, down_payment, remaining_balance, total_paid, months_count, monthly_installment, start_date, guarantor_name, guarantor_phone, status, installments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (id) DO UPDATE SET
         remaining_balance = EXCLUDED.remaining_balance, total_paid = EXCLUDED.total_paid, status = EXCLUDED.status, installments = EXCLUDED.installments`,
        [
          plan.id, plan.customerType, plan.customerName, plan.customerPhone, plan.customerIdCard,
          plan.customerAddress, JSON.stringify(plan.items || []), plan.goodsDescription,
          plan.cashPrice || 0, plan.profitRate || 0, plan.totalInstallmentPrice || 0,
          plan.downPayment || 0, plan.remainingBalance || 0, plan.totalPaid || 0,
          plan.monthsCount || 1, plan.monthlyInstallment || 0, plan.startDate,
          plan.guarantorName, plan.guarantorPhone, plan.status || 'ACTIVE', JSON.stringify(plan.installments || [])
        ]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}