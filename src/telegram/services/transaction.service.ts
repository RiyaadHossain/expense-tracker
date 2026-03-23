import { prisma } from "../../config/db.config";
import {
  ParseStatus,
  SourcePlatform,
  TransactionType,
} from "../../generated/prisma/enums";
import { CreateTelegramTransactionInput } from "../telegram.types";
import { parseTransactionFromText } from "../utils/parse-transaction-from-text";
import { findOrCreateMessagingAccount } from "./message.service";
import { findOrCreateUserFromTelegram } from "./user.service";

export async function findOrCreateCategory(userId: string, name: string) {
  const normalizedName = name?.trim()?.toLowerCase();

  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (existing) return existing;

  return prisma.category.create({
    data: {
      userId,
      name: normalizedName,
    },
  });
}

async function findOrCreatePaymentMethod(
  userId: string,
  paymentMethodName?: string | null,
) {
  if (!paymentMethodName?.trim()) return null;

  const normalizedName = paymentMethodName.trim();

  const existing = await prisma.paymentMethod.findFirst({
    where: {
      userId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (existing) return existing;

  return prisma.paymentMethod.create({
    data: {
      userId,
      name: normalizedName,
      type: "OTHER",
    },
  });
}

export async function processParseEventToTransaction(parseEventId: string) {
  const parseEvent = await prisma.parseEvent.findUnique({
    where: { id: parseEventId },
  });

  if (!parseEvent || !parseEvent.userId)
    throw new Error("ParseEvent not found.");

  const parsed = parseTransactionFromText(
    parseEvent.normalizedText || parseEvent.rawText,
  );

  if (
    !parsed.success ||
    !parsed.type ||
    !parsed.amount ||
    !parsed.categoryName
  ) {
    await prisma.parseEvent.update({
      where: { id: parseEvent.id },
      data: {
        status: ParseStatus.FAILED,
      },
    });

    return {
      success: false,
      reason: parsed.reason || "Failed to parse transaction.",
    };
  }

  const category = await findOrCreateCategory(
    parseEvent.userId!,
    parsed.categoryName,
  );

  const transaction = await prisma.transaction.create({
    data: {
      userId: parseEvent.userId,
      type:
        parsed.type === "EXPENSE"
          ? TransactionType.EXPENSE
          : TransactionType.INCOME,
      amount: parsed.amount,
      note: parsed.note as string,
      categoryId: category.id,
      rawInputText: parseEvent.rawText,
      sourcePlatform: SourcePlatform.TELEGRAM,
      transactionAt: new Date(),
    },
  });

  await prisma.parseEvent.update({
    where: { id: parseEvent.id },
    data: {
      status: ParseStatus.PARSED,
    },
  });

  return {
    success: true,
    transaction,
    category,
  };
}

export async function createTelegramTransaction(
  input: CreateTelegramTransactionInput,
) {
  const { telegramPayload, transaction } = input;

  // 1) Find or create user from Telegram
  const user = await findOrCreateUserFromTelegram(telegramPayload);

  // 2) Ensure messaging account stays synced
  await findOrCreateMessagingAccount(user.id, telegramPayload);

  // 3) Resolve optional related entities
  const [category, paymentMethod] = await Promise.all([
    findOrCreateCategory(user.id, transaction.categoryName),
    findOrCreatePaymentMethod(user.id, transaction.paymentMethodName),
  ]);

  // 4) Create transaction
  const createdTransaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currencyCode?.trim() || user.baseCurrency || "BDT",
      transactionAt: transaction.transactionAt,
      description: transaction.description.trim(),
      sourcePlatform: transaction.sourcePlatform,
      note: transaction.note?.trim() || null,

      categoryId: category?.id,
      paymentMethodId: paymentMethod?.id || null,

      tags: transaction.tags?.join(",") ?? "",
    },
    include: {
      category: true,
      paymentMethod: true,
    },
  });

  return {
    user,
    transaction: createdTransaction,
  };
}
