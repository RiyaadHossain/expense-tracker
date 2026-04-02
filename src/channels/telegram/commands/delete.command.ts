import { Telegraf } from "telegraf";
import {
  SourcePlatform,
  TransactionType,
} from "../../../generated/prisma/enums";
import { deleteTransactionById } from "../../../modules/transactions/transaction.service";
import { findUserByPlatformUserId } from "../../../modules/users/user.service";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function registerDeleteCommand(bot: Telegraf) {
  bot.command("delete", async (ctx) => {
    try {
      const eventId = ctx.message.text
        .replace(/^\/delete(@\w+)?\s*/i, "")
        .trim();

      if (!eventId) {
        await ctx.reply(
          `❌ *Missing event ID.*\n\nUse it like this:\n- \`/delete <event_id>\`\n\n💡 Tip: run \`/history\` to copy the right ID.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const user = await findUserByPlatformUserId(
        SourcePlatform.TELEGRAM,
        String(ctx.from.id),
      );

      if (!user) {
        await ctx.reply(
          `📭 *No transactions found yet.*\n\nAdd one first, then use \`/history\` to manage it.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const transaction = await deleteTransactionById(user.id, eventId);

      if (!transaction) {
        await ctx.reply(
          `📭 *No active transaction found for that event ID.*\n\nRun \`/history\` and try again with one of the listed IDs.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const currency = user.baseCurrency || "BDT";
      const label =
        transaction.type === TransactionType.EXPENSE
          ? "💸 Expense"
          : "💵 Income";

      await ctx.reply(
        `🗑️ *Transaction deleted successfully.*\n\n` +
          `${label}: 💰 ${formatAmount(Number(transaction.amount))} ${currency}\n` +
          `🏷️ Category: ${transaction.category.name}\n` +
          `📝 Note: ${transaction.note || "No note"}\n` +
          `🆔 ID: \`${transaction.id}\``,
        {
          parse_mode: "Markdown",
        },
      );
    } catch (error) {
      console.error("Error in /delete command:", error);

      await ctx.reply(
        `❌ *Could not delete that transaction.*\n\nPlease try again.`,
        {
          parse_mode: "Markdown",
        },
      );
    }
  });
}
