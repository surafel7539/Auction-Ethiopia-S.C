const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
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
    process.env.SQL_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("supa");
  return url.toString();
}

async function main() {
  const db = new Client({
    connectionString: postgresUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  const existing = await db.query(
    "SELECT id FROM users WHERE licence_number = $1",
    ["AE-ADMIN-001"],
  );
  if (existing.rows.length) {
    console.log("Admin account already exists.");
    await db.end();
    return;
  }
  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  await db.query(
    `INSERT INTO users (legal_name, licence_number, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)`,
    ["House Clerk", "AE-ADMIN-001", "+251900000001", passwordHash, "ADMIN"],
  );
  console.log("Created admin AE-ADMIN-001 / Demo1234!");
  await db.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
