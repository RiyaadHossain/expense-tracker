import { Telegraf } from "telegraf";
import { buildHelpMessage } from "./command-menu";

export function registerHelpCommand(bot: Telegraf) {
  bot.help(async (ctx) => {
    await ctx.reply(buildHelpMessage(), {
      parse_mode: "Markdown",
    });
  });
}
