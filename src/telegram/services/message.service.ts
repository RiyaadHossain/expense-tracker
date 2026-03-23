import { prisma } from "../../config/db.config";
import { ParseStatus, SourcePlatform } from "../../generated/prisma/enums";
import { TelegramMessagePayload } from "../telegram.types";
import { findOrCreateUserFromTelegram } from "./user.service";



export async function findOrCreateMessagingAccount(
  userId: string,
  payload: TelegramMessagePayload,
) {
  const existing = await prisma.messagingAccount.findFirst({
    where: {
      platform: SourcePlatform.TELEGRAM,
      platformUserId: String(payload.telegramUserId),
    },
  });

  if (existing) {
    // Optional: keep chatId / username fresh
    return prisma.messagingAccount.update({
      where: { id: existing.id },
      data: {
        platformChatId: String(payload.chatId),
        username: payload.username || 'unknown',
        isActive: true,
      },
    });
  }

  return prisma.messagingAccount.create({
    data: {
      userId,
      platform: SourcePlatform.TELEGRAM,
      platformUserId: String(payload.telegramUserId),
      platformChatId: String(payload.chatId),
      username: payload.username || 'unknown',
      isActive: true,
    },
  });
}

export async function saveIncomingTelegramParseEvent(
  userId: string,
  text: string,
) {
  return prisma.parseEvent.create({
    data: {
      userId,
      rawText: text,
      normalizedText: text.trim(),
      platform: SourcePlatform.TELEGRAM,
      status: ParseStatus.AUTO_SAVED,
    },
  });
}

export async function ingestTelegramMessage(payload: TelegramMessagePayload) {
  const user = await findOrCreateUserFromTelegram(payload);

  await findOrCreateMessagingAccount(user.id, payload);

  const parseEvent = await saveIncomingTelegramParseEvent(
    user.id,
    payload.text,
  );

  return {
    user,
    parseEvent,
  };
}
