# NL2SQL — Talk to your CSV

Upload a CSV → it's loaded into a per-session SQLite table called `dataset` →
ask questions in plain English → Gemini generates SQL → SQL is validated
(SELECT-only, single statement, `dataset`-only) → executed → results +
a short natural-language explanation are shown, and every Q&A is kept in
that session's history.

## Stack
- **Backend**: Node.js, Express, `better-sqlite3` (one SQLite file per upload
  session, stored in `backend/data/`), `csv-parse`, Gemini (`@google/generative-ai`).
- **Frontend**: React + Vite, plain CSS (no UI framework), axios.

## Architecture notes
- **Schema inference**: `csvParser.js` sniffs each column across the first
  1000 rows to decide INTEGER / REAL / TEXT, and sanitizes headers into safe
  SQLite identifiers (keeping the original header for display).
- **Session model**: each upload gets a `sessionId` (uuid). That id maps to
  its own `.sqlite` file on disk and an in-memory record (`sessionStore.js`)
  holding schema + Q&A history. No auth/multi-tenant concerns handled — this
  is single-user/dev-shaped by design; swap the in-memory store for Redis/DB
  if you need persistence across restarts or multiple backend instances.
- **SQL safety**: `sqlValidator.js` hard-rejects anything that isn't a single
  `SELECT`/`WITH` statement touching `dataset`, blocks DDL/DML keywords via
  regex, and force-adds a `LIMIT` if the model didn't include one. This is a
  deny-list, not a parser — good enough for a demo/internal tool, not
  bulletproof against a determined adversary. For production, consider
  parsing the SQL with a real grammar (e.g. `node-sql-parser`) and/or running
  queries against a read-only DB connection/user.
- **LLM boundary**: the model only ever sees the schema (column names +
  types), never the actual row data, when generating SQL. Row data is only
  sent back to the model afterward, for the optional explanation step, and
  only a capped preview (20 rows).

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# put your Gemini API key in .env (GEMINI_API_KEY=...)
npm run dev
```
Runs on `http://localhost:4000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` to the backend.

## API

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/upload` | `multipart/form-data`, field `file` | Parses CSV, creates session + SQLite table |
| POST | `/api/query` | `{ sessionId, question }` | NL question → SQL → results + explanation |
| GET | `/api/session/:id` | — | Session metadata + schema |
| GET | `/api/session/:id/history` | — | Full Q&A history for the session |
| DELETE | `/api/session/:id` | — | Deletes session + its SQLite file |

## Known gaps / things to harden before real use
- No auth — anyone with the URL can hit any `sessionId` they know.
- Sessions are in-memory; a backend restart loses history (the `.sqlite`
  files on disk survive, but aren't re-attached to a session automatically).
- No cleanup job for old `.sqlite` files in `backend/data/`.
- SQL validation is regex-based, not a real parser.
- `explainResult` is best-effort — if it throws, the query result still
  comes back with `explanation: null`.
