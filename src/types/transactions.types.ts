export type TransactionType = 'INCOME' | 'EXPENSE';

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
