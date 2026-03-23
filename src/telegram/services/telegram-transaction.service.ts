import { prisma } from "../../config/db.config";
import {
  ParseStatus,
  SourcePlatform,
  TransactionType,
} from "../../generated/prisma/enums";
import { parseTransactionFromText } from "../utils/parse-transaction-from-text";

export async function findOrCreateCategory(userId: string, name: string) {
  const normalizedName = name.trim().toLowerCase();

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
