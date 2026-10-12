// RecentTransactions.tsx
import React from 'react';
import { TransactionList } from './TransactionList';
import type { Transaction } from '../../types/transactions.types';

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Le pasamos las transacciones cargadas a TransactionList
  return (
    <TransactionList transactions={transactions} limit={3} hideFilters={true} />
  );
}
