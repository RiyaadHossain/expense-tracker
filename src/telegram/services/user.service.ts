import { prisma } from "../../config/db.config";
import { TelegramMessagePayload } from "../telegram.types";

export async function findUserByTelegramUserId(telegramUserId: number) {
  const syntheticEmail = `tg_${telegramUserId}@telegram.local`;

  return prisma.user.findUnique({
    where: { email: syntheticEmail },
  });
}

export async function findOrCreateUserFromTelegram(
  payload: TelegramMessagePayload,
) {
  const syntheticEmail = `tg_${payload.telegramUserId}@telegram.local`;

  let user = await prisma.user.findUnique({
    where: { email: syntheticEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: syntheticEmail,
        fullName:
          [payload.firstName, payload.lastName].filter(Boolean).join(" ") ||
          null,
        timezone: "Asia/Dhaka",
        baseCurrency: "BDT",
        locale: "en-BD",
      },
    });
  }

  return user;
}
