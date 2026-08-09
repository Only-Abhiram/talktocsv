import ResultTable from "./ResultTable.jsx";

export default function HistoryPanel({ entries }) {
  if (entries.length === 0) {
    return <p className="muted">Ask a question to see results here.</p>;
  }

  // Newest first
  const ordered = [...entries].reverse();

  return (
    <div>
      {ordered.map((entry, i) => (
        <div className="result-entry" key={i}>
          <div className="question">{entry.question}</div>

          {entry.error ? (
            <div className="error-box">{entry.error}</div>
          ) : (
            <>
              {entry.explanation && (
                <div className="explanation">{entry.explanation}</div>
              )}
              <details>
                <summary className="muted" style={{ cursor: "pointer" }}>
                  View SQL ({entry.rowCount} row{entry.rowCount === 1 ? "" : "s"})
                </summary>
                <div className="sql-block">{entry.sql}</div>
              </details>
              <ResultTable columns={entry.columns} rows={entry.rows} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
