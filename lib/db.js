import pg from "pg";

const { Pool } = pg;
const globalForPg = globalThis;

function sanitizePostgresUrl(raw) {
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("supa");
  url.searchParams.delete("uselibpqcompat");
  return url.toString();
}

function postgresUrl() {
  const raw =
    process.env.SQL_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";
  return raw ? sanitizePostgresUrl(raw) : "";
}

function toPg(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function camelRow(row) {
  if (!row) return row;
  const next = {};
  for (const [key, value] of Object.entries(row)) {
    next[snakeToCamel(key)] = value;
  }
  return next;
}

export function getPool() {
  if (!globalForPg.pgPool) {
    const connectionString = postgresUrl();
    if (!connectionString) {
      throw new Error(
        "Set SQL_POSTGRES_URL from Supabase (or POSTGRES_URL / DATABASE_URL), then restart the app.",
      );
    }
    globalForPg.pgPool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 1 : 10,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForPg.pgPool;
}

export async function query(sql, params = []) {
  const { rows } = await getPool().query(toPg(sql), params);
  return rows.map(camelRow);
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function insert(sql, params = []) {
  const text = toPg(sql);
  const returning = /returning\s+/i.test(text) ? text : `${text} RETURNING id`;
  const { rows } = await getPool().query(returning, params);
  return rows[0]?.id;
}

export async function execute(sql, params = []) {
  const result = await getPool().query(toPg(sql), params);
  return { affectedRows: result.rowCount };
}

export async function connectDB() {
  return getPool();
}
