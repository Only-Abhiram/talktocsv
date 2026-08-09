import "dotenv/config";
import express from "express";
import cors from "cors";

import uploadRoute from "./routes/upload.js";
import queryRoute from "./routes/query.js";
import sessionRoute from "./routes/session.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", uploadRoute);
app.use("/api", queryRoute);
app.use("/api", sessionRoute);

// Central error handler (e.g. multer file-size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`NL2SQL backend running on http://localhost:${PORT}`);
});
