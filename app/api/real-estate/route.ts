import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initRealEstateTables() {
  // 1. إنشاء جدول الوحدات إذا لم يكن موجوداً
  await query(`
    CREATE TABLE IF NOT EXISTS real_estate_units (
      unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      installment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID REFERENCES real_estate_units(unit_id) ON DELETE CASCADE,
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
      query(`SELECT * FROM real_estate_units ORDER BY created_at DESC`),
      query(`SELECT * FROM real_estate_installments ORDER BY due_date ASC`)
    ]);

    const units = unitsRes.rows || [];
    const installments = instRes.rows || [];

    const enrichedUnits = units.map((u: any) => {
      const uInst = installments.filter((i: any) => i.unit_id === u.unit_id);
      const totalPaid = uInst.filter((i: any) => i.is_paid).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
      const totalRemaining = uInst.filter((i: any) => !i.is_paid).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

      return {
        ...u,
        title: u.title || u.unit_name || 'وحدة عقارية',
        property_type: u.property_type || u.unit_type || 'شقة سكنية',
        area_sqm: u.area_sqm || u.area || 0,
        price: u.price || u.base_price || 0,
        installments: uInst,
        totalPaid,
        totalRemaining
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
      const { unit_code, title, property_type, area_sqm, price, city, location, notes } = body;
      const code = String(unit_code || `UNIT-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
      const selectedType = property_type || 'شقة سكنية';
      const numPrice = Number(price) || 0;
      const numArea = Number(area_sqm) || 0;
      const unitTitle = title || 'وحدة جديدة';

      const res = await query(`
        INSERT INTO real_estate_units (
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
          status
        )
        VALUES ($1, $2, $2, $3, $3, $4, $4, $5, $5, $6, $7, $8, 'AVAILABLE')
        RETURNING *
      `, [
        code,
        unitTitle,
        selectedType,
        numArea,
        numPrice,
        city || 'النجف الأشرف',
        location || 'شارع الكوفة',
        notes || ''
      ]);

      return NextResponse.json({ success: true, unit: res.rows[0] });
    }

    // 2. حجز أو بيع وحدة وتقسيم الأقساط
    if (action === 'SELL_UNIT') {
      const { unit_id, buyer_name, buyer_phone, down_payment, installments_count, total_price } = body;

      await query(`
        UPDATE real_estate_units
        SET status = 'SOLD',
            buyer_name = $1,
            buyer_phone = $2
        WHERE unit_id = $3
      `, [buyer_name, buyer_phone, unit_id]);

      const downPay = Number(down_payment) || 0;
      const tPrice = Number(total_price) || 0;
      const remainingPrice = Math.max(0, tPrice - downPay);
      const count = Number(installments_count) || 1;
      const instAmount = Math.round(remainingPrice / count);

      if (downPay > 0) {
        await query(`
          INSERT INTO real_estate_installments (unit_id, installment_title, amount, due_date, is_paid, paid_at)
          VALUES ($1, 'الدفعة الأولى (المقدمة)', $2, CURRENT_DATE, TRUE, CURRENT_TIMESTAMP)
        `, [unit_id, downPay]);

        try {
          const vNum = `V-EST-${Date.now().toString().slice(-5)}`;
          const voucherNotes = JSON.stringify({
            sector: 'REAL_ESTATE',
            partyAr: buyer_name,
            forReasonAr: `دفعة مقدمة لشراء وحدة عقارية`,
            method: 'CASH'
          });

          await query(`
            INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, 'RECEIPT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
          `, [vNum, downPay, voucherNotes]);
        } catch (vErr) {
          console.error(vErr);
        }
      }

      for (let i = 1; i <= count; i++) {
        await query(`
          INSERT INTO real_estate_installments (unit_id, installment_title, amount, due_date, is_paid)
          VALUES ($1, $2, $3, CURRENT_DATE + ($4 || ' months')::interval, FALSE)
        `, [unit_id, `القسط الشهري رقم (${i})`, instAmount, i]);
      }

      return NextResponse.json({ success: true });
    }

    // 3. تسديد قسط شهري
    if (action === 'PAY_INSTALLMENT') {
      const { installment_id, unit_id, amount, buyer_name, installment_title } = body;

      await query(`
        UPDATE real_estate_installments
        SET is_paid = TRUE,
            paid_at = CURRENT_TIMESTAMP
        WHERE installment_id = $1
      `, [installment_id]);

      try {
        const vNum = `V-INST-${Date.now().toString().slice(-5)}`;
        const voucherNotes = JSON.stringify({
          sector: 'REAL_ESTATE',
          partyAr: buyer_name || 'مشتري الوحدة العقارية',
          forReasonAr: `سداد ${installment_title || 'قسط عقاري'}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
          VALUES ($1, 'RECEIPT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
        `, [vNum, Number(amount) || 0, voucherNotes]);
      } catch (vErr) {
        console.error(vErr);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
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

    await query(`DELETE FROM real_estate_units WHERE unit_id = $1`, [unitId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}