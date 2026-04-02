import { z } from "zod";
import {
  AdviceTopic,
  AiIntent,
  MissingField,
  ReportPeriod,
  TransactionType,
} from "../ai.types";

export const AiIntentSchema = z.object({
  intent: z.enum(AiIntent).nullable(),

  transaction: z
    .object({
      type: z.enum(TransactionType).optional().nullable(),
      amount: z.number().positive().optional().nullable(),
      currency: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      categoryHint: z.string().optional().nullable(),
      paymentMethodHint: z.string().optional().nullable(),

    })
    .optional()
    .nullable(),

  report: z
    .object({
      period: z.enum(ReportPeriod).optional().nullable(),
      customStart: z.string().optional().nullable(),
      customEnd: z.string().optional().nullable(),
      includeRecentTransactions: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),

  advice: z
    .object({
      topic: z.enum(AdviceTopic).optional().nullable(),
      userQuestion: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),

  missingFields: z.array(z.enum(MissingField)).optional().nullable(),

  needsClarification: z.boolean(),

  clarificationMessage: z.string().optional().nullable(),
});

export type AiIntentResult = z.infer<typeof AiIntentSchema>;
