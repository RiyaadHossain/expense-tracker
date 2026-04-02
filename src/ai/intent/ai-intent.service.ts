import { gemini, GEMINI_MODEL } from "../gemini/gemini.client";
import { prisma } from "../../config/db.config";
import { AiIntentSchema, type AiIntentResult } from "./ai-intent.schemas";
import { AdviceTopic, AiIntent, MissingField, ReportPeriod, TransactionType } from "../ai.types";

export async function detectAiIntent(input: {
  userId?: string;
  message: string;
  timezone?: string;
  currency?: string;
}): Promise<AiIntentResult> {
  const [categories, paymentMethods] = await Promise.all([
    prisma.category.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.paymentMethod.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const categoryList =
    categories.map(({ name }) => name).join(", ") || "None yet";
  const paymentMethodList =
    paymentMethods.map(({ name }) => name).join(", ") || "None yet";

  const prompt = `
You are an AI finance assistant for a Telegram bot.

Classify intent: ${Object.values(AiIntent).join(" | ")}.

Extract structured fields. Set needsClarification=true if ambiguous. Set missingFields if data missing.

Use existing categories/payment methods or suggest new ones in hints.

Return ONLY valid JSON:

{
  intent,
  transaction: { type: ${Object.values(TransactionType).join(" | ")}, amount as number, currency, note, description, categoryHint, paymentMethodHint, occurredAtText },
  report: { period: ${Object.values(ReportPeriod).join(" | ")}, customStart, customEnd, includeRecentTransactions },
  advice: { topic: ${Object.values(AdviceTopic).join(" | ")}, userQuestion },
  missingFields as array of ${Object.values(MissingField).join(" | ")},
  needsClarification,
  clarificationMessage (add emojis and examples for better UX)
}

If provided message lacks very clear info about 'intent', 'amount' or 'category' only, set needsClarification=true and specify missingFields.
In that case clarificationMessage should ask user to provide the complete transaction details in a single sentence, preferably with an example. For example: "Please provide amount and category (e.g. Lunch 500 cash)".

User context:
- Timezone: ${input.timezone || "Asia/Dhaka"}
- Default currency: ${input.currency || "BDT"}
- Categories: ${categoryList}
- Payment methods: ${paymentMethodList}

Message: "${input.message}"

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
  console.log({ parsed });

  return AiIntentSchema.parse(parsed);
}
