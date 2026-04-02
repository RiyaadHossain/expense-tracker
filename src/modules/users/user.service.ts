import { prisma } from "../../config/db.config";
import { SourcePlatform } from "../../generated/prisma/enums";
import { MessagingProfile } from "../messaging/messaging.types";

function buildSyntheticEmail(platform: SourcePlatform, platformUserId: string) {
  return `${platform.toLowerCase()}_${platformUserId}@messaging.local`;
}

export async function findUserByPlatformUserId(
  platform: SourcePlatform,
  platformUserId: string,
) {
  return prisma.user.findUnique({
    where: {
      email: buildSyntheticEmail(platform, platformUserId),
    },
  });
}

export async function findOrCreateUserFromMessagingProfile(
  profile: MessagingProfile,
) {
  const syntheticEmail = buildSyntheticEmail(
    profile.platform,
    profile.platformUserId,
  );

  let user = await prisma.user.findUnique({
    where: { email: syntheticEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: syntheticEmail,
        fullName:
          [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
          null,
        timezone: profile.timezone || "Asia/Dhaka",
        baseCurrency: profile.baseCurrency || "BDT",
        locale: profile.locale || "en-BD",
      },
    });
  }

  return user;
}
