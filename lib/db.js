import mysql from "mysql2/promise";

const globalForMysql = globalThis;

function mysqlConfig() {
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "crownbid",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    timezone: "Z",
  };
}

export function getPool() {
  if (!globalForMysql.mysqlPool) {
    globalForMysql.mysqlPool = mysql.createPool(mysqlConfig());
  }
  return globalForMysql.mysqlPool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function insert(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result.insertId;
}

export async function execute(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

export async function connectDB() {
  return getPool();
}
