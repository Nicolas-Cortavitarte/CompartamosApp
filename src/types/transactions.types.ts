export type TransactionType = 'INCOME' | 'EXPENSE';
export type InsightSeverity = 'info' | 'warning' | 'alert';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  created_at: string;
}   

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransaction {
  category_id: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  date?: string;
}

export interface Insight {
  id: string;
  type: string;         // Ej: 'budget_warning', 'goal_reached'
  title: string;
  message: string;
  severity: InsightSeverity;
}
