import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionList } from '../components/organisms/TransactionList';
import { colors } from '../theme/colors';

export function TransactionsScreen() {
  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <TransactionList />
    </SafeAreaView>
  );
}