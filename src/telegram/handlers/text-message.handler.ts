import { Telegraf } from "telegraf";
import { ingestTelegramMessage } from "../services/telegram-message.service";
import { processParseEventToTransaction } from "../services/telegram-transaction.service";

export function registerTextMessageHandler(bot: Telegraf) {
  bot.on("text", async (ctx) => {
    const text = ctx.message.text;

    // Ignore slash commands
    if (text.startsWith("/")) return;

    try {
      const result = await ingestTelegramMessage({
        telegramUserId: ctx.from.id,
        chatId: ctx.chat.id,
        username: ctx.from.username || "unknown",
        firstName: ctx.from.first_name || "Anonymous",
        lastName: ctx.from.last_name || "User",
        text,
      });

      const processed = await processParseEventToTransaction(
        result.parseEvent.id,
      );

      if (!processed.success) {
        await ctx.reply(
          `⚠️ I saved your message, but I couldn't fully understand it.\n\n` +
            `Reason: ${processed.reason}\n\n` +
            `Try examples like:\n` +
            `- Spent 500 on groceries\n` +
            `- Uber 350\n` +
            `- Received 50000 salary`,
        );
        return;
      }

      const { transaction, category } = processed;

      const typeLabel = transaction?.type === "EXPENSE" ? "Expense" : "Income";

      await ctx.reply(
        `✅ ${typeLabel} saved successfully!\n\n` +
          `💰 Amount: ${transaction?.amount} BDT\n` +
          `📂 Category: ${category?.name}\n` +
          `📝 Note: ${transaction?.note || "-"}\n`,
      );
    } catch (error) {
      console.error("Error handling text message:", error);

      await ctx.reply(
        `❌ Something went wrong while processing your message.\n` +
          `🙃 Please try again.`,
      );
    }
  });
}
