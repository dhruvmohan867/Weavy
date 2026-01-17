import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "";
console.log("🔍 CONNECTION STRING:", connectionString?.replace(/:(\/\/.+:).+@/, "$1<redacted>@"));

const useSsl = connectionString.includes("supabase.co") || connectionString.includes("sslmode=require");

const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;