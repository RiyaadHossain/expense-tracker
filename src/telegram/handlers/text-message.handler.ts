import { Telegraf } from "telegraf";
import { processTelegramMessageWithAI } from "../../ai/orchestration/message-orchestrator.service";

export function registerTextMessageHandler(bot: Telegraf) {
  bot.on("text", async (ctx) => {
    const text = ctx.message.text;

    // Ignore slash commands here
    if (text.startsWith("/")) return;

    try {
      const result = await processTelegramMessageWithAI({
        telegramUserId: ctx.from.id,
        chatId: ctx.chat.id,
        username: ctx.from.username || "unknown",
        firstName: ctx.from.first_name || "Unknown",
        lastName: ctx.from.last_name || "",
        text,
      });

      await ctx.reply(result.message, {
        parse_mode: result.parseMode || "Markdown",
      });
    } catch (error) {
      console.error("AI text handler error:", error);

      await ctx.reply(
        `❌ *Something went wrong while processing your message.*\n\nPlease try again.`,
        { parse_mode: "Markdown" },
      );
    }
  });
}
