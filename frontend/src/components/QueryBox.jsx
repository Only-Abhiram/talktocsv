import { useState } from "react";

export default function QueryBox({ onAsk, loading }) {
  const [question, setQuestion] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    onAsk(question.trim());
    setQuestion("");
  };

  return (
    <form className="query-form" onSubmit={submit}>
      <input
        type="text"
        placeholder="Ask a question about your data…"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !question.trim()}>
        {loading ? "Thinking…" : "Ask"}
      </button>
    </form>
  );
}
