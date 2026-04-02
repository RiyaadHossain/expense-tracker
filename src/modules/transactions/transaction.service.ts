import { prisma } from "../../config/db.config";
import {
  ParseStatus,
  TransactionType,
} from "../../generated/prisma/enums";
import { parseTransactionFromText } from "../../parser/parse-transaction-from-text";
import {
  CreateCommandTransactionInput,
  CreateMessageTransactionInput,
} from "../messaging/messaging.types";
import {
  findOrCreateMessagingAccount,
  saveIncomingParseEvent,
} from "../messaging/message.service";
import { findOrCreateUserFromMessagingProfile } from "../users/user.service";

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

export async function findOrCreatePaymentMethod(
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

  if (!parseEvent || !parseEvent.userId) {
    throw new Error("ParseEvent not found.");
  }

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
    parseEvent.userId,
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
      sourcePlatform: parseEvent.platform,
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

export async function createTransactionFromMessage(
  input: CreateMessageTransactionInput,
) {
  const { profile, transaction } = input;

  const user = await findOrCreateUserFromMessagingProfile(profile);

  await findOrCreateMessagingAccount(user.id, profile);

  const [category, paymentMethod] = await Promise.all([
    findOrCreateCategory(user.id, transaction.categoryName),
    findOrCreatePaymentMethod(user.id, transaction.paymentMethodName),
  ]);

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

export async function createTransactionFromCommand(
  input: CreateCommandTransactionInput,
) {
  const user = await findOrCreateUserFromMessagingProfile(input.profile);

  await findOrCreateMessagingAccount(user.id, input.profile);

  const parseEvent = await saveIncomingParseEvent(
    user.id,
    input.profile.platform,
    input.rawText,
  );

  try {
    const category = await findOrCreateCategory(
      user.id,
      input.categoryName ||
        (input.type === TransactionType.INCOME ? "income" : "misc"),
    );

    const paymentMethod = input.paymentMethod
      ? await findOrCreatePaymentMethod(user.id, input.paymentMethod)
      : null;

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: input.type,
        amount: input.amount,
        note: input.note || null,
        categoryId: category.id,
        paymentMethodId: paymentMethod?.id || null,
        rawInputText: input.rawText,
        sourcePlatform: input.profile.platform,
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
      user,
      parseEvent,
      category,
      transaction,
    };
  } catch (error) {
    await prisma.parseEvent.update({
      where: { id: parseEvent.id },
      data: {
        status: ParseStatus.FAILED,
      },
    });

    throw error;
  }
}

export async function getRecentTransactions(userId: string, limit = 10) {
  return prisma.transaction.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: [{ transactionAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      transactionAt: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function deleteTransactionById(
  userId: string,
  transactionId: string,
) {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
      isDeleted: false,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      transactionAt: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!transaction) return null;

  await prisma.transaction.update({
    where: {
      id: transaction.id,
    },
    data: {
      isDeleted: true,
    },
  });

  return transaction;
}

export async function deleteLatestTransaction(userId: string) {
  const latestTransaction = await prisma.transaction.findFirst({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: [{ transactionAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      transactionAt: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!latestTransaction) return null;

  await prisma.transaction.update({
    where: {
      id: latestTransaction.id,
    },
    data: {
      isDeleted: true,
    },
  });

  return latestTransaction;
}

