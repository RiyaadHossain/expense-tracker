import { Telegraf } from "telegraf";
import { TransactionType, SourcePlatform } from "../../../generated/prisma/enums";
import { createTransactionFromCommand } from "../../../modules/transactions/transaction.service";
import { toTelegramMessagingProfile } from "../telegram.types";

function parseCostCommand(input: string) {
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) return null;

  const amount = Number(parts[0]);
  if (Number.isNaN(amount) || amount <= 0) return null;

  const remainingParts = parts.slice(1);
  const categoryName = remainingParts[0]?.trim().toLowerCase() || "misc";
  const paymentMethod = remainingParts[1]?.trim() || "Not Detected";

  return {
    amount,
    categoryName,
    paymentMethod,
  };
}

export function registerCostCommand(bot: Telegraf) {
  bot.command("cost", async (ctx) => {
    try {
      const text = ctx.message.text.replace(/^\/cost(@\w+)?\s*/i, "").trim();
      const parsed = parseCostCommand(text);

      if (!parsed) {
        await ctx.reply(
          `❌ *Invalid format!*\n\n` +
            `Use something like:\n` +
            `- \`/cost 300 transport cash\`\n` +
            `- \`/cost 500 groceries bkash\`\n\n` +
            `💡 Format: \`/cost <amount> <category> <payment method>\``,
          {
            parse_mode: "Markdown",
          },
        );
        return;
      }

      const result = await createTransactionFromCommand({
        profile: toTelegramMessagingProfile({
          telegramUserId: ctx.from.id,
          chatId: ctx.chat.id,
          username: ctx.from.username || "unknown",
          firstName: ctx.from.first_name || "Anonymous",
          lastName: ctx.from.last_name || "User",
          text: ctx.message.text,
        }),
        rawText: ctx.message.text,
        type: TransactionType.EXPENSE,
        amount: parsed.amount,
        paymentMethod: parsed.paymentMethod,
        categoryName: parsed.categoryName,
      });

      if (!result.success) {
        await ctx.reply(`❌ Failed to save your expense. Please try again.`);
        return;
      }

      await ctx.reply(
        `✅ *Expense saved successfully!*\n\n` +
          `💸 Amount: 💰 ${result.transaction.amount} BDT\n` +
          `🏷️ Category: ${result.category.name}\n` +
          `📝 Note: ${result.transaction.note || "N/A"}\n` +
          `🆔 Event ID: \`${result.transaction.id}\`\n\n` +
          `📡 Source: ${SourcePlatform.TELEGRAM}`,
        {
          parse_mode: "Markdown",
        },
      );
    } catch (error) {
      console.error("Error in /cost command:", error);

      await ctx.reply(
        `❌ Something went wrong while saving your expense. Please try again in a moment.`,
      );
    }
  });
}