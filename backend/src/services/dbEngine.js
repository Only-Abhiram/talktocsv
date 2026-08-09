import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Creates a fresh SQLite DB file for a session and loads the parsed CSV
 * into a table called `dataset`.
 */
export function createDatasetDb(sessionId, columns, rows) {
  const dbPath = path.join(DATA_DIR, `${sessionId}.sqlite`);
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  const colDefs = columns.map((c) => `"${c.name}" ${c.type}`).join(", ");
  db.exec(`CREATE TABLE dataset (${colDefs});`);

  const placeholders = columns.map((c) => `@${c.name}`).join(", ");
  const insert = db.prepare(
    `INSERT INTO dataset (${columns.map((c) => `"${c.name}"`).join(", ")}) VALUES (${placeholders})`
  );

  const insertMany = db.transaction((records) => {
    for (const r of records) insert.run(r);
  });
  insertMany(rows);

  db.close();
  return dbPath;
}

export function openDatasetDb(sessionId) {
  const dbPath = path.join(DATA_DIR, `${sessionId}.sqlite`);
  if (!fs.existsSync(dbPath)) {
    throw new Error("Session dataset not found. Please upload a CSV first.");
  }
  return new Database(dbPath, { readonly: true, fileMustExist: true });
}

export function deleteDatasetDb(sessionId) {
  const dbPath = path.join(DATA_DIR, `${sessionId}.sqlite`);
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
}
