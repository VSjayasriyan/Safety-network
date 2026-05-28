import pg from "pg";
import { config } from "../config.js";

export const pool = config.databaseUrl
  ? new pg.Pool({ connectionString: config.databaseUrl })
  : undefined;

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!pool) return [];
  const result = await pool.query(sql, params);
  return result.rows as T[];
}
