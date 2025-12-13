/*
 Apply a .sql file to the configured MySQL database using the existing pool.

 Usage:
   node server/scripts/db_apply_sql.js server/db/issues.sql

 Notes:
 - This is a simple splitter intended for CREATE/ALTER statements.
 - It ignores empty statements and SQL comments.
*/

const fs = require("fs");
const path = require("path");
const { pool } = require("../src/db/pool");

function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !(trimmed.startsWith("--") || trimmed.startsWith("#"));
    })
    .join("\n");
}

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const prev = sql[i - 1];

    if (ch === "'" && prev !== "\\" && !inDouble) inSingle = !inSingle;
    if (ch === '"' && prev !== "\\" && !inSingle) inDouble = !inDouble;

    if (ch === ";" && !inSingle && !inDouble) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      continue;
    }
    current += ch;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

(async () => {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node server/scripts/db_apply_sql.js <path-to-sql>");
    process.exit(1);
  }

  const absolute = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  const raw = fs.readFileSync(absolute, "utf8");
  const cleaned = stripComments(raw);
  const statements = splitStatements(cleaned);

  try {
    for (const stmt of statements) {
      // eslint-disable-next-line no-console
      console.log(
        "Applying:",
        stmt.slice(0, 80).replace(/\s+/g, " ") + (stmt.length > 80 ? "..." : "")
      );
      await pool.execute(stmt);
    }
    console.log(
      `Done. Applied ${statements.length} statements from ${inputPath}`
    );
    process.exit(0);
  } catch (err) {
    console.error("Failed applying SQL:", err.message);
    process.exit(1);
  }
})();
