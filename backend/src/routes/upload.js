import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { upload } from "../middleware/upload.js";
import { parseCsv } from "../services/csvParser.js";
import { createDatasetDb } from "../services/dbEngine.js";
import { createSession } from "../store/sessionStore.js";

const router = Router();

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Field name must be 'file'." });
    }

    const { columns, rows } = parseCsv(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: "CSV has headers but no data rows." });
    }

    const sessionId = uuidv4();
    createDatasetDb(sessionId, columns, rows);

    createSession(sessionId, {
      fileName: req.file.originalname,
      columns,
      rowCount: rows.length,
    });

    res.json({
      sessionId,
      fileName: req.file.originalname,
      rowCount: rows.length,
      columns: columns.map((c) => ({ name: c.name, type: c.type, originalName: c.originalName })),
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(400).json({ error: err.message || "Failed to process CSV." });
  }
});

export default router;
