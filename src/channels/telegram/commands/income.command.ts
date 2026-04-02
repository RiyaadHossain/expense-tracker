import { Telegraf } from "telegraf";
import { TransactionType } from "../../../generated/prisma/enums";
import { createTransactionFromCommand } from "../../../modules/transactions/transaction.service";
import { toTelegramMessagingProfile } from "../telegram.types";

function parseIncomeCommand(input: string) {
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) return null;

  const amount = Number(parts[0]);
  if (Number.isNaN(amount) || amount <= 0) return null;

  const remainingParts = parts.slice(1);
  const categoryName = remainingParts[0]?.trim().toLowerCase() || "income";
  const note = remainingParts.join(" ").trim();

  return {
    amount,
    categoryName,
    note,
  };
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function registerIncomeCommand(bot: Telegraf) {
  bot.command("income", async (ctx) => {
    try {
      const text = ctx.message.text.replace(/^\/income(@\w+)?\s*/i, "").trim();
      const parsed = parseIncomeCommand(text);

      if (!parsed) {
        await ctx.reply(
          `❌ *Invalid format!*\n\n` +
            `Use something like:\n` +
            `- \`/income 50000 salary\`\n` +
            `- \`/income 12000 freelance\`\n\n` +
            `💡 Format: \`/income <amount> <source> <note>\``,
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
        type: TransactionType.INCOME,
        amount: parsed.amount,
        note: parsed.note,
        categoryName: parsed.categoryName,
      });

      if (!result.success) {
        await ctx.reply(`❌ Failed to save your income. Please try again.`);
        return;
      }

      await ctx.reply(
        `✅ *Income saved successfully!*\n\n` +
          `💵 Amount: 💰 ${formatAmount(Number(result.transaction.amount))} BDT\n` +
          `🏷️ Category: ${result.category.name}\n` +
          `📝 Note: ${result.transaction.note || "N/A"}\n` +
          `🆔 Event ID: \`${result.transaction.id}\``,
        {
          parse_mode: "Markdown",
        },
      );
    } catch (error) {
      console.error("Error in /income command:", error);

      await ctx.reply(
        `❌ Something went wrong while saving your income. Please try again in a moment.`,
      );
    }
  });
}
