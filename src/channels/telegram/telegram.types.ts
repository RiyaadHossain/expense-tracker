import { SourcePlatform } from "../../generated/prisma/enums";
import { MessagingProfile } from "../../modules/messaging/messaging.types";

export interface TelegramMessagePayload {
  telegramUserId: number;
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
}

export function toTelegramMessagingProfile(
  payload: TelegramMessagePayload,
): MessagingProfile {
  return {
    platform: SourcePlatform.TELEGRAM,
    platformUserId: String(payload.telegramUserId),
    platformChatId: String(payload.chatId),
    username: payload.username || "unknown",
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    text: payload.text,
    timezone: "Asia/Dhaka",
    baseCurrency: "BDT",
    locale: "en-BD",
  };
}
