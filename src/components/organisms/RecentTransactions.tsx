import React from 'react';
import { TransactionList } from './TransactionList';

export function RecentTransactions() {
  return <TransactionList limit={3} hideFilters={true} />;
}
