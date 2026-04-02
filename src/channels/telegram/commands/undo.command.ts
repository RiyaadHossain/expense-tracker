import { Telegraf } from "telegraf";
import { SourcePlatform, TransactionType } from "../../../generated/prisma/enums";
import { deleteLatestTransaction } from "../../../modules/transactions/transaction.service";
import { findUserByPlatformUserId } from "../../../modules/users/user.service";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function registerUndoCommand(bot: Telegraf) {
  bot.command("undo", async (ctx) => {
    try {
      const user = await findUserByPlatformUserId(
        SourcePlatform.TELEGRAM,
        String(ctx.from.id),
      );

      if (!user) {
        await ctx.reply(
          `📭 *Nothing to undo yet.*\n\nAdd a transaction first with \`/cost\` or \`/income\`.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const transaction = await deleteLatestTransaction(user.id);

      if (!transaction) {
        await ctx.reply(
          `📭 *No active transaction found to undo.*\n\nRun \`/history\` to confirm your recent activity.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const currency = user.baseCurrency || "BDT";
      const label =
        transaction.type === TransactionType.EXPENSE ? "💸 Expense" : "💵 Income";

      await ctx.reply(
        `↩️ *Last transaction removed.*\n\n` +
          `${label}: 💰 ${formatAmount(Number(transaction.amount))} ${currency}\n` +
          `🏷️ Category: ${transaction.category.name}\n` +
          `📝 Note: ${transaction.note || "No note"}\n` +
          `🆔 ID: \`${transaction.id}\``,
        {
          parse_mode: "Markdown",
        },
      );
    } catch (error) {
      console.error("Error in /undo command:", error);

      await ctx.reply(
        `❌ *Could not undo your last transaction.*\n\nPlease try again.`,
        { parse_mode: "Markdown" },
      );
    }
  });
}