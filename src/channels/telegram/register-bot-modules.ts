import { Telegraf } from "telegraf";
import { registerStartCommand } from "./commands/start.command";
import { registerHelpCommand } from "./commands/help.command";
import { registerCostCommand } from "./commands/cost.command";
import { registerIncomeCommand } from "./commands/income.command";
import { registerReportCommand } from "./commands/report.command";
import { registerHistoryCommand } from "./commands/history.command";
import { registerDeleteCommand } from "./commands/delete.command";
import { registerUndoCommand } from "./commands/undo.command";
import { registerTextMessageHandler } from "./handlers/text-message.handler";

export function registerBotModules(bot: Telegraf) {
  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerCostCommand(bot);
  registerIncomeCommand(bot);
  registerReportCommand(bot);
  registerHistoryCommand(bot);
  registerDeleteCommand(bot);
  registerUndoCommand(bot);
  registerTextMessageHandler(bot);
}
