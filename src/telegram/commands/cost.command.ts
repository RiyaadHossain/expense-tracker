import { Telegraf } from "telegraf";

function parseCostCommand(input: string) {
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) 
    return null;

  const amount = Number(parts[0]);
  if (Number.isNaN(amount) || amount <= 0) {
    return null;
  }

  const note = parts.slice(1).join(" ").trim();

  return {
    amount,
    note,
  };
}

export function registerCostCommand(bot: Telegraf) {
  bot.command("cost", async (ctx) => {
    const text = ctx.message.text.replace(/^\/cost(@\w+)?\s*/i, "");
    const parsed = parseCostCommand(text);

    if (!parsed) {
      await ctx.reply(
        `Invalid format.\n\n` +
          `Use:\n` +
          `/cost 300 transport\n\n` +
          `Example:\n` +
          `/cost 500 groceries`,
      );
      return;
    }

    await ctx.reply(
      `💸 Expense command received\n` +
        `Amount: ${parsed.amount} BDT\n` +
        `Note: ${parsed.note || "N/A"}\n\n` +
        `Next step: we will save this as a real expense transaction.`,
    );
  });
}
