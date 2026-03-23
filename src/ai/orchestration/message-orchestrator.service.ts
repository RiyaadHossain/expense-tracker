import { detectAiIntent } from "../intent/ai-intent.service";
import { TransactionType } from "../../generated/prisma/enums";
import type { TelegramMessagePayload } from "../../telegram/telegram.types";
import { getTelegramUserReport } from "../../telegram/services/report.service";
import { createTelegramTransaction } from "../../telegram/services/transaction.service";
import { findOrCreateUserFromTelegram } from "../../telegram/services/user.service";

type OrchestratorResult =
  | { kind: "reply"; message: string; parseMode?: "Markdown" | "HTML" }
  | {
      kind: "transaction_saved";
      message: string;
      parseMode: "Markdown" | "HTML";
    }
  | { kind: "report"; message: string; parseMode?: "Markdown" | "HTML" };

export async function processTelegramMessageWithAI(
  payload: TelegramMessagePayload,
): Promise<OrchestratorResult> {
  const user = await findOrCreateUserFromTelegram(payload);

  const ai = await detectAiIntent({
    message: payload.text,
    timezone: user.timezone || "Asia/Dhaka",
    currency: user.baseCurrency || "BDT",
  });

  // 1) Need clarification
  if (ai.needsClarification)
    return {
      kind: "reply",
      message:
        ai.clarificationMessage ||
        "🤔 I need a bit more information to help you. Can you clarify?",
      parseMode: "Markdown",
    };

  // 2) Transaction creation
  if (
    ai.intent === "CREATE_TRANSACTION" &&
    ai.transaction?.type &&
    ai.transaction?.amount
  ) {
    const result = await createTelegramTransaction({
      telegramPayload: payload,
      transaction: {
        type:
          ai.transaction.type === "EXPENSE"
            ? TransactionType.EXPENSE
            : TransactionType.INCOME,
        amount: ai.transaction.amount,
        description: ai.transaction.description || "AI parsed transaction",
        note: ai.transaction.note || "AI parsed transaction",
        transactionAt: new Date(),
        categoryName: "General",
        sourcePlatform: "TELEGRAM",
        rawText: payload.text,
      },
    });

    const emoji = ai.transaction.type === "EXPENSE" ? "💸" : "💰";
    const label = ai.transaction.type === "EXPENSE" ? "Expense" : "Income";

    return {
      kind: "transaction_saved",
      message:
        `${emoji} *${label} saved successfully!*\n\n` +
        `💵 Amount: *${ai.transaction.amount} ${user.baseCurrency || "BDT"}*\n` +
        `📝 Note: *${ai.transaction.note || "N/A"}*\n` +
        `🆔 ID: \`${result.transaction.id}\``,
      parseMode: "Markdown",
    };
  }

  // 3) Report
  if (ai.intent === "REPORT") {
    const report = await getTelegramUserReport(user.id);

    return {
      kind: "report",
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
  if (ai.intent === "ADVICE") {
    return {
      kind: "reply",
      message:
        `🧠 I understood that you're asking for financial guidance.\n\n` +
        `Next step: I’ll analyze your transaction history and give personalized advice.`,
      parseMode: "Markdown",
    };
  }

  return {
    kind: "reply",
    message:
      `🤖 I understood your message, but I’m not fully sure what action to take yet.\n\n` +
      `Try:\n` +
      `• \`Spent 500 on groceries\`\n` +
      `• \`Received 12000 freelance payment\`\n` +
      `• \`Show this month report\`\n` +
      `• \`How can I save more money?\``,
    parseMode: "Markdown",
  };
}
