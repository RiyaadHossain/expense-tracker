import { Telegraf } from "telegraf";

export function registerHelpCommand(bot: Telegraf) {
  bot.help(async (ctx) => {
    await ctx.reply(
      `📚 *Expense Tracker Bot Commands*\n\n` +
        `💸 *Expense*\n` +
        `• \`/cost 500 groceries\`\n` +
        `• \`/cost 300 transport cash\`\n\n` +
        `💰 *Income*\n` +
        `• \`/income 50000 salary\`\n` +
        `• \`/income 12000 freelance\`\n\n` +
        `📊 *Reports*\n` +
        `• \`/report\`\n\n` +
        `📝 *Natural text examples*\n` +
        `• Spent 500 on groceries today\n` +
        `• Received 50000 salary\n` +
        `• Show me this month's report\n\n` +
        `🚀 More features coming soon!`,
      {
        parse_mode: "Markdown",
      },
    );
  });
}
