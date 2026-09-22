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

async function initInventoryTables() {
  try {
    // 1. جدول الأصناف والمواد بالمخزن المركزي
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255),
        item_name VARCHAR(255),
        category VARCHAR(100) NOT NULL DEFAULT 'مواد إنشائية وبناء',
        unit VARCHAR(50) NOT NULL DEFAULT 'طن',
        quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
        current_qty NUMERIC NOT NULL DEFAULT 0,
        unit_cost NUMERIC NOT NULL DEFAULT 0,
        selling_price NUMERIC NOT NULL DEFAULT 0,
        min_reorder_level NUMERIC NOT NULL DEFAULT 5,
        min_qty NUMERIC NOT NULL DEFAULT 5,
        location VARCHAR(100) DEFAULT 'المخزن المركزي الرئيسي - النجف',
        warehouse_location VARCHAR(100) DEFAULT 'المخزن المركزي الرئيسي - النجف',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quantity_on_hand NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS current_qty NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_reorder_level NUMERIC DEFAULT 5;`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_qty NUMERIC DEFAULT 5;`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS selling_price NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);`).catch(() => {});
    await query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(100);`).catch(() => {});

    // 2. جدول أذونات الحركات المخزنية
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        trans_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trans_code VARCHAR(50),
        item_id UUID REFERENCES inventory_items(item_id) ON DELETE CASCADE,
        trans_type VARCHAR(20) NOT NULL,
        purpose VARCHAR(50) NOT NULL DEFAULT 'PURCHASE',
        quantity NUMERIC NOT NULL DEFAULT 1,
        unit_price NUMERIC NOT NULL DEFAULT 0,
        total_amount NUMERIC NOT NULL DEFAULT 0,
        project_id UUID,
        project_name VARCHAR(255),
        supplier_or_recipient VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS trans_code VARCHAR(50);`).catch(() => {});
    await query(`ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) DEFAULT 'PURCHASE';`).catch(() => {});
    await query(`ALTER TABLE inventory_transactions ALTER COLUMN trans_code DROP NOT NULL;`).catch(() => {});
  } catch (e) {
    console.error("Init Inventory Tables Error:", e);
  }
}

export async function GET() {
  try {
    await initInventoryTables();

    const [itemsRes, transRes, projectsRes] = await Promise.all([
      query(`
        SELECT 
          item_id,
          item_code,
          COALESCE(NULLIF(name, ''), item_name, 'صنف') AS name,
          COALESCE(NULLIF(item_name, ''), name, 'صنف') AS item_name,
          category,
          unit,
          COALESCE(quantity_on_hand, current_qty, 0) AS quantity_on_hand,
          COALESCE(current_qty, quantity_on_hand, 0) AS current_qty,
          COALESCE(unit_cost, 0) AS unit_cost,
          COALESCE(selling_price, 0) AS selling_price,
          COALESCE(min_reorder_level, min_qty, 5) AS min_reorder_level,
          COALESCE(min_qty, min_reorder_level, 5) AS min_qty,
          COALESCE(location, warehouse_location, 'المخزن الرئيسي') AS location,
          notes,
          created_at
        FROM inventory_items 
        ORDER BY created_at DESC
      `),
      query(`
        SELECT 
          t.*, 
          COALESCE(t.trans_code, CONCAT('TR-', SUBSTRING(t.trans_id::text, 1, 8))) AS trans_code,
          COALESCE(NULLIF(i.name, ''), i.item_name, 'صنف') as item_name, 
          i.item_code, 
          i.unit
        FROM inventory_transactions t
        JOIN inventory_items i ON t.item_id = i.item_id
        ORDER BY t.created_at DESC
        LIMIT 300
      `),
      query(`SELECT project_id, project_name FROM projects ORDER BY project_name ASC`).catch(() => ({ rows: [] }))
    ]);

    const items = itemsRes.rows || [];
    const transactions = transRes.rows || [];
    const projects = projectsRes.rows || [];

    const totalItemsCount = items.length;
    const totalInventoryValue = items.reduce((acc, item) => {
      const qty = Number(item.quantity_on_hand) || 0;
      const cost = Number(item.unit_cost) || 0;
      return acc + (qty * cost);
    }, 0);

    const lowStockItems = items.filter(item => {
      const qty = Number(item.quantity_on_hand) || 0;
      const min = Number(item.min_reorder_level) || 5;
      return qty <= min;
    });

    return NextResponse.json({
      success: true,
      items,
      transactions,
      projects,
      summary: {
        totalItemsCount,
        totalInventoryValue,
        totalValuation: totalInventoryValue,
        lowStockCount: lowStockItems.length,
        lowStockItems
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initInventoryTables();
    const body = await req.json();
    const { action } = body;

    // 1. إضافة صنف جديد
    if (action === 'ADD_ITEM' || action === 'CREATE_ITEM') {
      const code = String(body.item_code || `ITM-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
      const finalName = body.name || body.item_name || 'مادة جديدة';
      const finalCategory = body.category || 'مواد إنشائية وبناء';
      const finalUnit = body.unit || 'طن';
      const finalQty = Number(body.quantity_on_hand ?? body.current_qty ?? body.initialQty ?? 0);
      const finalCost = Number(body.unit_cost) || 0;
      const finalSellingPrice = Number(body.selling_price) || 0;
      const finalMin = Number(body.min_reorder_level ?? body.min_qty ?? 5);
      const finalLocation = body.location || body.warehouse_location || 'المخزن المركزي الرئيسي - النجف';
      const finalNotes = body.notes || '';

      const res = await query(`
        INSERT INTO inventory_items (
          item_code, name, item_name, category, unit, 
          quantity_on_hand, current_qty, unit_cost, selling_price, 
          min_reorder_level, min_qty, location, warehouse_location, notes
        )
        VALUES ($1, $2, $2, $3, $4, $5, $5, $6, $7, $8, $8, $9, $9, $10)
        RETURNING *
      `, [
        code,
        finalName,
        finalCategory,
        finalUnit,
        finalQty,
        finalCost,
        finalSellingPrice,
        finalMin,
        finalLocation,
        finalNotes
      ]);

      // إشعار إضافة صنف جديد
      await logNotification(
        'INVENTORY',
        'ADD',
        'تعريف صنف جديد بالمخزن',
        `تم تعريف المادة (${finalName}) برمز (${code}) برصيد افتتاحي ${finalQty} ${finalUnit}`,
        '/inventory'
      );

      return NextResponse.json({ success: true, item: res.rows[0] });
    }

    // 2. تسجيل حركة مخزنية
    if (action === 'RECORD_TRANSACTION' || action === 'STOCK_TRANSACTION') {
      const { 
        item_id, 
        trans_type, 
        purpose, 
        is_external_sale, 
        quantity, 
        unit_price, 
        project_id, 
        project_name, 
        supplier_or_recipient, 
        notes 
      } = body;

      const numQty = Number(quantity) || 0;
      const numPrice = Number(unit_price) || 0;
      const totalAmount = numQty * numPrice;

      const itemRes = await query(`SELECT * FROM inventory_items WHERE item_id = $1`, [item_id]);
      if (itemRes.rows.length === 0) {
        return NextResponse.json({ error: 'المادة غير متوفرة في دليل المخزن' }, { status: 404 });
      }

      const currentItem = itemRes.rows[0];
      const matName = currentItem.name || currentItem.item_name || 'صنف';
      const currentQty = Number(currentItem.quantity_on_hand ?? currentItem.current_qty ?? 0);
      const currentCost = Number(currentItem.unit_cost) || 0;

      if (trans_type === 'OUT' && currentQty < numQty) {
        return NextResponse.json({ 
          error: `الرصيد المتاح بالمخزن (${currentQty} ${currentItem.unit}) غير كافٍ لصرف (${numQty} ${currentItem.unit})` 
        }, { status: 400 });
      }

      let finalPurpose = purpose;
      if (!finalPurpose) {
        if (trans_type === 'IN') finalPurpose = 'PURCHASE';
        else if (is_external_sale) finalPurpose = 'COMMERCIAL_SALE';
        else finalPurpose = 'PROJECT_ISSUE';
      }

      const transCode = `TR-${trans_type}-${Date.now().toString().slice(-6)}`;

      const transRes = await query(`
        INSERT INTO inventory_transactions (
          trans_code, item_id, trans_type, purpose, quantity, unit_price, total_amount, project_id, project_name, supplier_or_recipient, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        transCode,
        item_id,
        trans_type,
        finalPurpose,
        numQty,
        numPrice,
        totalAmount,
        project_id || null,
        project_name || '',
        supplier_or_recipient || '',
        notes || ''
      ]);

      let newQty = currentQty;
      let newCost = currentCost;

      if (trans_type === 'IN') {
        newQty = currentQty + numQty;
        const totalOldVal = currentQty * currentCost;
        const totalNewVal = numQty * numPrice;
        newCost = newQty > 0 ? Math.round((totalOldVal + totalNewVal) / newQty) : numPrice;
      } else {
        newQty = Math.max(0, currentQty - numQty);
      }

      await query(`
        UPDATE inventory_items
        SET quantity_on_hand = $1, current_qty = $1, unit_cost = $2
        WHERE item_id = $3
      `, [newQty, newCost, item_id]);

      // تنزيل التكلفة تلقائياً على مشروع المقاولة
      if (trans_type === 'OUT' && finalPurpose === 'PROJECT_ISSUE' && project_id) {
        await query(`
          INSERT INTO project_materials (
            project_id, material_name, unit, quantity_required, quantity_received, unit_price, supplier_name
          )
          VALUES ($1, $2, $3, $4, $4, $5, 'المخزن المركزي للشركة')
        `, [project_id, matName, currentItem.unit, numQty, numPrice]).catch(() => {});
      }

      // قيد السندات المالية بالصندوق تلقائياً
      if (trans_type === 'IN' && finalPurpose === 'PURCHASE' && totalAmount > 0) {
        const vNum = `V-INV-IN-${Date.now().toString().slice(-5)}`;
        const vNotes = JSON.stringify({
          sector: 'INVENTORY',
          partyAr: supplier_or_recipient || 'مجهز بضاعة',
          forReasonAr: `شراء وتوريد مخزني: ${numQty} ${currentItem.unit} ${matName}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, 'PAYMENT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
        `, [vNum, totalAmount, vNotes]).catch(() => {});
      } else if (trans_type === 'OUT' && finalPurpose === 'COMMERCIAL_SALE' && totalAmount > 0) {
        const vNum = `V-INV-OUT-${Date.now().toString().slice(-5)}`;
        const vNotes = JSON.stringify({
          sector: 'INVENTORY',
          partyAr: supplier_or_recipient || 'عميل تجاري',
          forReasonAr: `مبيعات تجارية مخزنية: ${numQty} ${currentItem.unit} ${matName}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, 'RECEIPT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
        `, [vNum, totalAmount, vNotes]).catch(() => {});
      }

      // تسجيل الإشعار الفوري بحسب نوع الحركة
      if (trans_type === 'IN') {
        await logNotification(
          'INVENTORY',
          'ADD',
          `توريد واستلام بضاعة (${matName})`,
          `تم استلام وتوريد كمية ${numQty} ${currentItem.unit} من (${matName}) للمخزن بمبلغ ${totalAmount.toLocaleString('en-US')} د.ع - المورد: ${supplier_or_recipient || 'مجهز عام'}`,
          '/inventory'
        );
      } else if (finalPurpose === 'PROJECT_ISSUE') {
        await logNotification(
          'INVENTORY',
          'UPDATE',
          `صرف مواد لمشروع مقاولة`,
          `تم صرف ${numQty} ${currentItem.unit} من (${matName}) إلى مشروع (${project_name || 'مشروع بالشركة'}) بمبلغ ${totalAmount.toLocaleString('en-US')} د.ع`,
          '/inventory'
        );
      } else {
        await logNotification(
          'INVENTORY',
          'UPDATE',
          `بيع تجاري خارجي`,
          `تم بيع ${numQty} ${currentItem.unit} من (${matName}) إلى (${supplier_or_recipient || 'عميل تجاري'}) بمبلغ ${totalAmount.toLocaleString('en-US')} د.ع`,
          '/inventory'
        );
      }

      return NextResponse.json({ success: true, transaction: transRes.rows[0], newQuantity: newQty });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('item_id') || searchParams.get('id');
    const transId = searchParams.get('trans_id');

    if (transId) {
      const transObj = await query(`SELECT * FROM inventory_transactions WHERE trans_id = $1`, [transId]);
      if (transObj.rows.length > 0) {
        const t = transObj.rows[0];
        const qty = Number(t.quantity) || 0;
        if (t.trans_type === 'IN') {
          await query(`
            UPDATE inventory_items 
            SET quantity_on_hand = GREATEST(0, quantity_on_hand - $1),
                current_qty = GREATEST(0, current_qty - $1)
            WHERE item_id = $2
          `, [qty, t.item_id]);
        } else {
          await query(`
            UPDATE inventory_items 
            SET quantity_on_hand = quantity_on_hand + $1,
                current_qty = current_qty + $1
            WHERE item_id = $2
          `, [qty, t.item_id]);
        }

        await logNotification(
          'INVENTORY',
          'DELETE',
          'إلغاء إذن مخزني',
          `تم حذف إذن الحركة رقم (${t.trans_code}) وعكس كمية ${qty} على رصيد الصنف`,
          '/inventory'
        );
      }
      await query(`DELETE FROM inventory_transactions WHERE trans_id = $1`, [transId]);
      return NextResponse.json({ success: true });
    }

    if (itemId) {
      const itemRow = await query(`SELECT name, item_name FROM inventory_items WHERE item_id = $1`, [itemId]);
      const iName = itemRow.rows[0]?.name || itemRow.rows[0]?.item_name || 'صنف';

      await query(`DELETE FROM inventory_items WHERE item_id = $1`, [itemId]);

      await logNotification(
        'INVENTORY',
        'DELETE',
        'حذف صنف من المخزن',
        `تم حذف الصنف (${iName}) وكافة سجلاته وحركاته من المخزن المركزي`,
        '/inventory'
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'معرف غير محدد للحذف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}