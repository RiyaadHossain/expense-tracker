export enum OrchestratorResultKind {
  REPLY = "reply",
  TRANSACTION_SAVED = "transaction_saved",
  REPORT = "report",
}

export type OrchestratorResult =
  | {
      kind: OrchestratorResultKind;
      message: string;
      parseMode?: "Markdown" | "HTML";
    }

  export enum AiIntent {
  CREATE_TRANSACTION = "CREATE_TRANSACTION",
  REPORT = "REPORT",
  ADVICE = "ADVICE",
  HELP = "HELP",
  UPDATE_TRANSACTION = "UPDATE_TRANSACTION",
  DELETE_TRANSACTION = "DELETE_TRANSACTION",
  CLARIFY_MISSING_INFO = "CLARIFY_MISSING_INFO",
  UNKNOWN = "UNKNOWN",
}

export enum TransactionType {
  EXPENSE = "EXPENSE",
  INCOME = "INCOME",
}

export enum ReportPeriod {
  TODAY = "TODAY",
  YESTERDAY = "YESTERDAY",
  THIS_WEEK = "THIS_WEEK",
  THIS_MONTH = "THIS_MONTH",
  CUSTOM = "CUSTOM",
}

export enum AdviceTopic {
  SAVE_MONEY = "SAVE_MONEY",
  COST_CUTTING = "COST_CUTTING",
  BUDGETING = "BUDGETING",
  INVESTMENT_IDEAS = "INVESTMENT_IDEAS",
  SPENDING_ANALYSIS = "SPENDING_ANALYSIS",
  GENERAL_FINANCIAL_GUIDANCE = "GENERAL_FINANCIAL_GUIDANCE",
}

export enum MissingField {
  amount = "amount",
  type = "type",
  note = "note",
  date = "date",
  period = "period",
  topic = "topic",
  category = "category",
  paymentMethod = "paymentMethod",
  categoryHint = "categoryHint",
  paymentMethodHint = "paymentMethodHint",
}
