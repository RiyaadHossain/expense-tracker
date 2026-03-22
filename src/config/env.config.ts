import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) throw new Error(`Missing required environment variable: ${name}`);

  return value;
}

export const env = {
  PORT: Number(process.env["PORT"] || 4000),
  NODE_ENV: process.env["NODE_ENV"] || "development",

  DATABASE_URL: required("DATABASE_URL"),
  TELEGRAM_BOT_TOKEN: process.env["TELEGRAM_BOT_TOKEN"] || "",
  APP_BASE_URL: process.env["APP_BASE_URL"] || "",
};
