import express from "express";
import cors from "cors";
import predictRouter from "./routes/predict.js";
import hotspotsRouter from "./routes/hotspots.js";
import feedbackRouter from "./routes/feedback.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/predict", predictRouter);
app.use("/api/hotspots", hotspotsRouter);
app.use("/api/feedback", feedbackRouter);

app.use(errorHandler);
export default app;
