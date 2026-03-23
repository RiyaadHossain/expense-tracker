import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.config";

const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

export const gemini = new GoogleGenAI({
  apiKey,
});

export const GEMINI_MODEL = env.GEMINI_MODEL;
