import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

declare global {
  // eslint-disable-next-line no-var
  var __neonSql: NeonQueryFunction<false, false> | undefined;
}

function getSql(): NeonQueryFunction<false, false> {
  if (!globalThis.__neonSql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add your Neon connection string to .env.local / Vercel env vars."
      );
    }
    globalThis.__neonSql = neon(connectionString);
  }
  return globalThis.__neonSql;
}

let schemaReady: Promise<void> | null = null;

/** Creates the `locations` table + index on first use (safe to call per-request). */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          accuracy DOUBLE PRECISION NULL,
          source TEXT NOT NULL DEFAULT 'gps',
          user_agent TEXT NOT NULL DEFAULT '',
          ip TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS locations_created_at_idx
        ON locations (created_at DESC)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export function getDb(): NeonQueryFunction<false, false> {
  return getSql();
}

