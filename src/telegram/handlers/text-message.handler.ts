import { Telegraf } from "telegraf";
import { ingestTelegramMessage } from "../services/telegram-message.service";

export function registerTextMessageHandler(bot: Telegraf) {
  bot.on("text", async (ctx) => {
    const text = ctx.message.text;

    // Important: ignore slash commands here, because commands are handled separately
    if (text.startsWith("/"))
      return;

    const result = await ingestTelegramMessage({
      telegramUserId: ctx.from.id,
      chatId: ctx.chat.id,
      username: ctx.from.username || "unknown",
      firstName: ctx.from.first_name || "Unknown",
      lastName: ctx.from.last_name || "",
      text,
    });

    await ctx.reply(
      `✅ Message recorded.\n` +
        `Event ID: ${result.parseEvent.id}\n\n` +
        `Next: we’ll parse and save it as a transaction.`,
    );
  });
}
