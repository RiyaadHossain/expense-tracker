import { SourcePlatform, TransactionType } from "../generated/prisma/enums";

export interface TelegramMessagePayload {
  telegramUserId: number;
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
}

export interface CreateTelegramTransactionInput {
  telegramPayload: TelegramMessagePayload;
  transaction: {
    type: TransactionType;
    amount: number;
    description: string;
    note?: string | null;
    transactionAt: Date;
    currencyCode?: string | null;
    categoryName: string;
    paymentMethodName?: string | null;
    sourcePlatform: SourcePlatform;
    parseEventId?: string | null;
    tags?: string[];
    rawText?: string;
  };
}
