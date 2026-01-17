import { Pool } from 'pg';

// 🔍 DEBUGGING: Print the URL to the server console
console.log("🔍 CONNECTION STRING:", process.env.DATABASE_URL);

const useSsl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);