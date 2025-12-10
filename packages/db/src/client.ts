import { Pool } from "pg";
import { z } from "zod";
import { env } from "@lumina/config";

const dbUrlSchema = z.string().min(1);

const databaseUrl = dbUrlSchema.parse(env.DATABASE_URL);

export const pool = new Pool({
  connectionString: databaseUrl,
});

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return { rows: result.rows };
  } finally {
    client.release();
  }
}