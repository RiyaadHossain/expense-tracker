import { Telegraf } from "telegraf";

export function registerStartCommand(bot: Telegraf) {
  bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name || "there";

    await ctx.reply(
      `👋 Hello ${firstName}!\n\n` +
        `🤖 Welcome to *Expense Tracker Bot*.\n\n` +
        `You can log your money in *2 simple ways*:\n\n` +
        `📝 *1) Natural text*\n` +
        `• Spent 500 on groceries today\n` +
        `• Received 50000 salary\n\n` +
        `⌨️ *2) Commands*\n` +
        `• /cost 500 groceries\n` +
        `• /income 50000 salary\n` +
        `• /report\n\n` +
        `📌 Use /help to see all available commands.`,
      {
        parse_mode: "Markdown",
      },
    );
  });
}
