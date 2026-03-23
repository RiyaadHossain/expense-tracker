import { Telegraf } from "telegraf";
import { TransactionType } from "../../generated/prisma/enums";
import { createTransactionFromTelegramCommand } from "../services/command-transaction.service";

function parseCostCommand(input: string) {
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) return null;

  const amount = Number(parts[0]);
  if (Number.isNaN(amount) || amount <= 0) return null;

  const remainingParts = parts.slice(1);

  // For MVP:
  // first word after amount = category
  // rest = note
  const categoryName = remainingParts[0]?.trim().toLowerCase() || "misc";
  const note = remainingParts.join(" ").trim();

  return {
    amount,
    categoryName,
    note,
  };
}

export function registerCostCommand(bot: Telegraf) {
  bot.command("cost", async (ctx) => {
    try {
      const text = ctx.message.text.replace(/^\/cost(@\w+)?\s*/i, "").trim();
      const parsed = parseCostCommand(text);

      if (!parsed) {
        await ctx.reply(
          `⚠️ *Invalid format!*\n\n` +
            `✅ Use something like:\n` +
            `• \`/cost 300 transport cash\`\n` +
            `• \`/cost 500 groceries bkash\`\n\n` +
            `💡 Format: \`/cost <amount> <note>\``,
          {
            parse_mode: "Markdown",
          },
        );
        return;
      }

      const result = await createTransactionFromTelegramCommand({
        payload: {
          telegramUserId: ctx.from.id,
          chatId: ctx.chat.id,
          username: ctx.from.username || "unknown",
          firstName: ctx.from.first_name || "Anonymous",
          lastName: ctx.from.last_name || "User",
          text: ctx.message.text,
        },
        rawText: ctx.message.text,
        type: TransactionType.EXPENSE,
        amount: parsed.amount,
        note: parsed.note,
        categoryName: parsed.categoryName,
      });

      if (!result.success) {
        await ctx.reply(
          `❌ Failed to save your expense.\n` + `Please try again.`,
        );
        return;
      }

      await ctx.reply(
        `✅ 💸 Expense saved successfully!\n\n` +
          `💰 Amount: ${result.transaction.amount} BDT\n` +
          `📂 Category: ${result.category.name}\n` +
          `📝 Note: ${result.transaction.note || "N/A"}\n` +
          `🆔 Event ID: ${result.parseEvent.id}\n\n` +
          `🎯 Keep going — your spending is being tracked!`,
      );
    } catch (error) {
      console.error("Error in /cost command:", error);

      await ctx.reply(
        `❌ Something went wrong while saving your expense.\n` +
          `Please try again in a moment.`,
      );
    }
  });
}
