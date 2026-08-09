import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

let genAI = null;
if (apiKey) genAI = new GoogleGenerativeAI(apiKey);

function getModel() {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set on the backend.");
  }
  return genAI.getGenerativeModel({ model: modelName });
}

function schemaToPrompt(columns) {
  return columns
    .map((c) => `- ${c.name} (${c.type})${c.originalName !== c.name ? ` [original header: "${c.originalName}"]` : ""}`)
    .join("\n");
}

/**
 * Asks Gemini to translate a natural language question into a single
 * read-only SQLite SELECT query against the `dataset` table.
 */
export async function generateSql(question, columns, history = []) {
  const model = getModel();

  const historyContext = history.length
    ? `\nPrevious questions in this session (for context only, do not re-answer them):\n${history
        .slice(-5)
        .map((h) => `Q: ${h.question}\nSQL: ${h.sql}`)
        .join("\n\n")}`
    : "";

  const prompt = `You are a SQL generator for SQLite. There is exactly one table called "dataset" with these columns:
${schemaToPrompt(columns)}
${historyContext}

Rules:
- Output ONLY a single valid SQLite SELECT statement. No markdown, no backticks, no explanation, no semicolon needed but allowed.
- Only query the "dataset" table.
- Never use INSERT, UPDATE, DELETE, DROP, ALTER, ATTACH, PRAGMA, or any statement other than SELECT/WITH.
- Use double quotes for column names if needed.
- If the question is ambiguous, make a reasonable interpretation.
- If the question cannot be answered from the schema, return exactly: SELECT 'UNANSWERABLE' AS error;

Question: ${question}

SQL:`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Strip markdown code fences if the model adds them anyway
  text = text.replace(/^```sql\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  return text;
}

/**
 * Asks Gemini for a short natural-language explanation of the result set.
 */
export async function explainResult(question, sql, rows, columns) {
  const model = getModel();

  const preview = rows.slice(0, 20);
  const prompt = `You answered a user's question about a dataset by running SQL and getting results.

Question: ${question}
SQL used: ${sql}
Result columns: ${columns.join(", ")}
Result row count: ${rows.length}
Sample rows (up to 20): ${JSON.stringify(preview)}

Write a concise (2-4 sentence) natural language answer to the question based on these results.
Do not mention SQL or say "based on the query". Just answer directly and naturally.
If the result is empty, say so plainly.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
