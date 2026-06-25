import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve(process.cwd(), "dev.db");
const migrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20260518120000_init/migration.sql"
);

const db = new Database(dbPath);
const hasContactTable = db
  .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Contact'")
  .get();

if (!hasContactTable) {
  const migrationSql = readFileSync(migrationPath, "utf8");
  db.exec(migrationSql);
  console.log("Created local SQLite database at dev.db");
} else {
  console.log("Local SQLite database already exists at dev.db");
}

db.close();
