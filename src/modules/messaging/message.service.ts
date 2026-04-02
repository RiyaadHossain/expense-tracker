import { prisma } from "../../config/db.config";
import { ParseStatus } from "../../generated/prisma/enums";
import { findOrCreateUserFromMessagingProfile } from "../users/user.service";
import { MessagingProfile } from "./messaging.types";

export async function findOrCreateMessagingAccount(
  userId: string,
  profile: MessagingProfile,
) {
  const existing = await prisma.messagingAccount.findFirst({
    where: {
      platform: profile.platform,
      platformUserId: profile.platformUserId,
    },
  });

  if (existing) {
    return prisma.messagingAccount.update({
      where: { id: existing.id },
      data: {
        platformChatId: profile.platformChatId || existing.platformChatId,
        username: profile.username || existing.username || "unknown",
        isActive: true,
      },
    });
  }

  return prisma.messagingAccount.create({
    data: {
      userId,
      platform: profile.platform,
      platformUserId: profile.platformUserId,
      platformChatId: profile.platformChatId || profile.platformUserId,
      username: profile.username || "unknown",
      isActive: true,
    },
  });
}

export async function saveIncomingParseEvent(
  userId: string,
  platform: MessagingProfile["platform"],
  text: string,
) {
  return prisma.parseEvent.create({
    data: {
      userId,
      rawText: text,
      normalizedText: text.trim(),
      platform,
      status: ParseStatus.AUTO_SAVED,
    },
  });
}

export async function ingestMessagingMessage(profile: MessagingProfile) {
  const user = await findOrCreateUserFromMessagingProfile(profile);

  await findOrCreateMessagingAccount(user.id, profile);

  const parseEvent = await saveIncomingParseEvent(
    user.id,
    profile.platform,
    profile.text || "",
  );

  return {
    user,
    parseEvent,
  };
}
