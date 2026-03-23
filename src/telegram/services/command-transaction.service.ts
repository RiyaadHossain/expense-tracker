import { prisma } from "../../config/db.config";
import {
  ParseStatus,
  SourcePlatform,
  TransactionType,
} from "../../generated/prisma/enums";
import {
  findOrCreateUserFromTelegram,
  findOrCreateMessagingAccount,
} from "./message.service";
import { TelegramMessagePayload } from "../telegram.types";

interface CreateTelegramCommandTransactionInput {
  payload: TelegramMessagePayload;
  rawText: string;
  type: TransactionType;
  amount: number;
  note: string;
  categoryName?: string;
}

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

export async function saveCommandParseEvent(userId: string, rawText: string) {
  return prisma.parseEvent.create({
    data: {
      userId,
      rawText,
      normalizedText: rawText.trim(),
      platform: SourcePlatform.TELEGRAM,
      status: ParseStatus.AUTO_SAVED,
    },
  });
}

export async function createTransactionFromTelegramCommand(
  input: CreateTelegramCommandTransactionInput,
) {
  const user = await findOrCreateUserFromTelegram(input.payload);

  await findOrCreateMessagingAccount(user.id, input.payload);

  const parseEvent = await saveCommandParseEvent(user.id, input.rawText);

  try {
    const category = await findOrCreateCategory(
      user.id,
      input.categoryName ||
        (input.type === TransactionType.INCOME ? "income" : "misc"),
    );

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: input.type,
        amount: input.amount,
        note: input.note || null,
        categoryId: category.id,
        rawInputText: input.rawText,
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
