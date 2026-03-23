import { Telegraf } from "telegraf";
import { TransactionType } from "../../generated/prisma/enums";
import { findUserByTelegramUserId } from "../services/user.service";
import { getTelegramUserReport } from "../services/report.service";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function registerReportCommand(bot: Telegraf) {
  bot.command("report", async (ctx) => {
    try {
      const telegramUserId = ctx.from.id;

      const user = await findUserByTelegramUserId(telegramUserId);

      if (!user) {
        await ctx.reply(
          `📭 *No data found yet!*\n\n` +
            `You haven’t added any transactions yet.\n\n` +
            `Try one of these:\n` +
            `• \`/cost 500 groceries\`\n` +
            `• \`/income 50000 salary\`\n` +
            `• \`Spent 300 on transport\``,
          {
            parse_mode: "Markdown",
          },
        );
        return;
      }

      const report = await getTelegramUserReport(user.id);

      const currency = user.baseCurrency || "BDT";

      const recentLines =
        report.recentTransactions.length === 0
          ? `No transactions yet.`
          : report.recentTransactions
              .map((tx, index) => {
                const emoji = tx.type === TransactionType.EXPENSE ? "💸" : "💰";
                const label =
                  tx.type === TransactionType.EXPENSE ? "Expense" : "Income";

                return (
                  `${index + 1}. ${emoji} *${label}* — *${formatAmount(Number(tx.amount))} ${currency}*\n` +
                  `   📝 ${tx.note || "No note"}\n` +
                  `   🕒 ${formatTime(tx.transactionAt)}`
                );
              })
              .join("\n\n");

      const message =
        `📊 *Your Expense Report*\n\n` +
        `📅 *Today*\n` +
        `• 💸 Expense: *${formatAmount(report.todaySummary.totalExpense)} ${currency}*\n` +
        `• 💰 Income: *${formatAmount(report.todaySummary.totalIncome)} ${currency}*\n` +
        `• 🧮 Balance: *${formatAmount(report.todaySummary.balance)} ${currency}*\n` +
        `• 🔢 Entries: *${report.todaySummary.totalCount}*\n\n` +
        `🗓️ *This Month*\n` +
        `• 💸 Expense: *${formatAmount(report.monthSummary.totalExpense)} ${currency}*\n` +
        `• 💰 Income: *${formatAmount(report.monthSummary.totalIncome)} ${currency}*\n` +
        `• 🧮 Balance: *${formatAmount(report.monthSummary.balance)} ${currency}*\n` +
        `• 🔢 Entries: *${report.monthSummary.totalCount}*\n\n` +
        `🧾 *Last 5 Transactions*\n` +
        `${recentLines}`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error in /report command:", error);

      await ctx.reply(
        `❌ *Failed to generate report.*\n\n` + `Please try again later.`,
        {
          parse_mode: "Markdown",
        },
      );
    }
  });
}
