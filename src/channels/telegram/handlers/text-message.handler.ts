import { Telegraf } from "telegraf";
import { processTelegramMessageWithAI } from "../../../ai/orchestration/message-orchestrator.service";
import { buildAiLimitMessage } from "../commands/command-menu";

type ErrorLike = {
  message?: string;
  status?: number;
  code?: number;
  error?: ErrorLike;
};

function getErrorDetails(error: unknown): ErrorLike {
  if (!error || typeof error !== "object") return {};
  return error as ErrorLike;
}

function isGeminiFreeLimitError(error: unknown) {
  const topLevel = getErrorDetails(error);
  const nested =
    topLevel.error && typeof topLevel.error === "object"
      ? topLevel.error
      : undefined;
  const messages = [topLevel.message, nested?.message]
    .filter((message): message is string => Boolean(message))
    .map((message) => message.toLowerCase());

  return (
    topLevel.status === 429 ||
    topLevel.code === 429 ||
    nested?.status === 429 ||
    nested?.code === 429 ||
    messages.some(
      (message) =>
        message.includes("limit exceeded") ||
        message.includes("quota exceeded") ||
        message.includes("resource_exhausted") ||
        message.includes("generate_content_free_tier_requests"),
    )
  );
}

export function registerTextMessageHandler(bot: Telegraf) {
  bot.on("text", async (ctx) => {
    const text = ctx.message.text;

    const replySafely = async (
      message: string,
      parseMode?: "Markdown" | "HTML",
    ) => {
      try {
        return await ctx.reply(
          message,
          parseMode ? { parse_mode: parseMode } : undefined,
        );
      } catch (replyError) {
        console.error("Telegram reply formatting error:", replyError);
        return await ctx.reply(message);
      }
    };

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

      return await replySafely(result.message, result.parseMode || "Markdown");
    } catch (error) {
      if (isGeminiFreeLimitError(error)) {
        console.warn("Gemini free-tier quota reached:", error);
        return await replySafely(buildAiLimitMessage(), "Markdown");
      }

      console.error("AI text handler error:", error);

      return await ctx.reply(
        "❌ Something went wrong while processing your message.\n\nPlease try again.",
      );
    }
  });
}
