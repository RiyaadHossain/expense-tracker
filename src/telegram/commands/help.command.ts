import { Telegraf } from "telegraf";

export function registerHelpCommand(bot: Telegraf) {
  bot.help(async (ctx) => {
    await ctx.reply(
      `Available commands:\n\n` +
        `/start - Start the bot and see examples\n` +
        `/help - Show command help\n` +
        `/cost <amount> <note> - Quick expense entry\n` +
        `/income <amount> <note> - Quick income entry\n` +
        `/report - Show your summary report\n\n` +
        `Examples:\n` +
        `/cost 300 transport\n` +
        `/income 50000 salary`,
    );
  });
}
