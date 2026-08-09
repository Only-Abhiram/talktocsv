import { parse } from "csv-parse/sync";

/**
 * Turns a raw column header into a safe SQLite identifier.
 */
function sanitizeColumnName(name, usedNames) {
  let clean = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!clean) clean = "col";
  if (/^[0-9]/.test(clean)) clean = `c_${clean}`;
  clean = clean.toLowerCase();

  let finalName = clean;
  let i = 1;
  while (usedNames.has(finalName)) {
    finalName = `${clean}_${i++}`;
  }
  usedNames.add(finalName);
  return finalName;
}

function inferColumnType(values) {
  let isInt = true;
  let isReal = true;
  let sawValue = false;

  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    sawValue = true;
    const trimmed = String(v).trim();
    if (!/^-?\d+$/.test(trimmed)) isInt = false;
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) isReal = false;
    if (!isInt && !isReal) break;
  }

  if (!sawValue) return "TEXT";
  if (isInt) return "INTEGER";
  if (isReal) return "REAL";
  return "TEXT";
}

/**
 * Parses CSV buffer into { columns: [{name, type, originalName}], rows: [...] }
 */
export function parseCsv(buffer) {
  const records = parse(buffer, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  });

  if (records.length === 0) {
    throw new Error("CSV file is empty");
  }

  const rawHeaders = records[0];
  const usedNames = new Set();
  const columns = rawHeaders.map((h) => ({
    originalName: h,
    name: sanitizeColumnName(h, usedNames),
  }));

  const dataRows = records.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col.name] = row[idx] !== undefined ? row[idx] : null;
    });
    return obj;
  });

  columns.forEach((col) => {
    const sample = dataRows.slice(0, 1000).map((r) => r[col.name]);
    col.type = inferColumnType(sample);
  });

  return { columns, rows: dataRows };
}
