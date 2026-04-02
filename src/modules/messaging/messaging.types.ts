import { SourcePlatform, TransactionType } from "../../generated/prisma/enums";

export interface MessagingProfile {
  platform: SourcePlatform;
  platformUserId: string;
  platformChatId?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  text?: string;
  timezone?: string;
  baseCurrency?: string;
  locale?: string;
}

export interface CreateMessageTransactionInput {
  profile: MessagingProfile;
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

export interface CreateCommandTransactionInput {
  profile: MessagingProfile;
  rawText: string;
  type: TransactionType;
  amount: number;
  note?: string;
  categoryName?: string;
  paymentMethod?: string;
}
