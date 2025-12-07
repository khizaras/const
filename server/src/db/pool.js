const mysql = require("mysql2/promise");
const { env } = require("../config/env");
const { logger } = require("../logger");

const poolConfig = {
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(poolConfig);

const initPool = async () => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    logger.info({ db: env.MYSQL_DB }, "MySQL pool initialized");
  } catch (err) {
    if (err && err.code === "ER_BAD_DB_ERROR") {
      logger.warn(
        { db: env.MYSQL_DB },
        "Database missing, attempting to create"
      );
      const adminConn = await mysql.createConnection({
        host: env.MYSQL_HOST,
        port: Number(env.MYSQL_PORT),
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
      });
      await adminConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${env.MYSQL_DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await adminConn.end();
      logger.info({ db: env.MYSQL_DB }, "Database ensured, retrying pool init");
      const conn = await pool.getConnection();
      conn.release();
      logger.info({ db: env.MYSQL_DB }, "MySQL pool initialized");
      return;
    }
    logger.error({ err }, "Failed to initialize MySQL pool");
    process.exit(1);
  }
};

initPool();

module.exports = { pool };
