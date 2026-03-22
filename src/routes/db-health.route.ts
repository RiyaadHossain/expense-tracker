import { Router } from "express";
import { prisma } from "../config/db.config";

const dbHealthRouter = Router();

dbHealthRouter.get("/db-health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

export default dbHealthRouter;
