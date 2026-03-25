import { z } from "zod";
import {
  AdviceTopic,
  AiIntent,
  MissingField,
  ReportPeriod,
  TransactionType,
} from "../ai.types";

export const AiIntentSchema = z.object({
  intent: z.enum(AiIntent),
  confidence: z.number().min(0).max(1),
  
  transaction: z
    .object({
      type: z.enum(TransactionType).nullable(),
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
      period: z.enum(ReportPeriod).nullable(),
      customStart: z.string().nullable(),
      customEnd: z.string().nullable(),
      includeRecentTransactions: z.boolean().nullable(),
    })
    .nullable(),

  advice: z
    .object({
      topic: z.enum(AdviceTopic).nullable(),
      userQuestion: z.string().nullable(),
    })
    .nullable(),

  missingFields: z.array(z.enum(MissingField)),

  needsClarification: z.boolean(),

  clarificationMessage: z.string().nullable(),
});

export type AiIntentResult = z.infer<typeof AiIntentSchema>;
