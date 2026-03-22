import { Telegraf } from "telegraf";

function parseIncomeCommand(input: string) {
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) 
    return null;

  const amount = Number(parts[0]);
  if (Number.isNaN(amount) || amount <= 0) 
    return null;

  const note = parts.slice(1).join(' ').trim();

  return {
    amount,
    note,
  };
}

export function registerIncomeCommand(bot: Telegraf) {
  bot.command('income', async (ctx) => {
    const text = ctx.message.text.replace(/^\/income(@\w+)?\s*/i, '');
    const parsed = parseIncomeCommand(text);

    if (!parsed) {
      await ctx.reply(
        `Invalid format.\n\n` +
          `Use:\n` +
          `/income 50000 salary\n\n` +
          `Example:\n` +
          `/income 12000 freelance`,
      );
      return;
    }

    await ctx.reply(
      `💰 Income command received\n` +
        `Amount: ${parsed.amount} BDT\n` +
        `Note: ${parsed.note || 'N/A'}\n\n` +
        `Next step: we will save this as a real income transaction.`,
    );
  });
}