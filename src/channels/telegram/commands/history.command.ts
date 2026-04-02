import { Telegraf } from "telegraf";
import {
  SourcePlatform,
  TransactionType,
} from "../../../generated/prisma/enums";
import { getRecentTransactions } from "../../../modules/transactions/transaction.service";
import { findUserByPlatformUserId } from "../../../modules/users/user.service";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function registerHistoryCommand(bot: Telegraf) {
  bot.command("history", async (ctx) => {
    try {
      const user = await findUserByPlatformUserId(
        SourcePlatform.TELEGRAM,
        String(ctx.from.id),
      );

      if (!user) {
        await ctx.reply(
          `📭 *No transactions found yet.*\n\nAdd one with \`/cost\` or \`/income\` first.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const transactions = await getRecentTransactions(user.id, 10);

      if (transactions.length === 0) {
        await ctx.reply(
          `📭 *No active transactions to show.*\n\nTry \`/cost 500 groceries bkash\` or \`/income 50000 salary\`.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const currency = user.baseCurrency || "BDT";
      const lines = transactions
        .map((transaction, index) => {
          const label =
            transaction.type === TransactionType.EXPENSE
              ? "💸 Expense"
              : "💵 Income";

          return (
            `${index + 1}. *${label}* - *💰 ${formatAmount(Number(transaction.amount))} ${currency}*\n` +
            `🏷️ Category: ${transaction.category.name}\n` +
            `📝 Note: ${transaction.note || "No note"}\n` +
            `🆔 ID: \`${transaction.id}\`\n` +
            `🕒 Time: ${formatDateTime(transaction.transactionAt)}`
          );
        })
        .join("\n\n");

      await ctx.reply(`📜 *Last 10 Transactions*\n\n${lines}`, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error in /history command:", error);

      await ctx.reply(
        `❌ *Could not load your recent transactions.*\n\nPlease try again shortly.`,
        { parse_mode: "Markdown" },
      );
    }
  });
}
