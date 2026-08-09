import { useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import QueryBox from "./components/QueryBox.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import { uploadCsv, runQuery } from "./api/client.js";

export default function App() {
  const [session, setSession] = useState(null); // { sessionId, fileName, rowCount, columns }
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [entries, setEntries] = useState([]); // local q&a feed
  const [asking, setAsking] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadError(null);
    try {
      const data = await uploadCsv(file);
      setSession({
        sessionId: data.sessionId,
        fileName: data.fileName,
        rowCount: data.rowCount,
        columns: data.columns,
      });
      setEntries([]);
    } catch (err) {
      setUploadError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (question) => {
    setAsking(true);
    try {
      const data = await runQuery(session.sessionId, question);
      setEntries((prev) => [...prev, data]);
    } catch (err) {
      setEntries((prev) => [
        ...prev,
        {
          question,
          error: err.response?.data?.error || "Something went wrong running that query.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Talk to your CSV <span style={{ color: "#ff6b6b" }}>like it owes you answers.</span></h1>
        <p >Upload a CSV, ask questions in plain English, get SQL-backed answers.</p>
      </div>

      {!session ? (
        <div className="card">
          <FileUpload onUpload={handleUpload} uploading={uploading} />
          {uploadError && (
            <div className="error-box" style={{ marginTop: 12 }}>{uploadError}</div>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="dataset-meta">
              <span>
                <strong>{session.fileName}</strong> · {session.rowCount} rows
              </span>
              <button onClick={() => setSession(null)}>New file</button>
            </div>
            <div className="schema-list">
              {session.columns.map((c) => (
                <span className="schema-pill" key={c.name}>
                  {c.name} <span className="muted">· {c.type}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <QueryBox onAsk={handleAsk} loading={asking} />
          </div>

          <div className="card">
            <HistoryPanel entries={entries} />
          </div>
        </>
      )}
    </div>
  );
}
