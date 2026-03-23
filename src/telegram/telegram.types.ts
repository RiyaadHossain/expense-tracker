export interface TelegramMessagePayload {
  telegramUserId: number;
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
}
