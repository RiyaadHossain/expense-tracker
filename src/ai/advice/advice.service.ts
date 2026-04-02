import { prisma } from "../../config/db.config";
import { TransactionType } from "../../generated/prisma/enums";
import { gemini, GEMINI_MODEL } from "../gemini/gemini.client";

type GenerateAdviceReplyInput = {
  userId: string;
  currency: string;
  question: string;
};

export async function generateAdviceReply({
  userId,
  currency,
  question,
}: GenerateAdviceReplyInput): Promise<string> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const averageExpenseFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [recentTransactions, monthlyIncomeAgg, averageExpenseAgg] =
    await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          isDeleted: false,
        },
        orderBy: { transactionAt: "desc" },
        take: 12,
        select: {
          type: true,
          amount: true,
          note: true,
          description: true,
          transactionAt: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          isDeleted: false,
          type: TransactionType.INCOME,
          transactionAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          isDeleted: false,
          type: TransactionType.EXPENSE,
          transactionAt: {
            gte: averageExpenseFrom,
            lt: nextMonthStart,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

  const monthlyIncome = Number(monthlyIncomeAgg._sum.amount || 0);
  const monthlyAverageExpenses = Number(averageExpenseAgg._sum.amount || 0) / 3;
  const transactionHistory =
    recentTransactions.length > 0
      ? recentTransactions
          .map(
            (transaction) =>
              `- ${transaction.transactionAt.toISOString()} | ${transaction.type} | ${Number(transaction.amount)} ${currency} | ${transaction.category.name} | ${transaction.note || transaction.description || "No note"}`,
          )
          .join("\n")
      : "No previous transactions found.";

  const prompt = `
You are a helpful finance assistant for an expense tracking application.

The user asked:
"${question}"

Application purpose:
- Only provide advice related to personal finance, budgeting, saving money, expense tracking, spending analysis, or income/expense management.
- If the user's request is not related to finance or the app's purpose, politely explain that you can only help with finance-related guidance inside this app and invite them to ask a budgeting, savings, income, or spending question instead.

User financial context:
- Currency: ${currency}
- Monthly income (current month): ${monthlyIncome}
- Monthly average expenses (last 3 months): ${monthlyAverageExpenses.toFixed(2)}

Previous transaction history:
${transactionHistory}

Instructions:
- Keep the reply short, practical, and personalized based on the transaction history.
- Mention 2 to 4 actionable suggestions when the request is finance-related.
- Avoid giving legal, medical, or unrelated life advice.
- Use simple Markdown suitable for Telegram.
- Add relevant emojis so the message feels friendly.
`;

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return (
    response.text?.trim() ||
    "💡I can help with finance-related advice based on your income and expenses. Ask me about budgeting, saving, or spending analysis."
  );
}
