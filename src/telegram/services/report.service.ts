import { TransactionType } from "../../generated/prisma/enums";
import { prisma } from "../../config/db.config";

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfTomorrow() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getStartOfNextMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

async function getSummaryByRange(userId: string, start: Date, end: Date) {
  const [expenseAgg, incomeAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        transactionAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        transactionAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalExpense = Number(expenseAgg._sum.amount || 0);
  const totalIncome = Number(incomeAgg._sum.amount || 0);

  return {
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    expenseCount: expenseAgg._count._all,
    incomeCount: incomeAgg._count._all,
    totalCount: expenseAgg._count._all + incomeAgg._count._all,
  };
}

export async function getTelegramUserReport(userId: string) {
  const todayStart = getStartOfToday();
  const tomorrowStart = getStartOfTomorrow();
  const monthStart = getStartOfMonth();
  const nextMonthStart = getStartOfNextMonth();

  const [todaySummary, monthSummary, recentTransactions] = await Promise.all([
    getSummaryByRange(userId, todayStart, tomorrowStart),
    getSummaryByRange(userId, monthStart, nextMonthStart),

    prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        note: true,
        transactionAt: true,
      },
    }),
  ]);

  return {
    todaySummary,
    monthSummary,
    recentTransactions,
  };
}
