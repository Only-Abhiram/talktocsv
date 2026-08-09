const FORBIDDEN_KEYWORDS = [
  "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
  "ATTACH", "DETACH", "PRAGMA", "VACUUM", "REINDEX", "REPLACE",
  "GRANT", "REVOKE", "TRIGGER",
];

/**
 * Ensures the generated SQL is a single, read-only SELECT statement
 * that only touches the `dataset` table.
 */
export function validateSql(sql) {
  if (!sql || typeof sql !== "string") {
    return { valid: false, reason: "Empty SQL." };
  }

  let cleaned = sql.trim();
  // Strip a single trailing semicolon
  cleaned = cleaned.replace(/;\s*$/, "");

  if (cleaned.includes(";")) {
    return { valid: false, reason: "Multiple SQL statements are not allowed." };
  }

  if (!/^\s*(SELECT|WITH)\b/i.test(cleaned)) {
    return { valid: false, reason: "Only SELECT queries are allowed." };
  }

  const upper = cleaned.toUpperCase();
  for (const kw of FORBIDDEN_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`);
    if (re.test(upper)) {
      return { valid: false, reason: `Forbidden keyword detected: ${kw}` };
    }
  }

  if (!/\bDATASET\b/i.test(cleaned)) {
    return { valid: false, reason: "Query must reference the `dataset` table." };
  }

  return { valid: true, sql: cleaned };
}

/**
 * Appends a LIMIT clause if the query doesn't already have one.
 */
export function enforceRowLimit(sql, maxRows) {
  if (/\bLIMIT\s+\d+/i.test(sql)) return sql;
  return `${sql} LIMIT ${maxRows}`;
}
