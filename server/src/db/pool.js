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
    logger.info(
      {
        mysql: {
          host: env.MYSQL_HOST,
          port: Number(env.MYSQL_PORT),
          db: env.MYSQL_DB,
          user: env.MYSQL_USER,
        },
      },
      "MySQL pool initialized"
    );
  } catch (err) {
    if (err && err.code === "ER_BAD_DB_ERROR") {
      logger.warn(
        {
          mysql: {
            host: env.MYSQL_HOST,
            port: Number(env.MYSQL_PORT),
            db: env.MYSQL_DB,
            user: env.MYSQL_USER,
          },
        },
        "Database missing, attempting to create"
      );

      try {
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
        logger.info(
          { db: env.MYSQL_DB },
          "Database ensured, retrying pool init"
        );
        const conn = await pool.getConnection();
        conn.release();
        logger.info(
          {
            mysql: {
              host: env.MYSQL_HOST,
              port: Number(env.MYSQL_PORT),
              db: env.MYSQL_DB,
              user: env.MYSQL_USER,
            },
          },
          "MySQL pool initialized"
        );
        return;
      } catch (createErr) {
        logger.error(
          {
            err: createErr,
            mysql: {
              host: env.MYSQL_HOST,
              port: Number(env.MYSQL_PORT),
              db: env.MYSQL_DB,
              user: env.MYSQL_USER,
            },
            hint: "DB creation failed. Ensure MYSQL_USER has CREATE DATABASE privilege, or create the DB manually.",
          },
          "Failed to create missing database"
        );
        process.exit(1);
      }
    }

    logger.error(
      {
        err,
        mysql: {
          host: env.MYSQL_HOST,
          port: Number(env.MYSQL_PORT),
          db: env.MYSQL_DB,
          user: env.MYSQL_USER,
        },
        hint: "Common causes: wrong MYSQL_PASSWORD, host/port blocked, user lacks privileges, or DB server is down.",
      },
      "Failed to initialize MySQL pool"
    );
    process.exit(1);
  }
};

initPool();

module.exports = { pool };
