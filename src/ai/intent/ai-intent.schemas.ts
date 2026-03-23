import { z } from "zod";

export const AiIntentSchema = z.object({
  intent: z.enum([
    "CREATE_TRANSACTION",
    "REPORT",
    "ADVICE",
    "HELP",
    "UPDATE_TRANSACTION",
    "DELETE_TRANSACTION",
    "CLARIFY_MISSING_INFO",
    "UNKNOWN",
  ]),
  confidence: z.number().min(0).max(1),

  transaction: z
    .object({
      type: z.enum(["EXPENSE", "INCOME"]).nullable(),
      amount: z.number().positive().nullable(),
      currency: z.string().nullable(),
      note: z.string().nullable(),
      description: z.string().nullable(),
      categoryHint: z.string().nullable(),
      paymentMethodHint: z.string().nullable(),
      occurredAtText: z.string().nullable(), // e.g. "today", "yesterday", "last night"
    })
    .nullable(),

  report: z
    .object({
      period: z
        .enum(["TODAY", "YESTERDAY", "THIS_WEEK", "THIS_MONTH", "CUSTOM"])
        .nullable(),
      customStart: z.string().nullable(),
      customEnd: z.string().nullable(),
      includeRecentTransactions: z.boolean().nullable(),
    })
    .nullable(),

  advice: z
    .object({
      topic: z
        .enum([
          "SAVE_MONEY",
          "COST_CUTTING",
          "BUDGETING",
          "INVESTMENT_IDEAS",
          "SPENDING_ANALYSIS",
          "GENERAL_FINANCIAL_GUIDANCE",
        ])
        .nullable(),
      userQuestion: z.string().nullable(),
    })
    .nullable(),

  missingFields: z.array(
    z.enum(["amount", "type", "note", "date", "period", "topic", "category"]),
  ),

  needsClarification: z.boolean(),

  clarificationMessage: z.string().nullable(),
});

export type AiIntentResult = z.infer<typeof AiIntentSchema>;
