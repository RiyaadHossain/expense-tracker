import { prisma } from "../../config/db.config";

export async function findUserByTelegramUserId(telegramUserId: number) {
  const syntheticEmail = `tg_${telegramUserId}@telegram.local`;

  return prisma.user.findUnique({
    where: { email: syntheticEmail },
  });
}
