import { Router } from "express";
import { requireSession, deleteSession } from "../store/sessionStore.js";
import { deleteDatasetDb } from "../services/dbEngine.js";

const router = Router();

router.get("/session/:id", (req, res) => {
  try {
    const session = requireSession(req.params.id);
    res.json({
      fileName: session.fileName,
      rowCount: session.rowCount,
      columns: session.columns,
      createdAt: session.createdAt,
    });
  } catch (err) {
    res.status(err.status || 404).json({ error: err.message });
  }
});

router.get("/session/:id/history", (req, res) => {
  try {
    const session = requireSession(req.params.id);
    res.json({ history: session.history });
  } catch (err) {
    res.status(err.status || 404).json({ error: err.message });
  }
});

router.delete("/session/:id", (req, res) => {
  try {
    requireSession(req.params.id);
    deleteDatasetDb(req.params.id);
    deleteSession(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 404).json({ error: err.message });
  }
});

export default router;
