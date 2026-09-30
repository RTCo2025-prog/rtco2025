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

async function initRealEstateTables() {
  // 1. إنشاء جدول الوحدات إذا لم يكن موجوداً
  await query(`
    CREATE TABLE IF NOT EXISTS real_estate_units (
      unit_id VARCHAR(50) PRIMARY KEY,
      unit_code VARCHAR(50),
      title VARCHAR(255),
      unit_name VARCHAR(255),
      property_type VARCHAR(100) DEFAULT 'شقة سكنية',
      unit_type VARCHAR(100) DEFAULT 'شقة سكنية',
      area_sqm NUMERIC DEFAULT 0,
      area NUMERIC DEFAULT 0,
      price NUMERIC DEFAULT 0,
      base_price NUMERIC DEFAULT 0,
      city VARCHAR(100) DEFAULT 'النجف الأشرف',
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'AVAILABLE',
      buyer_name VARCHAR(150),
      buyer_phone VARCHAR(50),
      total_paid NUMERIC DEFAULT 0,
      total_remaining NUMERIC DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. تحديث وإضافة الأعمدة إن كان الجدول قديماً
  await query(`
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS unit_code VARCHAR(50);
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS property_type VARCHAR(100) DEFAULT 'شقة سكنية';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS unit_type VARCHAR(100) DEFAULT 'شقة سكنية';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS area_sqm NUMERIC DEFAULT 0;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS area NUMERIC DEFAULT 0;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'النجف الأشرف';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS location VARCHAR(255);
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'AVAILABLE';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(150);
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(50);
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS total_remaining NUMERIC DEFAULT 0;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  // 3. فك قيود NOT NULL عن الأعمدة السابقة لتجنب أي تعارض
  await query(`
    DO $$ 
    BEGIN 
      BEGIN
        ALTER TABLE real_estate_units ALTER COLUMN unit_type DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      BEGIN
        ALTER TABLE real_estate_units ALTER COLUMN base_price DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      BEGIN
        ALTER TABLE real_estate_units ALTER COLUMN unit_name DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      BEGIN
        ALTER TABLE real_estate_units ALTER COLUMN area DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END $$;
  `);

  // 4. جدول الأقساط
  await query(`
    CREATE TABLE IF NOT EXISTS real_estate_installments (
      installment_id VARCHAR(50) PRIMARY KEY,
      unit_id VARCHAR(50),
      installment_title VARCHAR(150) NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      due_date DATE,
      is_paid BOOLEAN DEFAULT FALSE,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function GET() {
  try {
    await initRealEstateTables();

    const [unitsRes, instRes] = await Promise.all([
      query(`SELECT *, unit_id::text AS unit_id FROM real_estate_units ORDER BY created_at DESC`),
      query(`SELECT *, installment_id::text AS installment_id, unit_id::text AS unit_id FROM real_estate_installments ORDER BY due_date ASC`)
    ]);

    const units = unitsRes.rows || [];
    const installments = instRes.rows || [];

    const enrichedUnits = units.map((u: any) => {
      const uInst = installments.filter((i: any) => String(i.unit_id) === String(u.unit_id));
      const totalPaid = uInst.filter((i: any) => i.is_paid).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
      const totalRemaining = uInst.filter((i: any) => !i.is_paid).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

      return {
        ...u,
        title: u.title || u.unit_name || 'وحدة عقارية',
        property_type: u.property_type || u.unit_type || 'شقة سكنية',
        area_sqm: u.area_sqm || u.area || 0,
        price: u.price || u.base_price || 0,
        installments: uInst,
        totalPaid: totalPaid || Number(u.total_paid || 0),
        totalRemaining: totalRemaining || Number(u.total_remaining || 0)
      };
    });

    return NextResponse.json({ success: true, units: enrichedUnits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initRealEstateTables();
    const body = await req.json();
    const { action } = body;

    // 1. إضافة وحدة عقارية جديدة
    if (action === 'ADD_UNIT') {
      const { unit_id, id, unit_code, title, property_type, area_sqm, price, city, location, notes } = body;
      const finalUnitId = String(unit_id || id || `UNT-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      const code = String(unit_code || `UNIT-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
      const selectedType = property_type || 'شقة سكنية';
      const numPrice = Number(price) || 0;
      const numArea = Number(area_sqm) || 0;
      const unitTitle = title || 'وحدة جديدة';

      const res = await query(`
        INSERT INTO real_estate_units (
          unit_id,
          unit_code, 
          title, 
          unit_name,
          property_type, 
          unit_type, 
          area_sqm, 
          area,
          price, 
          base_price,
          city, 
          location, 
          notes, 
          status,
          total_paid,
          total_remaining
        )
        VALUES ($1, $2, $3, $3, $4, $4, $5, $5, $6, $6, $7, $8, $9, 'AVAILABLE', 0, $6)
        RETURNING *
      `, [
        finalUnitId,
        code,
        unitTitle,
        selectedType,
        numArea,
        numPrice,
        city || 'النجف الأشرف',
        location || 'شارع الكوفة',
        notes || ''
      ]);

      await logNotification(
        'REAL_ESTATE',
        'ADD',
        `إدراج وحدة عقارية: ${unitTitle}`,
        `تم إضافة وحدة عقارية (${unitTitle} - ${selectedType}) برمز (${code}) بمساحة ${numArea} م² وسعر ${numPrice.toLocaleString('en-US')} د.ع في (${location || city || 'النجف'})`,
        '/real-estate'
      );

      return NextResponse.json({ success: true, unit: res.rows[0] });
    }

    // 2. حجز أو بيع وحدة وتقسيم الأقساط
    if (action === 'SELL_UNIT') {
      const { unit_id, buyer_name, buyer_phone, down_payment, installments_count, total_price } = body;

      const downPay = Number(down_payment) || 0;
      const tPrice = Number(total_price) || 0;
      const remainingPrice = Math.max(0, tPrice - downPay);
      const count = Math.max(1, Number(installments_count) || 1);
      const instAmount = Math.round(remainingPrice / count);

      await query(`
        UPDATE real_estate_units
        SET status = 'SOLD',
            buyer_name = $1,
            buyer_phone = $2,
            total_paid = $3,
            total_remaining = $4
        WHERE unit_id::text = $5::text
      `, [buyer_name, buyer_phone, downPay, remainingPrice, String(unit_id)]);

      // حذف أي أقساط سابقة إن وجدت لتجنب التكرار
      await query(`DELETE FROM real_estate_installments WHERE unit_id::text = $1::text`, [String(unit_id)]);

      // قيد الدفعة الأولى (المقدمة) إن وجدت
      if (downPay > 0) {
        const firstInstId = `INST-DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await query(`
          INSERT INTO real_estate_installments (installment_id, unit_id, installment_title, amount, due_date, is_paid, paid_at)
          VALUES ($1, $2, 'الدفعة الأولى (المقدمة)', $3, CURRENT_DATE, TRUE, CURRENT_TIMESTAMP)
        `, [firstInstId, String(unit_id), downPay]);

        try {
          const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const vNum = `V-EST-${Date.now().toString().slice(-5)}`;
          const voucherNotes = JSON.stringify({
            sector: 'REAL_ESTATE',
            partyAr: buyer_name,
            forReasonAr: `دفعة مقدمة لشراء وحدة عقارية`,
            method: 'CASH'
          });

          await query(`
            INSERT INTO vouchers (voucher_id, voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, $2, 'RECEIPT', $3, $3, $4, 'POSTED', CURRENT_DATE)
          `, [vId, vNum, downPay, voucherNotes]);
        } catch (vErr) {
          console.error('Voucher creation notice:', vErr);
        }
      }

      // جدولة الأقساط الشهرية بطريقة حساب تواريخ آمنة متوافقة مع كل نسخ PostgreSQL
      const baseDate = new Date();
      for (let i = 1; i <= count; i++) {
        const instId = `INST-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const dueDateStr = dueDate.toISOString().substring(0, 10);

        await query(`
          INSERT INTO real_estate_installments (installment_id, unit_id, installment_title, amount, due_date, is_paid)
          VALUES ($1, $2, $3, $4::date, FALSE)
        `, [instId, String(unit_id), `القسط الشهري رقم (${i})`, instAmount, dueDateStr]);
      }

      const unitInfo = await query(`SELECT title, unit_name, unit_code FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unit_id)]);
      const uName = unitInfo.rows[0]?.title || unitInfo.rows[0]?.unit_name || unitInfo.rows[0]?.unit_code || 'وحدة عقارية';

      await logNotification(
        'REAL_ESTATE',
        'UPDATE',
        `تثبيت بيع وحدة: ${uName}`,
        `تم تثبيت بيع (${uName}) للمشتري (${buyer_name}) بمبلغ إجمالي ${tPrice.toLocaleString('en-US')} د.ع (مقدمة: ${downPay.toLocaleString('en-US')} د.ع مقسطة على ${count} أشهر)`,
        '/real-estate'
      );

      return NextResponse.json({ success: true, message: 'تم تثبيت البيع وجدولة الأقساط بنجاح' });
    }

    // 3. تسديد قسط شهري
    if (action === 'PAY_INSTALLMENT') {
      const { installment_id, unit_id, amount, buyer_name, installment_title } = body;

      await query(`
        UPDATE real_estate_installments
        SET is_paid = TRUE,
            paid_at = CURRENT_TIMESTAMP
        WHERE installment_id::text = $1::text
      `, [String(installment_id)]);

      // تحديث إجمالي المدفوع والمتبقي على الوحدة العقارية
      if (unit_id) {
        await query(`
          UPDATE real_estate_units
          SET total_paid = COALESCE(total_paid, 0) + $1,
              total_remaining = GREATEST(0, COALESCE(total_remaining, 0) - $1)
          WHERE unit_id::text = $2::text
        `, [Number(amount) || 0, String(unit_id)]);
      }

      try {
        const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const vNum = `V-INST-${Date.now().toString().slice(-5)}`;
        const voucherNotes = JSON.stringify({
          sector: 'REAL_ESTATE',
          partyAr: buyer_name || 'مشتري الوحدة العقارية',
          forReasonAr: `سداد ${installment_title || 'قسط عقاري'}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_id, voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, $2, 'RECEIPT', $3, $3, $4, 'POSTED', CURRENT_DATE)
        `, [vId, vNum, Number(amount) || 0, voucherNotes]);
      } catch (vErr) {
        console.error('Voucher creation notice:', vErr);
      }

      await logNotification(
        'REAL_ESTATE',
        'UPDATE',
        `تسديد قسط عقاري: ${installment_title || 'قسط'}`,
        `تم تحصيل وتسديد (${installment_title || 'قسط عقاري'}) بمبلغ ${Number(amount || 0).toLocaleString('en-US')} د.ع من (${buyer_name || 'المشتري'}) وتوليد وصل قبض في الصندوق`,
        '/real-estate'
      );

      return NextResponse.json({ success: true, message: 'تم تسديد القسط بنجاح' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    console.error('Real Estate API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('id');

    if (!unitId) {
      return NextResponse.json({ error: 'معرف الوحدة مطلوب' }, { status: 400 });
    }

    const unitInfo = await query(`SELECT title, unit_name, unit_code FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unitId)]);
    const uName = unitInfo.rows[0]?.title || unitInfo.rows[0]?.unit_name || unitInfo.rows[0]?.unit_code || 'وحدة عقارية';

    await query(`DELETE FROM real_estate_installments WHERE unit_id::text = $1::text`, [String(unitId)]);
    await query(`DELETE FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unitId)]);

    await logNotification(
      'REAL_ESTATE',
      'DELETE',
      `حذف وحدة عقارية: ${uName}`,
      `تم حذف الوحدة العقارية (${uName}) وكافة جداول أقساطها من سجلات الاستثمار العقاري`,
      '/real-estate'
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}