import { Router } from "express";
import { openDatasetDb } from "../services/dbEngine.js";
import { generateSql, explainResult } from "../services/llmService.js";
import { validateSql, enforceRowLimit } from "../services/sqlValidator.js";
import { requireSession, addHistoryEntry } from "../store/sessionStore.js";

const router = Router();
const MAX_ROWS = parseInt(process.env.MAX_ROWS_RETURNED || "500", 10);

router.post("/query", async (req, res) => {
  const { sessionId, question, explain = true } = req.body || {};

  if (!sessionId || !question || !question.trim()) {
    return res.status(400).json({ error: "sessionId and question are required." });
  }

  let session;
  try {
    session = requireSession(sessionId);
  } catch (err) {
    return res.status(err.status || 404).json({ error: err.message });
  }

  try {
    // 1. LLM generates SQL from the question + schema
    const rawSql = await generateSql(question, session.columns, session.history);

    // 2. Validate SQL before executing anything
    const validation = validateSql(rawSql);
    if (!validation.valid) {
      return res.status(422).json({
        error: `Generated SQL failed validation: ${validation.reason}`,
        sql: rawSql,
      });
    }

    const finalSql = enforceRowLimit(validation.sql, MAX_ROWS);

    // 3. Execute against the session's SQLite dataset
    const db = openDatasetDb(sessionId);
    let rows;
    try {
      rows = db.prepare(finalSql).all();
    } finally {
      db.close();
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // 4. Optional natural-language explanation
    let explanation = null;
    if (explain) {
      try {
        explanation = await explainResult(question, finalSql, rows, columns);
      } catch (e) {
        explanation = null; // explanation is best-effort, don't fail the request
      }
    }

    // 5. Store in session history
    addHistoryEntry(sessionId, {
      question,
      sql: finalSql,
      rowCount: rows.length,
      explanation,
    });

    res.json({
      question,
      sql: finalSql,
      columns,
      rows,
      rowCount: rows.length,
      explanation,
    });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: err.message || "Failed to process query." });
  }
});

export default router;
