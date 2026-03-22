import { Telegraf } from "telegraf";

export function registerReportCommand(bot: Telegraf) {
  bot.command('report', async (ctx) => {
    await ctx.reply(
      `📊 Report (MVP placeholder)\n\n` +
        `Soon this will show:\n` +
        `- Today's expenses\n` +
        `- This month's income\n` +
        `- Balance summary\n` +
        `- Category breakdown`,
    );
  });
}