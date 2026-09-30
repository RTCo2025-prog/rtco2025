import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let activePool: Pool | null = null;
let currentDbUrl: string | null = null;

const CONFIG_FILE = path.join(process.cwd(), '.active_db.json');

// تنظيف الرابط من المعايير التي تسبب تجمد أو فشل الاتصال في Node.js
function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // إزالة channel_binding=require إن وجدت
  cleaned = cleaned.replace(/[?&]channel_binding=[^&]+/g, '');
  // التأكد من وجود sslmode=require
  if (!cleaned.includes('sslmode=')) {
    cleaned += (cleaned.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  return cleaned;
}

export function getActiveConnectionString(): string {
  if (currentDbUrl) return currentDbUrl;

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (data && data.database_url) {
        currentDbUrl = sanitizeUrl(data.database_url);
        return currentDbUrl;
      }
    }
  } catch {
    // تجاهل خطأ قراءة الملف في البيئات المعزولة أو السحابية
  }

  currentDbUrl = sanitizeUrl(process.env.DATABASE_URL || '');
  return currentDbUrl;
}

export function getPool(overrideUrl?: string): Pool {
  const connectionString = overrideUrl ? sanitizeUrl(overrideUrl) : getActiveConnectionString();

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  if (activePool && !overrideUrl) {
    return activePool;
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000, // مهلة كافية لسيرفرات Neon/Supabase للاستيقاظ
  });

  pool.on('error', (err) => {
    console.error('Unexpected database client error:', err);
  });

  if (!overrideUrl) {
    activePool = pool;
  }

  return pool;
}

export async function switchDatabase(newConnectionString: string): Promise<boolean> {
  const cleanUrl = sanitizeUrl(newConnectionString);

  // إعطاء مهلة 30 ثانية لتستيقظ قاعدة البيانات من حالة السكون
  const testPool = new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000
  });

  try {
    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    await testPool.end();

    if (activePool) {
      await activePool.end().catch((err) => {
        console.warn('Error closing active pool during switch:', err);
      });
      activePool = null;
    }

    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ database_url: cleanUrl }), 'utf8');
    } catch (e) {
      console.warn('Could not write to local config file (possibly read-only filesystem):', e);
    }

    currentDbUrl = cleanUrl;
    activePool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000
    });

    activePool.on('error', (err) => {
      console.error('Unexpected database client error in new active pool:', err);
    });

    return true;
  } catch (err) {
    await testPool.end().catch(() => {});
    throw err;
  }
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export default getPool;