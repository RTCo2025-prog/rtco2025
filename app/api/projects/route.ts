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

async function initTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'IQD',
        start_date DATE DEFAULT CURRENT_DATE,
        expected_end_date DATE,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        completion_rate NUMERIC(5, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_milestones (
        milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        name VARCHAR(255) NOT NULL,
        completion_percentage NUMERIC(5, 2) DEFAULT 0,
        weight NUMERIC(5, 2) DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_subcontractors (
        subcontractor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        name VARCHAR(255) NOT NULL,
        trade VARCHAR(100) NOT NULL,
        contract_value NUMERIC(15, 2) DEFAULT 0,
        paid_amount NUMERIC(15, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_operating_expenses (
        expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(15, 2) DEFAULT 0,
        paid_amount NUMERIC(15, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_documents (
        doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        title VARCHAR(255) NOT NULL,
        doc_type VARCHAR(50) DEFAULT 'CONTRACT',
        file_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_materials (
        material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        material_name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) DEFAULT 'طن',
        quantity_required NUMERIC(12, 2) DEFAULT 0,
        quantity_received NUMERIC(12, 2) DEFAULT 0,
        unit_price NUMERIC(15, 2) DEFAULT 0,
        supplier_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_site_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        log_date DATE DEFAULT CURRENT_DATE,
        workers_count INTEGER DEFAULT 0,
        weather VARCHAR(50) DEFAULT 'صحو',
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_payment_terms (
        term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        term_title VARCHAR(255) NOT NULL,
        due_percentage NUMERIC(5, 2) DEFAULT 0,
        amount NUMERIC(15, 2) DEFAULT 0,
        target_milestone_rate NUMERIC(5, 2) DEFAULT 0,
        is_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS project_id UUID;
      ALTER TABLE project_subcontractors ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15, 2) DEFAULT 0;
      ALTER TABLE project_subcontractors ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15, 2) DEFAULT 0;
    `);
  } catch (e) {
    console.error('Table init error:', e);
  }
}

export async function GET() {
  try {
    await initTables();

    const [resP, mRes, sRes, dRes, matRes, logRes, termRes, expRes, vRes] = await Promise.all([
      query(`SELECT * FROM projects ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_milestones ORDER BY created_at ASC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_subcontractors ORDER BY created_at ASC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_documents ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_materials ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_site_logs ORDER BY log_date DESC, created_at DESC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_payment_terms ORDER BY target_milestone_rate ASC`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM project_operating_expenses ORDER BY created_at ASC`).catch(() => ({ rows: [] })),
      query(`
        SELECT 
          v.voucher_id, 
          v.voucher_number, 
          v.voucher_type, 
          v.status, 
          v.issue_date, 
          v.project_id::text AS v_proj_id, 
          v.notes, 
          COALESCE(SUM(jl.debit), 0) as calculated_amount 
        FROM vouchers v 
        LEFT JOIN journal_lines jl ON v.voucher_id = jl.voucher_id 
        WHERE v.status::text != 'VOID' 
        GROUP BY v.voucher_id, v.voucher_type, v.status, v.project_id, v.notes, v.issue_date, v.voucher_number
      `).catch(() => ({ rows: [] }))
    ]);

    const projectsList = resP.rows || [];
    const milestones = mRes.rows || [];
    const subs = sRes.rows || [];
    const docs = dRes.rows || [];
    const materials = matRes.rows || [];
    const logs = logRes.rows || [];
    const terms = termRes.rows || [];
    const operatingExpenses = expRes.rows || [];
    const vouchersList = vRes.rows || [];

    const clean = (t: string) => (t || '').trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ');

    const enriched = projectsList.map((p) => {
      const pId = String(p.project_id || '');
      const pName = clean(p.project_name);

      const projMilestones = milestones
        .filter((m) => String(m.project_id) === pId)
        .map((m) => {
          const mNameClean = clean(m.name);
          let milestoneActualPaid = 0;

          for (const v of vouchersList) {
            let amt = Number(v.calculated_amount) || 0;
            if (amt === 0 && v.notes) {
              try {
                const parsed = JSON.parse(v.notes);
                if (parsed.amount) amt = Number(parsed.amount);
              } catch {}
            }

            const vProjId = String(v.v_proj_id || '');
            const vNotes = clean(v.notes || '');

            const isMatchProject = (vProjId !== '' && vProjId === pId) || vNotes.includes(pName);
            const isMatchMilestone = mNameClean.length > 2 && vNotes.includes(mNameClean);

            if (isMatchProject && isMatchMilestone) {
              milestoneActualPaid += amt;
            }
          }

          return {
            ...m,
            actual_paid: milestoneActualPaid
          };
        });

      let totalWeightedProgress = 0;
      let totalWeight = 0;
      for (const m of projMilestones) {
        const w = Number(m.weight) || 0;
        const cp = Number(m.completion_percentage) || 0;
        totalWeightedProgress += cp * w;
        totalWeight += w;
      }
      const calculatedOverallRate = totalWeight > 0 ? Number((totalWeightedProgress / totalWeight).toFixed(2)) : Number(p.completion_rate || 0);

      let totalReceived = 0;
      let totalExpenses = 0;
      const matchedVouchers: any[] = [];

      for (const v of vouchersList) {
        let amt = Number(v.calculated_amount) || 0;
        if (amt === 0 && v.notes) {
          try {
            const parsed = JSON.parse(v.notes);
            if (parsed.amount) amt = Number(parsed.amount);
          } catch {}
        }

        const vProjId = String(v.v_proj_id || '');
        const vNotes = clean(v.notes || '');

        const isMatched = (vProjId !== '' && vProjId === pId) || (pName.length > 3 && vNotes.includes(pName));

        if (isMatched) {
          matchedVouchers.push({ ...v, amount: amt });
          if (v.voucher_type === 'RECEIPT') totalReceived += amt;
          if (v.voucher_type === 'PAYMENT') totalExpenses += amt;
        }
      }

      const projectSubs = subs.filter((s) => String(s.project_id) === pId).map((sub) => {
        let finalPaid = 0;
        const subIdStr = String(sub.subcontractor_id || '');

        for (const v of vouchersList) {
          if (v.voucher_type === 'PAYMENT') {
            let vNotesClean = clean(v.notes || '');
            let vSubId = '';
            let vAmt = Number(v.calculated_amount) || 0;

            try {
              const parsed = JSON.parse(v.notes || '{}');
              if (parsed.amount) vAmt = Number(parsed.amount);
              if (parsed.subcontractor_id) vSubId = String(parsed.subcontractor_id);
            } catch {}

            const vProjId = String(v.v_proj_id || '');
            const isSameProject = (vProjId === pId) || vNotesClean.includes(pName);
            const isIdMatch = subIdStr !== '' && (vSubId === subIdStr || vNotesClean.includes(subIdStr));

            if (isSameProject && isIdMatch) {
              finalPaid += vAmt;
            }
          }
        }

        const contractVal = Number(sub.contract_value) || 0;
        return {
          ...sub,
          paid_amount: finalPaid,
          remaining_amount: contractVal - finalPaid,
          payment_percentage: contractVal > 0 ? Math.min(100, Math.round((finalPaid / contractVal) * 100)) : 0,
          is_completed: finalPaid >= contractVal && contractVal > 0,
          notes: sub.notes || ''
        };
      });

      const projectTerms = terms.filter((t) => String(t.project_id) === pId).map((term) => {
        const tTitle = clean(term.term_title);
        const termIdStr = String(term.term_id || '');
        let actualVoucherPaid = 0;

        for (const v of vouchersList) {
          const vNotes = clean(v.notes || '');
          const vProjId = String(v.v_proj_id || '');
          const isProjectMatch = (vProjId === pId || vNotes.includes(pName));
          const isTermMatch = (termIdStr !== '' && vNotes.includes(termIdStr)) || (tTitle.length > 2 && vNotes.includes(tTitle));

          if (isProjectMatch && isTermMatch) {
            let amt = Number(v.calculated_amount) || 0;
            if (amt === 0 && v.notes) {
              try {
                const parsed = JSON.parse(v.notes);
                if (parsed.amount) amt = Number(parsed.amount);
              } catch {}
            }
            actualVoucherPaid += amt;
          }
        }

        const totalTermAmt = Number(term.amount) || 0;
        const paidFinal = term.is_paid ? totalTermAmt : Math.min(totalTermAmt, actualVoucherPaid);
        const remainTermAmt = Math.max(0, totalTermAmt - paidFinal);
        const termPct = totalTermAmt > 0 ? Math.min(100, Math.round((paidFinal / totalTermAmt) * 100)) : 0;

        return {
          ...term,
          is_paid: paidFinal >= totalTermAmt && totalTermAmt > 0,
          paidAmt: paidFinal,
          remainAmt: remainTermAmt,
          progressPct: termPct
        };
      });

      return {
        ...p,
        completion_rate: calculatedOverallRate,
        total_received: totalReceived,
        total_expenses: totalExpenses,
        total_site_costs: totalExpenses,
        vouchers: matchedVouchers,
        milestones: projMilestones,
        subcontractors: projectSubs,
        operating_expenses: operatingExpenses.filter((e) => String(e.project_id) === pId),
        documents: docs.filter((d) => String(d.project_id) === pId),
        materials: materials.filter((mat) => String(mat.project_id) === pId),
        site_logs: logs.filter((l) => String(l.project_id) === pId),
        payment_terms: projectTerms,
      };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error: any) {
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { action } = body;

    if (action === 'ADD_MILESTONE') {
      const { project_id, name, weight } = body;
      const res = await query(
        `INSERT INTO project_milestones (project_id, name, weight, completion_percentage) 
         VALUES ($1, $2, $3, 0) RETURNING *`,
        [project_id, name, weight || 10]
      );
      return NextResponse.json({ success: true, milestone: res.rows[0] });
    }

    if (action === 'ADD_SUBCONTRACTOR') {
      const { project_id, name, trade, contract_value, paid_amount, notes } = body;
      const res = await query(
        `INSERT INTO project_subcontractors (project_id, name, trade, contract_value, paid_amount, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [project_id, name, trade || 'أعمال عامة', Number(contract_value) || 0, Number(paid_amount) || 0, notes || '']
      );

      const projRes = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(project_id)]);
      const pName = projRes.rows[0]?.project_name || 'مشروع المقاولة';

      await logNotification(
        'PROJECTS',
        'ADD',
        `مقاول باطن جديد: ${name}`,
        `تم تسجيل مقاول باطن (${name} - ${trade}) لمشروع (${pName}) بقيمة عقد ${Number(contract_value).toLocaleString('en-US')} د.ع`,
        '/projects'
      );

      return NextResponse.json({ success: true, subcontractor: res.rows[0] });
    }

    if (action === 'ADD_OPERATING_EXPENSE') {
      const { project_id, title, category, amount, notes } = body;
      const res = await query(
        `INSERT INTO project_operating_expenses (project_id, title, category, amount, paid_amount, notes) 
         VALUES ($1, $2, $3, $4, 0, $5) RETURNING *`,
        [project_id, title, category || 'مصاريف تشغيلية', Number(amount) || 0, notes || '']
      );

      const projRes = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(project_id)]);
      const pName = projRes.rows[0]?.project_name || 'مشروع المقاولة';

      await logNotification(
        'PROJECTS',
        'ADD',
        `مصروف تشغيلي جديد: ${title}`,
        `تم تسجيل مصروف تشغيلي (${title} - ${category}) لمشروع (${pName}) بقيمة ${Number(amount).toLocaleString('en-US')} د.ع`,
        '/projects'
      );

      return NextResponse.json({ success: true, expense: res.rows[0] });
    }

    if (action === 'ADD_DOCUMENT') {
      const { project_id, title, file_url } = body;
      const res = await query(
        `INSERT INTO project_documents (project_id, title, doc_type, file_url) 
         VALUES ($1, $2, 'CONTRACT', $3) RETURNING *`,
        [project_id, title, file_url]
      );
      return NextResponse.json({ success: true, document: res.rows[0] });
    }

    if (action === 'ADD_MATERIAL') {
      const { project_id, material_name, unit, quantity_required, quantity_received, unit_price, supplier_name } = body;
      const res = await query(
        `INSERT INTO project_materials (project_id, material_name, unit, quantity_required, quantity_received, unit_price, supplier_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [project_id, material_name, unit || 'طن', Number(quantity_required) || 0, Number(quantity_received) || 0, Number(unit_price) || 0, supplier_name || '']
      );

      const projRes = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(project_id)]);
      const pName = projRes.rows[0]?.project_name || 'مشروع المقاولة';

      await logNotification(
        'PROJECTS',
        'ADD',
        `إدراج مادة وتوريد: ${material_name}`,
        `تم قيد توريد مادة (${material_name}) لمشروع (${pName}) بكمية ${quantity_received || quantity_required} ${unit || 'طن'}`,
        '/projects'
      );

      return NextResponse.json({ success: true, material: res.rows[0] });
    }

    if (action === 'ADD_SITE_LOG') {
      const { project_id, log_date, workers_count, weather, notes } = body;
      const res = await query(
        `INSERT INTO project_site_logs (project_id, log_date, workers_count, weather, notes) 
         VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5) RETURNING *`,
        [project_id, log_date || null, workers_count || 0, weather || 'صحو', notes || '']
      );
      return NextResponse.json({ success: true, log: res.rows[0] });
    }

    if (action === 'ADD_PAYMENT_TERM') {
      const { project_id, term_title, due_percentage, amount, target_milestone_rate } = body;
      const res = await query(
        `INSERT INTO project_payment_terms (project_id, term_title, due_percentage, amount, target_milestone_rate) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [project_id, term_title, due_percentage || 0, Number(amount) || 0, target_milestone_rate || 0]
      );

      const projRes = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(project_id)]);
      const pName = projRes.rows[0]?.project_name || 'المشروع';

      await logNotification(
        'PROJECTS',
        'ADD',
        `جدولة دفعة: ${term_title}`,
        `تمت جدولة دفعة بمبلغ ${Number(amount).toLocaleString('en-US')} د.ع لمشروع (${pName}) عند نسبة إنجاز ${target_milestone_rate}%`,
        '/projects'
      );

      return NextResponse.json({ success: true, term: res.rows[0] });
    }

    const { project_name, client_name, location, contract_value, currency = 'IQD', start_date, expected_end_date, completion_rate = 0, notes } = body;
    const res = await query(`
      INSERT INTO projects (project_name, client_name, location, contract_value, currency, start_date, expected_end_date, completion_rate, notes)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9) RETURNING *
    `, [project_name, client_name, location || 'النجف الأشرف', Number(contract_value) || 0, currency, start_date || null, expected_end_date || null, Number(completion_rate) || 0, notes || '']);

    await logNotification(
      'PROJECTS',
      'ADD',
      `مشروع مقاولة جديد: ${project_name}`,
      `تم تسجيل مشروع (${project_name}) للعميل (${client_name}) بقيمة عقد ${Number(contract_value).toLocaleString('en-US')} ${currency}`,
      '/projects'
    );

    return NextResponse.json({ success: true, project: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'UPDATE_MILESTONE_PROGRESS') {
      const { milestone_id, completion_percentage } = body;
      await query(
        `UPDATE project_milestones SET completion_percentage = $1 WHERE milestone_id::text = $2::text`,
        [completion_percentage, String(milestone_id)]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'TOGGLE_PAYMENT_TERM') {
      const { term_id, is_paid } = body;
      await query(
        `UPDATE project_payment_terms SET is_paid = $1 WHERE term_id::text = $2::text`,
        [is_paid, String(term_id)]
      );

      const termRes = await query(`SELECT term_title, amount, project_id FROM project_payment_terms WHERE term_id::text = $1::text`, [String(term_id)]);
      if (termRes.rows.length > 0 && is_paid) {
        const t = termRes.rows[0];
        const projRes = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(t.project_id)]);
        const pName = projRes.rows[0]?.project_name || 'مشروع';
        await logNotification(
          'PROJECTS',
          'UPDATE',
          `تحصيل دفعة: ${t.term_title}`,
          `تم تأكيد تحصيل دفعة (${t.term_title}) بمبلغ ${Number(t.amount).toLocaleString('en-US')} د.ع لمشروع (${pName})`,
          '/projects'
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE_MATERIAL_RECEIVED') {
      const { material_id, quantity_received, unit_price } = body;

      await query(`ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15, 2) DEFAULT 0;`);

      const res = await query(
        `UPDATE project_materials 
         SET quantity_received = $1,
             unit_price = CASE WHEN $2::numeric IS NOT NULL THEN $2::numeric ELSE unit_price END
         WHERE material_id::text = $3::text
         RETURNING *`,
        [Number(quantity_received) || 0, unit_price !== undefined && unit_price !== null ? Number(unit_price) : null, String(material_id)]
      );

      return NextResponse.json({ success: true, updated: res.rows[0] });
    }

    const { project_id, completion_rate, status } = body;
    if (project_id) {
      const oldProj = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(project_id)]);
      const pName = oldProj.rows[0]?.project_name || 'مشروع';

      await query(`
        UPDATE projects SET completion_rate = COALESCE($1, completion_rate), status = COALESCE($2, status)
        WHERE project_id::text = $3::text
      `, [completion_rate, status, String(project_id)]);

      await logNotification(
        'PROJECTS',
        'UPDATE',
        `تحديث إنجاز المشروع: ${pName}`,
        `تم تحديث نسبة الإنجاز الفعلي لمشروع (${pName}) إلى ${completion_rate}% (${status === 'COMPLETED' ? 'مكتمل ومسلم' : 'قيد التنفيذ'})`,
        '/projects'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. حذف مقاول الباطن بالمعرف الفردي الحصري وإلغاء السند المرتبط به دون تشويه الـ notes
    if (body.action === 'DELETE_SUBCONTRACTOR') {
      const subIdStr = String(body.subcontractor_id);
      const sRes = await query(`SELECT name FROM project_subcontractors WHERE subcontractor_id::text = $1`, [subIdStr]);
      const sName = sRes.rows[0]?.name || 'مقاول باطن';

      await query(`
        UPDATE vouchers 
        SET status = 'VOID'
        WHERE status::text != 'VOID'
          AND notes::text LIKE '%' || $1 || '%'
      `, [subIdStr]);

      await query(`DELETE FROM project_subcontractors WHERE subcontractor_id::text = $1`, [subIdStr]);

      await logNotification(
        'PROJECTS',
        'DELETE',
        `حذف مقاول باطن: ${sName}`,
        `تم حذف عقد مقاول الباطن وتحويل السند المالي المرتبط به مباشرة إلى حالة ملغي (VOID)`,
        '/projects'
      );
      return NextResponse.json({ success: true });
    }

    // 2. حذف المصروف التشغيلي الفردي بالمعرف الحصري
    if (body.action === 'DELETE_OPERATING_EXPENSE') {
      const expIdStr = String(body.expense_id);
      const eRes = await query(`SELECT title FROM project_operating_expenses WHERE expense_id::text = $1`, [expIdStr]);
      const eTitle = eRes.rows[0]?.title || 'مصروف تشغيلي';

      await query(`
        UPDATE vouchers 
        SET status = 'VOID'
        WHERE status::text != 'VOID'
          AND notes::text LIKE '%' || $1 || '%'
      `, [expIdStr]);

      await query(`DELETE FROM project_operating_expenses WHERE expense_id::text = $1`, [expIdStr]);

      await logNotification(
        'PROJECTS',
        'DELETE',
        `حذف مصروف تشغيلي: ${eTitle}`,
        `تم حذف بند المصروف التشغيلي وتحويل السند المرتبط به إلى حالة ملغي (VOID)`,
        '/projects'
      );
      return NextResponse.json({ success: true });
    }

    // 3. حذف مادة التوريد الفردية بالمعرف الحصري
    if (body.action === 'DELETE_MATERIAL') {
      const matIdStr = String(body.material_id);
      const mRes = await query(`SELECT material_name FROM project_materials WHERE material_id::text = $1`, [matIdStr]);
      const mName = mRes.rows[0]?.material_name || 'مادة توريد';

      await query(`
        UPDATE vouchers 
        SET status = 'VOID'
        WHERE status::text != 'VOID'
          AND notes::text LIKE '%' || $1 || '%'
      `, [matIdStr]);

      await query(`DELETE FROM project_materials WHERE material_id::text = $1`, [matIdStr]);

      await logNotification(
        'PROJECTS',
        'DELETE',
        `حذف مادة توريد: ${mName}`,
        `تم حذف سجل المادة وتحويل سند المورد المرتبط إلى حالة ملغي (VOID)`,
        '/projects'
      );
      return NextResponse.json({ success: true });
    }

    // 4. حذف دفعة تعاقدية بالمعرف الحصري
    if (body.action === 'DELETE_PAYMENT_TERM') {
      const termIdStr = String(body.term_id);
      const tRes = await query(`SELECT term_title, project_id FROM project_payment_terms WHERE term_id::text = $1`, [termIdStr]);
      const tTitle = tRes.rows[0]?.term_title || 'دفعة تعاقدية';
      const pId = tRes.rows[0]?.project_id ? String(tRes.rows[0].project_id) : '';

      await query(`
        UPDATE vouchers 
        SET status = 'VOID'
        WHERE status::text != 'VOID'
          AND voucher_type::text = 'RECEIPT'
          AND (
            notes::text LIKE '%' || $1 || '%'
            OR ($2 != '' AND notes::text LIKE '%' || $2 || '%' AND project_id::text = $3)
          )
      `, [termIdStr, tTitle, pId]);

      await query(`DELETE FROM project_payment_terms WHERE term_id::text = $1`, [termIdStr]);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'DELETE_MILESTONE') {
      await query(`DELETE FROM project_milestones WHERE milestone_id::text = $1::text`, [String(body.milestone_id)]);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'DELETE_SITE_LOG') {
      await query(`DELETE FROM project_site_logs WHERE log_id::text = $1::text`, [String(body.log_id)]);
      return NextResponse.json({ success: true });
    }

    // 5. حذف المشروع بالكامل مع تحويل سنداته إلى VOID
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('id');
    if (projectId) {
      const projRes = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(projectId)]);
      const pName = projRes.rows[0]?.project_name || 'مشروع';

      await query(`
        UPDATE vouchers 
        SET status = 'VOID'
        WHERE status::text != 'VOID'
          AND (project_id::text = $1::text OR notes LIKE '%' || $2 || '%')
      `, [String(projectId), pName]);

      await query(`DELETE FROM projects WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_milestones WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_subcontractors WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_operating_expenses WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_documents WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_materials WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_site_logs WHERE project_id::text = $1::text`, [String(projectId)]);
      await query(`DELETE FROM project_payment_terms WHERE project_id::text = $1::text`, [String(projectId)]);

      await logNotification(
        'PROJECTS',
        'DELETE',
        `حذف مشروع: ${pName}`,
        `تم حذف ملف المشروع الإنشائي (${pName}) وكافة سجلاته وتوريداته وإلغاء سنداته المالية نهائياً`,
        '/projects'
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'طلب غير معروف' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}