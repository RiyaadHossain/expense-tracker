import { Telegraf } from "telegraf";
import { env } from "../../config/env.config";
import { registerBotModules } from "./register-bot-modules";

export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
registerBotModules(bot);

async function startTelegramBot() {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help and examples" },
    { command: "cost", description: "Quick expense entry" },
    { command: "income", description: "Quick income entry" },
    { command: "report", description: "Show summary report" },
  ]);
}

await startTelegramBot();
