import { useState, useRef } from "react";

export default function FileUpload({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a .csv file.");
      return;
    }
    onUpload(file);
  };

  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <p style={{ margin: 0, fontWeight: 600 }}>
        {uploading ? "Uploading…" : "Drop a CSV here or click to browse"}
      </p>
      <p className="muted" style={{ marginTop: 6 }}>Max 25MB</p>
    </div>
  );
}
