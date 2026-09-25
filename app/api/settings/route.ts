import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function initSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) DEFAULT 'شركة البرج المتألق',
      tagline VARCHAR(255) DEFAULT 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
      phone_primary VARCHAR(50) DEFAULT '',
      phone_secondary VARCHAR(50) DEFAULT '',
      email VARCHAR(100) DEFAULT '',
      website VARCHAR(100) DEFAULT '',
      address VARCHAR(255) DEFAULT 'العراق - النجف الأشرف - حي الفرات',
      logo_url TEXT DEFAULT '',
      letterhead_url TEXT DEFAULT '',
      primary_color VARCHAR(30) DEFAULT '#d97706',
      secondary_color VARCHAR(30) DEFAULT '#ea580c',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    DO $$ 
    BEGIN 
      BEGIN
        ALTER TABLE company_settings ADD COLUMN logo_url TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN END;
      BEGIN
        ALTER TABLE company_settings ADD COLUMN letterhead_url TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN END;
      BEGIN
        ALTER TABLE company_settings ADD COLUMN primary_color VARCHAR(30) DEFAULT '#d97706';
      EXCEPTION WHEN duplicate_column THEN END;
      BEGIN
        ALTER TABLE company_settings ADD COLUMN secondary_color VARCHAR(30) DEFAULT '#ea580c';
      EXCEPTION WHEN duplicate_column THEN END;
    END $$;
  `);

  const check = await query(`SELECT id FROM company_settings WHERE id = 1`);
  if (check.rows.length === 0) {
    await query(`
      INSERT INTO company_settings (id, company_name, address, tagline, primary_color, secondary_color)
      VALUES (1, 'شركة البرج المتألق', 'العراق - النجف الأشرف - حي الفرات', 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام', '#d97706', '#ea580c')
    `);
  }
}

export async function GET() {
  try {
    await initSettingsTable();
    const res = await query(`SELECT * FROM company_settings WHERE id = 1`);
    const settings = res.rows[0] || {};
    return NextResponse.json({ 
      success: true, 
      settings: {
        ...settings,
        primary_color: settings.primary_color || '#d97706',
        secondary_color: settings.secondary_color || '#ea580c'
      } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initSettingsTable();
    const body = await req.json();
    const { 
      company_name, 
      tagline, 
      phone_primary, 
      phone_secondary, 
      email, 
      website, 
      address, 
      logo_url, 
      letterhead_url,
      primary_color,
      secondary_color
    } = body;

    const pColor = primary_color || '#d97706';
    const sColor = secondary_color || '#ea580c';

    await query(`
      INSERT INTO company_settings (
        id, company_name, tagline, phone_primary, phone_secondary, 
        email, website, address, logo_url, letterhead_url, primary_color, secondary_color, updated_at
      )
      VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        tagline = EXCLUDED.tagline,
        phone_primary = EXCLUDED.phone_primary,
        phone_secondary = EXCLUDED.phone_secondary,
        email = EXCLUDED.email,
        website = EXCLUDED.website,
        address = EXCLUDED.address,
        logo_url = EXCLUDED.logo_url,
        letterhead_url = EXCLUDED.letterhead_url,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        updated_at = CURRENT_TIMESTAMP;
    `, [
      company_name || 'شركة البرج المتألق', 
      tagline || '', 
      phone_primary || '', 
      phone_secondary || '', 
      email || '', 
      website || '', 
      address || '', 
      logo_url || '', 
      letterhead_url || '', 
      pColor, 
      sColor
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'تم حفظ وتحديث بيانات وألوان هوية الشركة بنجاح',
      primary_color: pColor,
      secondary_color: sColor
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}