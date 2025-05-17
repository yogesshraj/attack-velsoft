export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type TransactionType =
  | 'JOURNAL_ENTRY'
  | 'INVOICE_PAYMENT'
  | 'PURCHASE_PAYMENT'
  | 'EXPENSE'
  | 'INCOME'
  | 'BANK_TRANSFER';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  balance: number;
  parentId?: string;
  subAccounts: Account[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  accountId: string;
  account: {
    code: string;
    name: string;
  };
  debit: number;
  credit: number;
  description?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  reference?: string;
  amount: number;
  entries: JournalEntry[];
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balance: number;
  reconciled: boolean;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  lastReconciled?: string;
  transactions: BankTransaction[];
}

export interface AccountBalance {
  id: string;
  code: string;
  name: string;
  balance: number;
}

export interface BalanceSheetGroup {
  name: string;
  accounts: AccountBalance[];
  total: number;
}

export interface BalanceSheetSection {
  name: string;
  groups: BalanceSheetGroup[];
  total: number;
}

export interface BalanceSheetData {
  asOf: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
}

export interface PLAccountBalance {
  id: string;
  code: string;
  name: string;
  currentBalance: number;
  previousBalance: number;
  change: number;
  changePercentage: number;
}

export interface PLGroup {
  name: string;
  accounts: PLAccountBalance[];
  currentTotal: number;
  previousTotal: number;
  change: number;
  changePercentage: number;
}

export interface PLSection {
  name: string;
  groups: PLGroup[];
  currentTotal: number;
  previousTotal: number;
  change: number;
  changePercentage: number;
}

export interface ProfitLossData {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  revenue: PLSection;
  expenses: PLSection;
  netIncome: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
}

export interface TrialBalanceData {
  accounts: AccountBalance[];
  totals: {
    debit: number;
    credit: number;
  };
  asOf: string;
} 