const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] || process.env[key] === "") process.env[key] = value;
  }
}

function postgresUrl() {
  const raw =
    process.env.SQL_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SQL_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";
  if (!raw) {
    throw new Error("Set SQL_POSTGRES_URL from your Supabase env snippet.");
  }
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("supa");
  url.searchParams.delete("uselibpqcompat");
  return url.toString();
}

async function main() {
  const connectionString = postgresUrl();
  const host = new URL(connectionString.replace(/^postgres:/, "http:")).hostname;
  console.log(`Connecting to ${host}`);
  const db = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  const before = await db.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  console.log(`Tables before: ${before.rows.length}`);
  await db.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  const after = await db.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log(`Tables after: ${after.rows.map((row) => row.tablename).join(", ")}`);
  await db.end();
}

main().catch((error) => {
  console.error(error.code || "", error.message);
  process.exit(1);
});
