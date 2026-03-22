import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRouter from "./routes/health.route";


const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
// app.use(pinoHttp());

// Routes
app.use("/api/v1", healthRouter);

export default app;
