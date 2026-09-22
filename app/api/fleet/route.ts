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

async function initFleetTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS fleet_vehicles (
      vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_name VARCHAR(150) NOT NULL,
      plate_number VARCHAR(50) UNIQUE NOT NULL,
      vehicle_type VARCHAR(100) DEFAULT 'شاحنة نقل ثقيل',
      ownership_type VARCHAR(50) DEFAULT 'COMPANY',
      status VARCHAR(50) DEFAULT 'AVAILABLE',
      assigned_driver VARCHAR(150),
      driver_phone VARCHAR(50),
      current_location VARCHAR(200) DEFAULT 'النجف الأشرف - المقر الرئيسي',
      current_mileage NUMERIC DEFAULT 0,
      fuel_capacity NUMERIC DEFAULT 100,
      current_fuel_pct NUMERIC DEFAULT 100,
      last_oil_change_mileage NUMERIC DEFAULT 0,
      oil_change_interval_km NUMERIC DEFAULT 5000,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS vehicle_name VARCHAR(150);
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50);
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100) DEFAULT 'شاحنة نقل ثقيل';
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50) DEFAULT 'COMPANY';
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'AVAILABLE';
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS assigned_driver VARCHAR(150);
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50);
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS current_location VARCHAR(200) DEFAULT 'النجف الأشرف - المقر الرئيسي';
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS current_mileage NUMERIC DEFAULT 0;
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS current_fuel_pct NUMERIC DEFAULT 100;
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS last_oil_change_mileage NUMERIC DEFAULT 0;
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS oil_change_interval_km NUMERIC DEFAULT 5000;
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  try {
    await query(`ALTER TABLE fleet_vehicles ALTER COLUMN cost_center_id DROP NOT NULL;`);
  } catch {}
  try {
    await query(`ALTER TABLE fleet_vehicles ALTER COLUMN branch_id DROP NOT NULL;`);
  } catch {}

  await query(`
    CREATE TABLE IF NOT EXISTS fleet_trips (
      trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID,
      truck_source_type VARCHAR(50) DEFAULT 'INTERNAL',
      external_truck_info VARCHAR(200),
      external_driver_name VARCHAR(150),
      external_driver_phone VARCHAR(50),
      external_rental_cost NUMERIC DEFAULT 0,
      cargo_description VARCHAR(255),
      origin VARCHAR(150),
      destination VARCHAR(150),
      cargo_weight_tons NUMERIC DEFAULT 0,
      captain_name VARCHAR(150),
      trip_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
      estimated_hours NUMERIC DEFAULT 6,
      manifest_doc_url TEXT,
      trip_cost NUMERIC DEFAULT 0,
      departure_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      arrival_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS truck_source_type VARCHAR(50) DEFAULT 'INTERNAL';
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS external_truck_info VARCHAR(200);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS external_driver_name VARCHAR(150);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS external_driver_phone VARCHAR(50);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS external_rental_cost NUMERIC DEFAULT 0;
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS cargo_description VARCHAR(255);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS origin VARCHAR(150);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS destination VARCHAR(150);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS cargo_weight_tons NUMERIC DEFAULT 0;
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS captain_name VARCHAR(150);
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS trip_status VARCHAR(50) DEFAULT 'IN_PROGRESS';
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 6;
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS manifest_doc_url TEXT;
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS trip_cost NUMERIC DEFAULT 0;
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS departure_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP;
  `);

  try {
    await query(`ALTER TABLE fleet_trips ALTER COLUMN project_id DROP NOT NULL;`);
  } catch {}

  await query(`
    CREATE TABLE IF NOT EXISTS fleet_maintenance_logs (
      log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID,
      log_type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      cost NUMERIC NOT NULL DEFAULT 0,
      mileage_at_service NUMERIC DEFAULT 0,
      service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      performed_by VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function GET() {
  try {
    await initFleetTables();

    const [vehiclesRes, tripsRes, maintenanceRes] = await Promise.all([
      query(`
        SELECT 
          vehicle_id,
          COALESCE(vehicle_name, 'شاحنة أسطول') AS vehicle_name,
          COALESCE(plate_number, 'بدون رقم') AS plate_number,
          COALESCE(vehicle_type, 'شاحنة نقل مواد') AS vehicle_type,
          COALESCE(ownership_type, 'COMPANY') AS ownership_type,
          UPPER(COALESCE(status, 'AVAILABLE')) AS status,
          COALESCE(assigned_driver, 'غير محدد') AS assigned_driver,
          COALESCE(driver_phone, '') AS driver_phone,
          COALESCE(current_location, 'النجف الأشرف') AS current_location,
          COALESCE(current_mileage, 0) AS current_mileage,
          COALESCE(current_fuel_pct, 100) AS current_fuel_pct,
          COALESCE(last_oil_change_mileage, 0) AS last_oil_change_mileage,
          COALESCE(oil_change_interval_km, 5000) AS oil_change_interval_km,
          created_at
        FROM fleet_vehicles 
        ORDER BY created_at DESC
      `),
      query(`
        SELECT 
          t.*, 
          COALESCE(v.vehicle_name, t.external_truck_info, 'شاحنة') AS vehicle_name,
          COALESCE(v.plate_number, t.external_truck_info, '') AS plate_number
        FROM fleet_trips t
        LEFT JOIN fleet_vehicles v ON t.vehicle_id = v.vehicle_id
        ORDER BY t.departure_time DESC LIMIT 150
      `),
      query(`
        SELECT m.*, v.vehicle_name, v.plate_number
        FROM fleet_maintenance_logs m
        LEFT JOIN fleet_vehicles v ON m.vehicle_id = v.vehicle_id
        ORDER BY m.service_date DESC LIMIT 100
      `)
    ]);

    return NextResponse.json({
      success: true,
      vehicles: vehiclesRes.rows || [],
      trips: tripsRes.rows || [],
      maintenance: maintenanceRes.rows || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initFleetTables();
    const body = await req.json();
    const { action } = body;

    // 1. إضافة آلية جديدة
    if (action === 'ADD_VEHICLE') {
      const { vehicle_name, plate_number, vehicle_type, assigned_driver, driver_phone, current_location, current_mileage, oil_change_interval_km, ownership_type } = body;
      const cleanPlate = String(plate_number || '').trim();

      if (!cleanPlate) {
        return NextResponse.json({ error: 'رقم اللوحة مطلوب' }, { status: 400 });
      }

      const existCheck = await query(`
        SELECT vehicle_id, vehicle_name FROM fleet_vehicles WHERE plate_number = $1
      `, [cleanPlate]);

      if (existCheck.rows.length > 0) {
        return NextResponse.json({ 
          error: `رقم اللوحة (${cleanPlate}) مسجل مسبقاً للآلية: ${existCheck.rows[0].vehicle_name}` 
        }, { status: 400 });
      }

      const initialMileage = Number(current_mileage) || 0;

      const res = await query(`
        INSERT INTO fleet_vehicles (
          vehicle_name, 
          plate_number, 
          vehicle_type, 
          ownership_type,
          status, 
          assigned_driver,
          driver_phone,
          current_location, 
          current_mileage, 
          current_fuel_pct, 
          last_oil_change_mileage, 
          oil_change_interval_km
        )
        VALUES ($1, $2, $3, $4, 'AVAILABLE', $5, $6, $7, $8, 100, $8, $9)
        RETURNING *
      `, [
        vehicle_name || 'شاحنة نقل',
        cleanPlate,
        vehicle_type || 'شاحنة نقل مواد',
        ownership_type || 'COMPANY',
        assigned_driver || 'غير محدد',
        driver_phone || '',
        current_location || 'النجف الأشرف - ساحة الآليات',
        initialMileage,
        Number(oil_change_interval_km) || 5000
      ]);

      await logNotification(
        'FLEET',
        'ADD',
        `إضافة آلية للأسطول: ${vehicle_name || cleanPlate}`,
        `تم تسجيل الآلية (${vehicle_name || 'شاحنة'}) برقم لوحة (${cleanPlate}) وسائق مسؤول (${assigned_driver || 'غير محدد'})`,
        '/fleet'
      );

      return NextResponse.json({ success: true, vehicle: res.rows[0] });
    }

    // 2. إطلاق مهمة نقل
    if (action === 'CREATE_TRIP') {
      const { 
        vehicle_id, 
        truck_source_type,
        external_truck_info,
        external_driver_name,
        external_driver_phone,
        external_rental_cost,
        cargo_description, 
        origin, 
        destination, 
        cargo_weight_tons, 
        captain_name, 
        estimated_hours, 
        departure_time, 
        manifest_doc_url, 
        trip_cost 
      } = body;

      const isExternal = truck_source_type === 'EXTERNAL';

      const tripRes = await query(`
        INSERT INTO fleet_trips (
          vehicle_id, 
          truck_source_type,
          external_truck_info,
          external_driver_name,
          external_driver_phone,
          external_rental_cost,
          cargo_description, 
          origin, 
          destination, 
          cargo_weight_tons, 
          captain_name, 
          estimated_hours, 
          departure_time, 
          manifest_doc_url, 
          trip_cost
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13::timestamp, CURRENT_TIMESTAMP), $14, $15)
        RETURNING *
      `, [
        isExternal ? null : vehicle_id,
        truck_source_type || 'INTERNAL',
        external_truck_info || null,
        external_driver_name || null,
        external_driver_phone || null,
        Number(external_rental_cost) || 0,
        cargo_description || 'نقل مواد',
        origin || 'المصدر',
        destination || 'الوجهة',
        Number(cargo_weight_tons) || 0,
        isExternal ? (external_driver_name || 'سائق خارجي') : (captain_name || 'كابتن الأسطول'),
        Number(estimated_hours) || 6,
        departure_time || null,
        manifest_doc_url || null,
        Number(trip_cost) || 0
      ]);

      if (!isExternal && vehicle_id) {
        await query(`
          UPDATE fleet_vehicles 
          SET status = 'IN_TRANSIT', current_location = $1 
          WHERE vehicle_id = $2
        `, [`في الطريق إلى: ${destination}`, vehicle_id]);
      }

      // قيد إيراد النقل المستقل
      if (Number(trip_cost) > 0) {
        try {
          const voucherNumber = `V-FLT-${Date.now().toString().slice(-6)}`;
          const voucherNotes = JSON.stringify({
            sector: 'TRANSPORT_LOGISTICS',
            category: 'FLEET_REVENUE',
            partyAr: isExternal ? `أجور نقل شحنة [شاحنة خارجية: ${external_truck_info || ''}]` : (captain_name || 'كابتن الأسطول'),
            forReasonAr: `إيراد أجور نقل حمولة (${cargo_description}) من ${origin} إلى ${destination}`,
            method: 'CASH'
          });

          await query(`
            INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, 'RECEIPT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
          `, [voucherNumber, Number(trip_cost), voucherNotes]);
        } catch (vErr) {
          console.error('Auto Fleet Voucher Error:', vErr);
        }
      }

      // قيد كلفة استئجار الشاحنة الخارجية كمصروف
      if (isExternal && Number(external_rental_cost) > 0) {
        try {
          const vExpNumber = `V-RENT-${Date.now().toString().slice(-6)}`;
          const vExpNotes = JSON.stringify({
            sector: 'TRANSPORT_LOGISTICS',
            category: 'FLEET_EXPENSE',
            partyAr: external_driver_name || 'صاحب الشاحنة المستأجرة',
            forReasonAr: `كلفة استئجار سيارة نقل خارجية (${external_truck_info || ''}) لنقل (${cargo_description})`,
            method: 'CASH'
          });

          await query(`
            INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, 'PAYMENT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
          `, [vExpNumber, Number(external_rental_cost), vExpNotes]);
        } catch (rErr) {
          console.error('Fleet Rental Expense Voucher Error:', rErr);
        }
      }

      await logNotification(
        'FLEET',
        'ADD',
        `انطلاق مهمة نقل: ${cargo_description}`,
        `انطلقت الشاحنة بحمولة (${cargo_description} - ${cargo_weight_tons || 0} طن) من (${origin}) إلى (${destination})`,
        '/fleet'
      );

      return NextResponse.json({ success: true, trip: tripRes.rows[0] });
    }

    // 3. قيد مصاريف الوقود والصيانة
    if (action === 'ADD_MAINTENANCE_LOG') {
      const { vehicle_id, log_type, description, cost, mileage_at_service, performed_by } = body;

      const maintRes = await query(`
        INSERT INTO fleet_maintenance_logs (
          vehicle_id, 
          log_type, 
          description, 
          cost, 
          mileage_at_service, 
          performed_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        vehicle_id,
        log_type,
        description,
        Number(cost) || 0,
        Number(mileage_at_service) || 0,
        performed_by || 'ورشة الأسطول'
      ]);

      if (log_type === 'OIL_CHANGE') {
        await query(`
          UPDATE fleet_vehicles 
          SET last_oil_change_mileage = $1 
          WHERE vehicle_id = $2
        `, [Number(mileage_at_service) || 0, vehicle_id]);
      }

      if (log_type === 'FUEL') {
        await query(`
          UPDATE fleet_vehicles 
          SET current_fuel_pct = 100 
          WHERE vehicle_id = $1
        `, [vehicle_id]);
      }

      const typeName = log_type === 'OIL_CHANGE' ? 'تبديل دهن وفلاتر' : log_type === 'FUEL' ? 'وقود' : 'صيانة وقطع غيار';

      if (Number(cost) > 0) {
        try {
          const voucherNumber = `V-FLT-EXP-${Date.now().toString().slice(-6)}`;
          const voucherNotes = JSON.stringify({
            sector: 'TRANSPORT_LOGISTICS',
            category: 'FLEET_EXPENSE',
            partyAr: performed_by || 'ورشة الصيانة / محطة الوقود',
            forReasonAr: `مصروفات تشغيل النقل العام [${typeName}]: ${description}`,
            method: 'CASH'
          });

          await query(`
            INSERT INTO vouchers (voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, 'PAYMENT', $2, $2, $3, 'POSTED', CURRENT_TIMESTAMP)
          `, [voucherNumber, Number(cost), voucherNotes]);
        } catch (e) {
          console.error(e);
        }
      }

      const vData = await query(`SELECT vehicle_name, plate_number FROM fleet_vehicles WHERE vehicle_id = $1`, [vehicle_id]);
      const vName = vData.rows[0]?.vehicle_name || 'الشاحنة';

      await logNotification(
        'FLEET',
        'UPDATE',
        `قيد ${typeName}: ${vName}`,
        `تم تسجيل مصروف ${typeName} بمبلغ ${Number(cost).toLocaleString('en-US')} د.ع للشاحنة (${vName}) - البيان: ${description}`,
        '/fleet'
      );

      return NextResponse.json({ success: true, log: maintRes.rows[0] });
    }

    return NextResponse.json({ error: 'طلب غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'UPDATE_VEHICLE_STATUS') {
      const { vehicle_id, status, current_location, current_mileage, current_fuel_pct } = body;

      await query(`
        UPDATE fleet_vehicles
        SET status = COALESCE($1, status),
            current_location = COALESCE($2, current_location),
            current_mileage = COALESCE($3, current_mileage),
            current_fuel_pct = COALESCE($4, current_fuel_pct)
        WHERE vehicle_id = $5
      `, [
        status, 
        current_location, 
        current_mileage !== undefined && current_mileage !== '' ? Number(current_mileage) : null, 
        current_fuel_pct !== undefined && current_fuel_pct !== '' ? Number(current_fuel_pct) : null, 
        vehicle_id
      ]);

      return NextResponse.json({ success: true });
    }

    if (action === 'COMPLETE_TRIP') {
      const { trip_id, vehicle_id, arrival_location } = body;

      await query(`
        UPDATE fleet_trips
        SET trip_status = 'COMPLETED', arrival_time = CURRENT_TIMESTAMP
        WHERE trip_id = $1
      `, [trip_id]);

      if (vehicle_id) {
        await query(`
          UPDATE fleet_vehicles
          SET status = 'AVAILABLE', current_location = $1
          WHERE vehicle_id = $2
        `, [arrival_location || 'النجف الأشرف - تم التفريغ', vehicle_id]);
      }

      const tripInfo = await query(`SELECT cargo_description, destination FROM fleet_trips WHERE trip_id = $1`, [trip_id]);
      const cargo = tripInfo.rows[0]?.cargo_description || 'الشحنة';

      await logNotification(
        'FLEET',
        'UPDATE',
        `وصول وتسليم شحنة: ${cargo}`,
        `تم تأكيد وصول الشحنة وتفريغها بنجاح في (${arrival_location || 'الموقع المحدد'}) وعودة الآلية لحالة الجاهزية`,
        '/fleet'
      );

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
    const tripId = searchParams.get('trip_id');
    const vehicleId = searchParams.get('id');

    if (tripId) {
      await query(`DELETE FROM fleet_trips WHERE trip_id = $1`, [tripId]);
      return NextResponse.json({ success: true, message: 'تم حذف الرحلة بنجاح' });
    }

    if (vehicleId) {
      await query(`DELETE FROM fleet_vehicles WHERE vehicle_id = $1`, [vehicleId]);
      return NextResponse.json({ success: true, message: 'تم حذف الشاحنة بنجاح' });
    }

    return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}