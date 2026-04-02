import { Telegraf } from "telegraf";
import { buildStartMessage } from "./command-menu";

export function registerStartCommand(bot: Telegraf) {
  bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name || "there";

    await ctx.reply(buildStartMessage(firstName), {
      parse_mode: "Markdown",
    });
  });
}
