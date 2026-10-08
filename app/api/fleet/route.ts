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

async function initFleetTables() {
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
    CREATE TABLE IF NOT EXISTS fleet_vehicles (
      vehicle_id VARCHAR(50) PRIMARY KEY,
      branch_id VARCHAR(50) DEFAULT 'BR-TRANS-04',
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
    ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-TRANS-04';
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
      trip_id VARCHAR(50) PRIMARY KEY,
      branch_id VARCHAR(50) DEFAULT 'BR-TRANS-04',
      vehicle_id VARCHAR(50),
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
    ALTER TABLE fleet_trips ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-TRANS-04';
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
      log_id VARCHAR(50) PRIMARY KEY,
      vehicle_id VARCHAR(50),
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

export async function GET(req: Request) {
  try {
    await initFleetTables();

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get('branch_id');
    const isSpecificBranch = branchFilter && branchFilter !== 'ALL' && branchFilter.trim() !== '';

    let vehiclesSql = `
      SELECT 
        v.vehicle_id::text,
        v.branch_id::text AS branch_id,
        COALESCE(b.name_ar, 'فرع الشركة') AS branch_name,
        COALESCE(v.vehicle_name, 'شاحنة أسطول') AS vehicle_name,
        COALESCE(v.plate_number, 'بدون رقم') AS plate_number,
        COALESCE(v.vehicle_type, 'شاحنة نقل مواد') AS vehicle_type,
        COALESCE(v.ownership_type, 'COMPANY') AS ownership_type,
        UPPER(COALESCE(v.status, 'AVAILABLE')) AS status,
        COALESCE(v.assigned_driver, 'غير محدد') AS assigned_driver,
        COALESCE(v.driver_phone, '') AS driver_phone,
        COALESCE(v.current_location, 'النجف الأشرف') AS current_location,
        COALESCE(v.current_mileage, 0) AS current_mileage,
        COALESCE(v.current_fuel_pct, 100) AS current_fuel_pct,
        COALESCE(v.last_oil_change_mileage, 0) AS last_oil_change_mileage,
        COALESCE(v.oil_change_interval_km, 5000) AS oil_change_interval_km,
        v.created_at
      FROM fleet_vehicles v
      LEFT JOIN branches b ON TRIM(v.branch_id::text) = TRIM(b.branch_id::text)
    `;
    const vehiclesParams: any[] = [];
    if (isSpecificBranch) {
      vehiclesSql += ` WHERE TRIM(v.branch_id::text) = TRIM($1)`;
      vehiclesParams.push(String(branchFilter));
    }
    vehiclesSql += ` ORDER BY v.created_at DESC`;

    let tripsSql = `
      SELECT 
        t.trip_id::text,
        t.branch_id::text AS branch_id,
        t.vehicle_id::text,
        t.truck_source_type,
        t.external_truck_info,
        t.external_driver_name,
        t.external_driver_phone,
        t.external_rental_cost,
        t.cargo_description,
        t.origin,
        t.destination,
        t.cargo_weight_tons,
        t.captain_name,
        t.trip_status,
        t.estimated_hours,
        t.manifest_doc_url,
        t.trip_cost,
        t.departure_time,
        t.arrival_time,
        t.created_at,
        COALESCE(v.vehicle_name, t.external_truck_info, 'شاحنة') AS vehicle_name,
        COALESCE(v.plate_number, t.external_truck_info, '') AS plate_number
      FROM fleet_trips t
      LEFT JOIN fleet_vehicles v ON TRIM(t.vehicle_id::text) = TRIM(v.vehicle_id::text)
    `;
    const tripsParams: any[] = [];
    if (isSpecificBranch) {
      tripsSql += ` WHERE (TRIM(t.branch_id::text) = TRIM($1) OR TRIM(v.branch_id::text) = TRIM($1))`;
      tripsParams.push(String(branchFilter));
    }
    tripsSql += ` ORDER BY t.departure_time DESC LIMIT 150`;

    let maintSql = `
      SELECT 
        m.log_id::text,
        m.vehicle_id::text,
        m.log_type,
        m.description,
        m.cost,
        m.mileage_at_service,
        m.service_date,
        m.performed_by,
        m.created_at,
        v.vehicle_name,
        v.plate_number
      FROM fleet_maintenance_logs m
      LEFT JOIN fleet_vehicles v ON TRIM(m.vehicle_id::text) = TRIM(v.vehicle_id::text)
    `;
    const maintParams: any[] = [];
    if (isSpecificBranch) {
      maintSql += ` WHERE TRIM(v.branch_id::text) = TRIM($1)`;
      maintParams.push(String(branchFilter));
    }
    maintSql += ` ORDER BY m.service_date DESC LIMIT 100`;

    const [vehiclesRes, tripsRes, maintenanceRes] = await Promise.all([
      query(vehiclesSql, vehiclesParams).catch(() => ({ rows: [] })),
      query(tripsSql, tripsParams).catch(() => ({ rows: [] })),
      query(maintSql, maintParams).catch(() => ({ rows: [] }))
    ]);

    const vehicles = (vehiclesRes.rows || []).map((v: any) => ({
      ...v,
      branch_name: v.branch_name || BRANCH_NAMES_MAP[v.branch_id] || 'فرع الشركة'
    }));

    return NextResponse.json({
      success: true,
      vehicles,
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
      const { 
        vehicle_id, 
        id, 
        branch_id,
        vehicle_name, 
        plate_number, 
        vehicle_type, 
        assigned_driver, 
        driver_phone, 
        current_location, 
        current_mileage, 
        oil_change_interval_km, 
        ownership_type 
      } = body;
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
      const finalVehicleId = String(vehicle_id || id || `VHC-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      
      const finalBranchId = branch_id && String(branch_id).trim() !== '' && String(branch_id).trim() !== 'ALL'
        ? String(branch_id).trim()
        : null;

      const res = await query(`
        INSERT INTO fleet_vehicles (
          vehicle_id,
          branch_id,
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
        VALUES ($1, $2, $3, $4, $5, $6, 'AVAILABLE', $7, $8, $9, $10, 100, $10, $11)
        RETURNING *
      `, [
        finalVehicleId,
        finalBranchId,
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

      const bRes = finalBranchId ? await query(`SELECT name_ar FROM branches WHERE branch_id::text = $1`, [finalBranchId]) : { rows: [] };
      const bName = bRes.rows[0]?.name_ar || 'فرع الشركة';

      await logNotification(
        'FLEET',
        'ADD',
        `إضافة آلية للأسطول: ${vehicle_name || cleanPlate} (${bName})`,
        `تم تسجيل الآلية (${vehicle_name || 'شاحنة'}) في (${bName}) برقم لوحة (${cleanPlate})`,
        '/fleet'
      );

      return NextResponse.json({ success: true, vehicle: { ...res.rows[0], branch_name: bName } });
    }

    // 2. إطلاق مهمة نقل
    if (action === 'CREATE_TRIP') {
      const { 
        trip_id,
        id,
        branch_id,
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
      const finalTripId = String(trip_id || id || `TRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      
      let finalBranchId = branch_id;
      if (!finalBranchId && vehicle_id) {
        const vBranch = await query(`SELECT branch_id FROM fleet_vehicles WHERE vehicle_id::text = $1::text`, [String(vehicle_id)]).catch(() => ({ rows: [] }));
        finalBranchId = vBranch.rows[0]?.branch_id;
      }
      finalBranchId = finalBranchId && String(finalBranchId).trim() !== '' && String(finalBranchId).trim() !== 'ALL'
        ? String(finalBranchId).trim()
        : null;

      const tripRes = await query(`
        INSERT INTO fleet_trips (
          trip_id,
          branch_id,
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, COALESCE($15::timestamp, CURRENT_TIMESTAMP), $16, $17)
        RETURNING *
      `, [
        finalTripId,
        finalBranchId,
        isExternal ? null : (vehicle_id ? String(vehicle_id) : null),
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
          WHERE vehicle_id::text = $2::text
        `, [`في الطريق إلى: ${destination}`, String(vehicle_id)]);
      }

      // قيد إيراد النقل المستقل مرتبطة بالفرع الصحيح
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
            INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, $2, $3, 'RECEIPT', $4, $4, $5, 'POSTED', CURRENT_DATE)
          `, [`VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`, finalBranchId, voucherNumber, Number(trip_cost), voucherNotes]);
        } catch (vErr) {
          console.error('Auto Fleet Voucher Error:', vErr);
        }
      }

      // قيد كلفة استئجار الشاحنة الخارجية كمصروف مرتبطة بالفرع
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
            INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, $2, $3, 'PAYMENT', $4, $4, $5, 'POSTED', CURRENT_DATE)
          `, [`VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`, finalBranchId, vExpNumber, Number(external_rental_cost), vExpNotes]);
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
      const { log_id, id, vehicle_id, log_type, description, cost, mileage_at_service, performed_by } = body;
      const finalLogId = String(log_id || id || `MNT-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

      const maintRes = await query(`
        INSERT INTO fleet_maintenance_logs (
          log_id,
          vehicle_id, 
          log_type, 
          description, 
          cost, 
          mileage_at_service, 
          performed_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        finalLogId,
        String(vehicle_id),
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
          WHERE vehicle_id::text = $2::text
        `, [Number(mileage_at_service) || 0, String(vehicle_id)]);
      }

      if (log_type === 'FUEL') {
        await query(`
          UPDATE fleet_vehicles 
          SET current_fuel_pct = 100 
          WHERE vehicle_id::text = $1::text
        `, [String(vehicle_id)]);
      }

      const vData = await query(`SELECT vehicle_name, plate_number, branch_id FROM fleet_vehicles WHERE vehicle_id::text = $1::text`, [String(vehicle_id)]);
      const vName = vData.rows[0]?.vehicle_name || 'الشاحنة';
      const vBranchId = vData.rows[0]?.branch_id || null;

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
            INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, issue_date)
            VALUES ($1, $2, $3, 'PAYMENT', $4, $4, $5, 'POSTED', CURRENT_DATE)
          `, [`VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`, vBranchId, voucherNumber, Number(cost), voucherNotes]);
        } catch (e) {
          console.error(e);
        }
      }

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
        WHERE vehicle_id::text = $5::text
      `, [
        status, 
        current_location, 
        current_mileage !== undefined && current_mileage !== '' ? Number(current_mileage) : null, 
        current_fuel_pct !== undefined && current_fuel_pct !== '' ? Number(current_fuel_pct) : null, 
        String(vehicle_id)
      ]);

      const vData = await query(`SELECT vehicle_name, plate_number FROM fleet_vehicles WHERE vehicle_id::text = $1::text`, [String(vehicle_id)]);
      const vName = vData.rows[0]?.vehicle_name || 'الآلية';

      await logNotification(
        'FLEET',
        'UPDATE',
        `تحديث حالة الآلية: ${vName}`,
        `تم تحديث حالة الآلية (${vName}) إلى (${status || 'محدث'}) في الموقع (${current_location || 'المقر'})`,
        '/fleet'
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'COMPLETE_TRIP') {
      const { trip_id, vehicle_id, arrival_location } = body;

      await query(`
        UPDATE fleet_trips
        SET trip_status = 'COMPLETED', arrival_time = CURRENT_TIMESTAMP
        WHERE trip_id::text = $1::text
      `, [String(trip_id)]);

      if (vehicle_id) {
        await query(`
          UPDATE fleet_vehicles
          SET status = 'AVAILABLE', current_location = $1
          WHERE vehicle_id::text = $2::text
        `, [arrival_location || 'النجف الأشرف - تم التفريغ', String(vehicle_id)]);
      }

      const tripInfo = await query(`SELECT cargo_description, destination FROM fleet_trips WHERE trip_id::text = $1::text`, [String(trip_id)]);
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
      const tripData = await query(`SELECT cargo_description FROM fleet_trips WHERE trip_id::text = $1::text`, [String(tripId)]);
      const cargo = tripData.rows[0]?.cargo_description || 'رحلة نقل';

      await query(`DELETE FROM fleet_trips WHERE trip_id::text = $1::text`, [String(tripId)]);

      await logNotification(
        'FLEET',
        'DELETE',
        `إلغاء وحذف رحلة نقل: ${cargo}`,
        `تم حذف سجل رحلة النقل (${cargo}) من جدول تشغيل الأسطول`,
        '/fleet'
      );

      return NextResponse.json({ success: true, message: 'تم حذف الرحلة بنجاح' });
    }

    if (vehicleId) {
      const vData = await query(`SELECT vehicle_name, plate_number FROM fleet_vehicles WHERE vehicle_id::text = $1::text`, [String(vehicleId)]);
      const vName = vData.rows[0]?.vehicle_name || 'آلية';
      const plate = vData.rows[0]?.plate_number || '';

      await query(`DELETE FROM fleet_vehicles WHERE vehicle_id::text = $1::text`, [String(vehicleId)]);

      await logNotification(
        'FLEET',
        'DELETE',
        `حذف مركبة من الأسطول: ${vName}`,
        `تم حذف الآلية (${vName} - لوحة ${plate}) نهائياً من سجلات الأسطول`,
        '/fleet'
      );

      return NextResponse.json({ success: true, message: 'تم حذف الشاحنة بنجاح' });
    }

    return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}