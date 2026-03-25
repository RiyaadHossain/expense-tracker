import { generateAdviceReply } from "../advice/advice.service";
import { detectAiIntent } from "../intent/ai-intent.service";
import { SourcePlatform, TransactionType } from "../../generated/prisma/enums";
import type { TelegramMessagePayload } from "../../telegram/telegram.types";
import { getTelegramUserReport } from "../../telegram/services/report.service";
import { createTelegramTransaction } from "../../telegram/services/transaction.service";
import { findOrCreateUserFromTelegram } from "../../telegram/services/user.service";
import {
  AiIntent,
  OrchestratorResult,
  OrchestratorResultKind,
} from "../ai.types";

export async function processTelegramMessageWithAI(
  payload: TelegramMessagePayload,
): Promise<OrchestratorResult> {
  const user = await findOrCreateUserFromTelegram(payload);

  const ai = await detectAiIntent({
    userId: user.id,
    message: payload.text,
    timezone: user.timezone || "Asia/Dhaka",
    currency: user.baseCurrency || "BDT",
  });

  // 1) Need clarification
  if (ai.needsClarification)
    return {
      kind: OrchestratorResultKind.REPLY,
      message:
        ai.clarificationMessage ||
        "Please try to provide full details (like: Lunch 500 cash)",
      parseMode: "Markdown",
    };

  // 2) Transaction creation
  if (
    ai.intent === AiIntent.CREATE_TRANSACTION &&
    ai.transaction?.type &&
    ai.transaction?.amount
  ) {
    const result = await createTelegramTransaction({
      telegramPayload: payload,
      transaction: {
        type:
          ai.transaction.type === TransactionType.EXPENSE
            ? TransactionType.EXPENSE
            : TransactionType.INCOME,
        amount: ai.transaction.amount,
        description: ai.transaction.description || "AI parsed transaction",
        note: ai.transaction.note || "AI parsed transaction",
        transactionAt: new Date(),
        categoryName: ai.transaction.categoryHint || "Generel",
        sourcePlatform: SourcePlatform.TELEGRAM,
        rawText: payload.text,
      },
    });

    const emoji =
      ai.transaction.type === TransactionType.EXPENSE ? "ðŸ’¸" : "ðŸ’°";
    const label =
      ai.transaction.type === TransactionType.EXPENSE ? "Expense" : "Income";

    return {
      kind: OrchestratorResultKind.TRANSACTION_SAVED,
      message:
        `${emoji} *${label} saved successfully!*\n\n` +
        `💵 Amount: *${ai.transaction.amount} ${user.baseCurrency || "BDT"}*\n` +
        `📝 Note: *${ai.transaction.note || "N/A"}*\n` +
        `🆔 ID: \`${result.transaction.id}\``,
      parseMode: "Markdown",
    };
  }

  // 3) Report
  if (ai.intent === AiIntent.REPORT) {
    const report = await getTelegramUserReport(user.id);

    return {
      kind: OrchestratorResultKind.REPORT,
      message:
        `📊 *Quick report generated!*\n\n` +
        `Today expense: *${report.todaySummary.totalExpense} ${user.baseCurrency || "BDT"}*\n` +
        `Today income: *${report.todaySummary.totalIncome} ${user.baseCurrency || "BDT"}*\n` +
        `This month expense: *${report.monthSummary.totalExpense} ${user.baseCurrency || "BDT"}*\n` +
        `This month income: *${report.monthSummary.totalIncome} ${user.baseCurrency || "BDT"}*`,
      parseMode: "Markdown",
    };
  }

  // 4) Advice
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
      `ðŸ¤– I understood your message, but Iâ€™m not fully sure what action to take yet.\n\n` +
      `Try:\n` +
      `• \`Spent 500 on groceries\`\n` +
      `• \`Received 12000 freelance payment\`\n` +
      `• \`Show this month report\`\n` +
      `• \`How can I save more money?\``,
    parseMode: "Markdown",
  };
}
