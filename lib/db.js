import mysql from "mysql2/promise";

function mysqlConfig() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (url) {
    return url;
  }

  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "auction_ethiopia",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
  };
}

export function getPool() {
  if (!globalThis.__mysqlPool) {
    globalThis.__mysqlPool = mysql.createPool(mysqlConfig());
  }
  return globalThis.__mysqlPool;
}

let schemaReady;

async function ensureSchema() {
  const pool = getPool();
  const [columns] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'listings'
       AND COLUMN_NAME = 'lastBidAt'`,
  );
  if (!Number(columns[0]?.total)) {
    await pool.query(
      "ALTER TABLE listings ADD COLUMN lastBidAt DATETIME NULL AFTER endsAt",
    );
  }
  await pool.query(
    `UPDATE listings l
     INNER JOIN (
       SELECT listingId, MAX(createdAt) AS lastBidAt
       FROM bids
       GROUP BY listingId
     ) b ON b.listingId = l.id
     SET l.lastBidAt = b.lastBidAt
     WHERE l.lastBidAt IS NULL`,
  );
}

function readyDB() {
  if (!schemaReady) {
    schemaReady = ensureSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function query(sql, params = []) {
  await readyDB();
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  await readyDB();
  const [result] = await getPool().execute(sql, params);
  return result;
}

export async function connectDB() {
  const pool = getPool();
  await pool.query("SELECT 1");
  return pool;
}
