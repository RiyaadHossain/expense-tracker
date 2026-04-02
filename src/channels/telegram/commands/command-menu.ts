export const TELEGRAM_COMMANDS = {
  costExamples: ["/cost 500 groceries bkash", "/cost 300 transport cash"],
  incomeExamples: ["/income 50000 salary", "/income 12000 freelance"],
  reportExamples: ["/report"],
  historyExamples: ["/history"],
  deleteExamples: ["/delete <event_id>"],
  undoExamples: ["/undo"],
  naturalTextExamples: [
    "Spent 500 on groceries today",
    "Received 50000 salary",
    "Show me this month's report",
  ],
};

const PRIMARY_COMMANDS = {
  cost: "/cost 500 groceries bkash",
  income: "/income 50000 salary",
  report: "/report",
  history: "/history",
  delete: "/delete <event_id>",
  undo: "/undo",
};

function formatCommandList(commands: string[]) {
  return commands.map((command) => `• \`${command}\``).join("\n");
}

function formatTextList(lines: string[]) {
  return lines.map((line) => `• ${line}`).join("\n");
}

export function buildHelpMessage() {
  return (
    `📘 *Expense Tracker Bot Commands*\n\n` +
    `💸 *Expenses*\n` +
    `${formatCommandList(TELEGRAM_COMMANDS.costExamples)}\n\n` +
    `💵 *Income*\n` +
    `${formatCommandList(TELEGRAM_COMMANDS.incomeExamples)}\n\n` +
    `📊 *Reports*\n` +
    `${formatCommandList(TELEGRAM_COMMANDS.reportExamples)}\n\n` +
    `📜 *History*\n` +
    `${formatCommandList(TELEGRAM_COMMANDS.historyExamples)}\n\n` +
    `🗑️ *Delete by Event ID*\n` +
    `${formatCommandList(TELEGRAM_COMMANDS.deleteExamples)}\n\n` +
    `↩️ *Undo Last Transaction*\n` +
    `${formatCommandList(TELEGRAM_COMMANDS.undoExamples)}\n\n` +
    `🤖 *Natural text examples*\n` +
    `${formatTextList(TELEGRAM_COMMANDS.naturalTextExamples)}`
  );
}

export function buildStartMessage(firstName: string) {
  return (
    `👋 Hello ${firstName}!\n\n` +
    `💰 Welcome to *Expense Tracker Bot*.\n\n` +
    `You can log your money in *2 simple ways*:\n\n` +
    `🤖 *1) Natural text*\n` +
    `${formatTextList(TELEGRAM_COMMANDS.naturalTextExamples)}\n\n` +
    `⌨️ *2) Commands*\n` +
    `${formatCommandList([
      PRIMARY_COMMANDS.cost,
      PRIMARY_COMMANDS.income,
      PRIMARY_COMMANDS.report,
      PRIMARY_COMMANDS.history,
      PRIMARY_COMMANDS.undo,
    ])}\n\n` +
    `📘 Use /help to see all available commands.`
  );
}

export function buildAiLimitMessage() {
  return (
    `⚠️ *Free AI limit reached for now.*\n\n` +
    `You can still use these commands:\n` +
    `${formatCommandList([
      PRIMARY_COMMANDS.cost,
      PRIMARY_COMMANDS.income,
      PRIMARY_COMMANDS.report,
      PRIMARY_COMMANDS.history,
      PRIMARY_COMMANDS.delete,
      PRIMARY_COMMANDS.undo,
      "/help",
    ])}\n\n` +
    `🕒 Please try AI messages again a bit later.`
  );
}
