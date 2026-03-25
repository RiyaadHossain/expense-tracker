import { Telegraf } from "telegraf";
import { processTelegramMessageWithAI } from "../../ai/orchestration/message-orchestrator.service";

function isGeminiFreeLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    message?: string;
    status?: number;
    code?: number;
  };

  return maybeError.code === 429;
}

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

      // ToDo: organize income, cost and report command (align with ai response) || Add more commands: show last 10 transaction, delete transaction with tran_id

      return await ctx.reply(result.message, {
        parse_mode: result.parseMode || "Markdown",
      });
    } catch (error) {
      if (isGeminiFreeLimitError(error))
        return await ctx.reply(
          `⚠️ *Free AI limit reached for now.*\n\nYou can still use these commands:\n` +
            `• \`/cost 500 groceries\`\n` +
            `• \`/income 50000 salary\`\n` +
            `• \`/report\`\n` +
            `• \`/help\`\n\n` +
            `Please try AI messages again a bit later.`,
          {
          parse_mode: "Markdown",
          },
        );

      console.error("AI text handler error:", error);

      return await ctx.reply(
        `❌ *Something went wrong while processing your message.*\n\nPlease try again.`,
        { parse_mode: "Markdown" },
      );
    }
  });
}
