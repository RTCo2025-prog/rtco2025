import { Pool } from 'pg';

// تعريف تجمع الاتصالات لبيئة العمل في Next.js لمنع تكرار الاتصالات
const globalForDb = global as unknown as { pool: Pool };

export const pool =
  globalForDb.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10, // الحد الأقصى لعدد الاتصالات
    idleTimeoutMillis: 15000, // إغلاق الاتصال الخامل قبل أن يقطعه خادم Neon تلقائياً
    connectionTimeoutMillis: 10000, // مهلة انتظار بدء الاتصال
  });

// منع انهيار السيرفر وظهور uncaughtException عند انقطاع الاتصال الخامل من خادم Neon
pool.on('error', (err) => {
  console.warn('Neon idle client connection closed gracefully:', err.message);
});

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}