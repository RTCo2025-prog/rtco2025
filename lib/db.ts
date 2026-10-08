import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';

// ملف حفظ الرابط المبدل محلياً إن وُجد
const ACTIVE_DB_FILE = path.join(process.cwd(), '.active_db.json');

// دالة لتطهير الرابط من المعاملات غير المتوافقة وإسكات تحذير SSL
function sanitizeDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/([&?])channel_binding=[^&]+/gi, '');
  url = url.replace(/([&?])sslmode=[^&]+/gi, '');
  url = url.replace(/([&?])uselibpqcompat=[^&]+/gi, '');
  url = url.replace(/\?&/, '?').replace(/[?&]$/, '');

  // إضافة معامل التوافق الصريح لمنع تحذير SSL الخاص بـ pg
  const separator = url.includes('?') ? '&' : '?';
  url += `${separator}uselibpqcompat=true&sslmode=require`;

  return url;
}

// استخراج الرابط الفعال (قراءة فقط بدون تعطيل النظام)
function getInitialConnectionString(): string {
  try {
    if (fs.existsSync(ACTIVE_DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVE_DB_FILE, 'utf8'));
      if (data && data.active_url) {
        return sanitizeDatabaseUrl(data.active_url);
      }
    }
  } catch (e) {
    // تجاهل أخطاء القراءة بهدوء
  }
  return sanitizeDatabaseUrl(process.env.DATABASE_URL || '');
}

// دالة إنشاء إعدادات المسبح المحسنة
function createPoolConfig(connectionString: string): PoolConfig {
  const isSslRequired = connectionString.includes('neon.tech') || connectionString.includes('sslmode');
  
  return {
    connectionString,
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __globalPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __branchesSchemaPatched: boolean | undefined;
}

let pool: Pool;

async function patchBranchesSchema(activePool: Pool) {
  if (global.__branchesSchemaPatched) return;
  try {
    await activePool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'branches' AND column_name = 'branch_code'
        ) THEN
          ALTER TABLE branches ALTER COLUMN branch_code DROP NOT NULL;
        END IF;
      END $$;
    `);
    global.__branchesSchemaPatched = true;
  } catch (e) {
    // كتم الخطأ
  }
}

function getPool(): Pool {
  if (global.__globalPgPool) {
    return global.__globalPgPool;
  }
  
  const connStr = getInitialConnectionString();
  const config = createPoolConfig(connStr);
  const newPool = new Pool(config);

  newPool.on('error', (err) => {
    console.error('Unexpected error on idle pg client'); // تم كتم تفاصيل الخطأ أمنياً
  });

  patchBranchesSchema(newPool);

  global.__globalPgPool = newPool;
  return newPool;
}

pool = getPool();

// تنفيذ الاستعلامات مع حماية ضد تسريب الأخطاء (Error Leakage Protection)
export async function query(text: string, params?: any[], retryCount = 1): Promise<any> {
  const currentPool = getPool();
  try {
    return await currentPool.query(text, params);
  } catch (err: any) {
    if (
      retryCount > 0 && 
      (err.message?.includes('timeout') || err.message?.includes('Connection terminated') || err.message?.includes('ECONNRESET'))
    ) {
      await new Promise(res => setTimeout(res, 500));
      return await currentPool.query(text, params);
    }
    
    // إغلاق ثغرة تسريب هيكل قاعدة البيانات للمستخدمين
    if (process.env.NODE_ENV === 'production') {
       console.error('Secure DB Error Log:', err.message);
       throw new Error('حدث خطأ داخلي متصل بقاعدة البيانات. يرجى المحاولة لاحقاً.');
    }
    throw err;
  }
}

// دالة التبديل (معدلة لتجنب انهيار بيئة Vercel/Netlify)
export async function switchDatabase(newUrl: string): Promise<void> {
  const sanitized = sanitizeDatabaseUrl(newUrl);
  if (!sanitized) {
    throw new Error('رابط قاعدة البيانات غير صالح أو فارغ.');
  }

  const testConfig = createPoolConfig(sanitized);
  const testPool = new Pool(testConfig);

  try {
    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    await patchBranchesSchema(testPool);
  } catch (err: any) {
    await testPool.end().catch(() => {});
    throw new Error('فشل التحقق من الاتصال بالقاعدة الجديدة.'); // تم إخفاء تفاصيل الفشل أمنياً
  }

  if (global.__globalPgPool) {
    try {
      await global.__globalPgPool.end();
    } catch (e) {
    }
  }

  global.__globalPgPool = testPool;
  pool = testPool;

  // تمت إزالة fs.writeFileSync بالكامل لسد ثغرة توقف السيرفر (Error 500 Serverless Crash)
}

export default pool;