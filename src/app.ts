import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRouter from "./routes/health.route";
import dbHealthRouter from "./routes/db-health.route";
import { bot } from "./telegram/bot";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
// app.use(pinoHttp());

// Routes
app.use("/api/v1", healthRouter);
app.use("/api/v1", dbHealthRouter);

// Start Telegram bot (polling)
bot
  .launch()
  .then(() => console.log("Telegram bot launched successfully!"))
  .catch(console.error);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default app;
