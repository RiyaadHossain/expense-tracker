export type ParsedTransactionType = "EXPENSE" | "INCOME";

export interface ParsedTransactionResult {
  success: boolean;
  type?: ParsedTransactionType;
  amount?: number;
  categoryName?: string;
  note?: string;
  reason?: string;
}

const EXPENSE_KEYWORDS = [
  "spent",
  "spend",
  "paid",
  "pay",
  "bought",
  "buy",
  "cost",
  "gave",
];

const INCOME_KEYWORDS = [
  "received",
  "receive",
  "got",
  "earned",
  "income",
  "salary",
  "freelance",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: ["grocery", "groceries", "market", "super shop"],
  food: ["food", "lunch", "dinner", "breakfast", "tea", "snack", "restaurant"],
  transport: ["uber", "rickshaw", "bus", "cng", "train", "fuel", "transport"],
  shopping: ["shirt", "pant", "clothes", "shopping", "shoe", "bag"],
  bills: ["bill", "electricity", "gas", "internet", "wifi", "mobile recharge"],
  salary: ["salary"],
  freelance: ["freelance", "client payment", "project payment"],
  gift: ["gift"],
};

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

function extractAmount(text: string): number | null {
  // Supports: 500, 1,200, 1,200.50, 1200.50
  const match = text.match(
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/,
  );

  if (!match) return null;

  const numeric = Number(match[0].replace(/,/g, ""));

  return Number.isFinite(numeric) ? numeric : null;
}

function detectType(normalizedText: string): ParsedTransactionType | null {
  const hasExpenseKeyword = EXPENSE_KEYWORDS.some((keyword) =>
    normalizedText.includes(keyword),
  );

  const hasIncomeKeyword = INCOME_KEYWORDS.some((keyword) =>
    normalizedText.includes(keyword),
  );

  if (hasExpenseKeyword && !hasIncomeKeyword) return "EXPENSE";
  if (hasIncomeKeyword && !hasExpenseKeyword) return "INCOME";

  // Heuristic fallback:
  // if salary/freelance appears, it's income
  if (normalizedText.includes("salary") || normalizedText.includes("freelance"))
    return "INCOME";

  // If user just says "uber 350" or "lunch 180", assume expense
  if (!hasIncomeKeyword) return "EXPENSE";

  return null;
}

function detectCategory(
  normalizedText: string,
  type: ParsedTransactionType,
): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedText.includes(keyword))) {
      return category;
    }
  }

  return type === "INCOME" ? "income" : "misc";
}

function buildNote(originalText: string): string {
  return originalText.trim();
}

export function parseTransactionFromText(
  text: string,
): ParsedTransactionResult {
  const normalizedText = normalizeText(text);

  const amount = extractAmount(normalizedText);
  if (!amount)
    return {
      success: false,
      reason: "Could not detect amount in your message.",
    };

  const type = detectType(normalizedText);
  if (!type)
    return {
      success: false,
      reason: "Could not determine whether this is income or expense.",
    };

  const categoryName = detectCategory(normalizedText, type);
  const note = buildNote(text);

  return {
    success: true,
    type,
    amount,
    categoryName,
    note,
  };
}
