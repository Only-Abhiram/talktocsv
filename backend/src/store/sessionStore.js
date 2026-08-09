// Simple in-memory session store.
// sessionId -> { columns, rowCount, fileName, history: [{question, sql, explanation, rowCount, createdAt}] }
const sessions = new Map();

export function createSession(sessionId, data) {
  sessions.set(sessionId, {
    ...data,
    history: [],
    createdAt: new Date().toISOString(),
  });
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function requireSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) {
    const err = new Error("Session not found. Please upload a CSV first.");
    err.status = 404;
    throw err;
  }
  return s;
}

export function addHistoryEntry(sessionId, entry) {
  const s = requireSession(sessionId);
  s.history.push({ ...entry, createdAt: new Date().toISOString() });
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}
