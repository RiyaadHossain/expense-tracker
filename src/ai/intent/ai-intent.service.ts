import { gemini, GEMINI_MODEL } from "../gemini/gemini.client";
import { AiIntentSchema, type AiIntentResult } from "./ai-intent.schemas";

export async function detectAiIntent(input: {
  message: string;
  timezone?: string;
  currency?: string;
}): Promise<AiIntentResult> {
  const prompt = `
You are an AI finance assistant for a personal expense tracker Telegram bot.

Your job:
1. Classify the user's message intent
2. Extract structured fields if possible
3. If important information is missing, identify it
4. Return ONLY valid JSON matching the schema

Rules:
- The user may write in English, Bangla, mixed language, shorthand, slang, or messy text.
- Your reply should align with the user's messageing style.
- If the message implies spending, classify as CREATE_TRANSACTION with type=EXPENSE.
- If the message implies receiving money, classify as CREATE_TRANSACTION with type=INCOME.
- If the user asks for summaries/history, classify as REPORT.
- If the user asks for savings/budgeting/investment/spending analysis, classify as ADVICE.
- If the user message is ambiguous, set needsClarification=true.
- If missing important data for transaction creation, set missingFields accordingly.
- Desired json fields includes amount, currency, category, paymentMethod, date, type, note, description, tags
- If the 'amount' and 'category' are not clear then ask for a clear command with examples.
- clarificationMessage must be helpful, short, and natural with emojis.

User context:
- Timezone: ${input.timezone || "Asia/Dhaka"}
- Default currency: ${input.currency || "BDT"}

User message:
"${input.message}"

Return JSON only.
`;

  // See: https://ai.google.dev/gemini-api/docs/text-generation#javascript
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = response.text?.trim() || "{}";
  const parsed = JSON.parse(raw);

  return AiIntentSchema.parse(parsed);
}
