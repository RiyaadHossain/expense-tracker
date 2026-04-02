import { generateAdviceReply } from "../advice/advice.service";
import { detectAiIntent } from "../intent/ai-intent.service";
import { SourcePlatform, TransactionType } from "../../generated/prisma/enums";
import type { TelegramMessagePayload } from "../../channels/telegram/telegram.types";
import { toTelegramMessagingProfile } from "../../channels/telegram/telegram.types";
import { getUserReport } from "../../modules/reports/report.service";
import { createTransactionFromMessage } from "../../modules/transactions/transaction.service";
import { findOrCreateUserFromMessagingProfile } from "../../modules/users/user.service";
import {
  AiIntent,
  OrchestratorResult,
  OrchestratorResultKind,
} from "../ai.types";

export async function processTelegramMessageWithAI(
  payload: TelegramMessagePayload,
): Promise<OrchestratorResult> {
  const profile = toTelegramMessagingProfile(payload);
  const user = await findOrCreateUserFromMessagingProfile(profile);

  const ai = await detectAiIntent({
    userId: user.id,
    message: payload.text,
    timezone: user.timezone || "Asia/Dhaka",
    currency: user.baseCurrency || "BDT",
  });

  if (ai.needsClarification)
    return {
      kind: OrchestratorResultKind.REPLY,
      message:
        ai.clarificationMessage ||
        "?? Please provide full details like: Lunch 500 cash",
      parseMode: "Markdown",
    };

  if (
    ai.intent === AiIntent.CREATE_TRANSACTION &&
    ai.transaction?.type &&
    ai.transaction?.amount
  ) {
    const result = await createTransactionFromMessage({
      profile,
      transaction: {
        type:
          ai.transaction.type === TransactionType.EXPENSE
            ? TransactionType.EXPENSE
            : TransactionType.INCOME,
        amount: ai.transaction.amount,
        description: ai.transaction.description || "AI parsed transaction",
        note: ai.transaction.note || "AI parsed transaction",
        transactionAt: new Date(),
        categoryName: ai.transaction.categoryHint || "general",
        sourcePlatform: SourcePlatform.TELEGRAM,
        rawText: payload.text,
      },
    });
    const label =
      ai.transaction.type === TransactionType.EXPENSE ? "?? Expense" : "?? Income";

    return {
      kind: OrchestratorResultKind.TRANSACTION_SAVED,
      message:
        `? *${label} saved successfully!*\n\n` +
        `?? Amount: *${ai.transaction.amount} ${user.baseCurrency || "BDT"}*\n` +
        `?? Note: *${ai.transaction.note || "N/A"}*\n` +
        `?? ID: \`${result.transaction.id}\``,
      parseMode: "Markdown",
    };
  }

  if (ai.intent === AiIntent.REPORT) {
    const report = await getUserReport(user.id);

    return {
      kind: OrchestratorResultKind.REPORT,
      message:
        `?? *Quick report generated!*\n\n` +
        `?? Today expense: *${report.todaySummary.totalExpense} ${user.baseCurrency || "BDT"}*\n` +
        `?? Today income: *${report.todaySummary.totalIncome} ${user.baseCurrency || "BDT"}*\n` +
        `??? This month expense: *${report.monthSummary.totalExpense} ${user.baseCurrency || "BDT"}*\n` +
        `?? This month income: *${report.monthSummary.totalIncome} ${user.baseCurrency || "BDT"}*`,
      parseMode: "Markdown",
    };
  }

  if (ai.intent === AiIntent.ADVICE) {
    return {
      kind: OrchestratorResultKind.REPLY,
      message: await generateAdviceReply({
        userId: user.id,
        currency: user.baseCurrency || "BDT",
        question: ai.advice?.userQuestion || payload.text,
      }),
      parseMode: "Markdown",
    };
  }

  return {
    kind: OrchestratorResultKind.REPLY,
    message:
      `?? I understood your message, but I am not fully sure what action to take yet.\n\n` +
      `? Try:\n` +
      `- \`Spent 500 on groceries\`\n` +
      `- \`Received 12000 freelance payment\`\n` +
      `- \`Show this month report\`\n` +
      `- \`How can I save more money?\``,
    parseMode: "Markdown",
  };
}
