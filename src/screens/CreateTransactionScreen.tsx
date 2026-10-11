
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionForm } from '../components/organisms/TransactionForm';
import { colors } from '../theme/colors';

export function CreateTransactionScreen() {
  return (
        <SafeAreaView
          edges={['top']}
          style={{
            flex: 1,
            backgroundColor: colors.background,
          }}
        >
          <TransactionForm />
        </SafeAreaView>
  );
}
