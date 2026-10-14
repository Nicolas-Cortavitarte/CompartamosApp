import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { CreateTransactionScreen } from '../screens/CreateTransactionScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { SummaryScreen } from '../screens/SummaryScreen';

import { colors } from '../theme/colors';

export type RootTabParamList = {
  Inicio: undefined;
  Movimientos: undefined;
  Registrar: undefined;
  Resumen: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;

  TransactionDetail: {
    transactionId: string;
  };

  EditTransaction: {
    transactionId: string;
  };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const icons: Record<keyof RootTabParamList, string> = {
  Inicio: '⌂',
  Movimientos: '☷',
  Registrar: '+',
  Resumen: '▥',
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.information,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const isAdd = route.name === 'Registrar';

          return (
            <View
              style={[
                styles.iconContainer,
                isAdd && styles.addIconContainer,
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  {
                    color: isAdd
                      ? colors.surface
                      : focused
                        ? colors.primary
                        : colors.information,
                  },
                ]}
              >
                {icons[route.name]}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Movimientos"
        component={TransactionsScreen}
      />

      <Tab.Screen
        name="Registrar"
        component={CreateTransactionScreen}
      />

      <Tab.Screen
        name="Resumen"
        component={SummaryScreen}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
          />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
          />
          <Stack.Screen
            name="EditTransaction"
            component={EditTransactionScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainer: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  icon: {
    fontSize: 26,
    fontWeight: '600',
  },
});
