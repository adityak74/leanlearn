import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

let localDb: any = null;

export function getDb(env?: any) {
  const dbBinding = env?.DB;
  
  // Check if it's a valid D1 binding (has prepare method)
  if (dbBinding && typeof dbBinding.prepare === 'function') {
    return drizzleD1(dbBinding, { schema });
  }

  // Fallback to local SQLite for development
  if (!localDb) {
    console.log("📂 Using local SQLite database: dev.db (D1 binding missing or invalid)");
    const sqlite = new Database("dev.db");
    localDb = drizzleSqlite(sqlite, { schema });
  }
  
  return localDb;
}
