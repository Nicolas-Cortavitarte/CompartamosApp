import {supabase} from './supabase';
import {ensureAnonymousSession} from './auth.service';

import type {
  SavingsGoal,
  CreateSavingsGoalInput,
  UpdateSavingsGoalInput,
  SavingsMovement,
  SavingsGoalWithProgress,
  SavingsBalanceSummary
} from '../types/savings.types';

import type {Transaction} from '../types/transactions.types';

import { getTransactions } from './transactions.service';

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const userId = await ensureAnonymousSession();

  const {data, error} = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavingsGoal[];
}

export async function createSavingsGoal(
  input: CreateSavingsGoalInput,
): Promise<SavingsGoal> {
  const userId = await ensureAnonymousSession();

  const name = input.name.trim();

  if (!name) {
    throw new Error('Ingresa un nombre para la meta.');
  }

  if (
    !Number.isFinite(input.target_amount) ||
    input.target_amount <= 0 ||
    Math.round(input.target_amount * 100) !== input.target_amount * 100
  ) {
    throw new Error('Ingresa un monto válido con máximo dos decimales.');
  }

  const {data, error} = await supabase
    .from('savings_goals')
    .insert({
      user_id: userId,
      name,
      target_amount: input.target_amount,
      deadline: input.deadline ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavingsGoal;
}

export async function updateSavingsGoal(
  goalId: string,
  input: UpdateSavingsGoalInput,
): Promise<SavingsGoal> {
  const userId = await ensureAnonymousSession();

  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('El nombre de la meta no puede estar vacío.');
  }

  if (
    input.target_amount !== undefined &&
    (!Number.isFinite(input.target_amount) ||
      input.target_amount <= 0 ||
      Math.round(input.target_amount * 100) !==
        input.target_amount * 100)
  ) {
    throw new Error('Ingresa un monto válido con máximo dos decimales.');
  }

  const {data, error} = await supabase
    .from('savings_goals')
    .update({
      ...(input.name !== undefined && {name: input.name.trim()}),
      ...(input.target_amount !== undefined && {
        target_amount: input.target_amount,
      }),
      ...(input.deadline !== undefined && {deadline: input.deadline}),
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavingsGoal;
}

export async function deleteSavingsGoal(
  goalId: string,
): Promise<void> {
  const userId = await ensureAnonymousSession();

  const {data, error} = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('La meta no existe o no tienes permiso para eliminarla.');
  }
}

export async function depositToSavingsGoal(
  goalId: string,
  amount: number,
): Promise<void> {
  await ensureAnonymousSession();

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isInteger(Math.round(amount * 100)) ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
  ) {
    throw new Error('Ingresa un aporte válido con máximo dos decimales.');
  }

  const {error} = await supabase.rpc('deposit_to_savings_goal', {
    p_goal_id: goalId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function withdrawFromSavingsGoal(
  goalId: string,
  amount: number,
): Promise<void> {
  await ensureAnonymousSession();

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
  ) {
    throw new Error('Ingresa un retiro válido con máximo dos decimales.');
  }

  const {error} = await supabase.rpc('withdraw_from_savings_goal', {
    p_goal_id: goalId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getSavingsMovements(
  goalId: string,
): Promise<SavingsMovement[]> {
  const userId = await ensureAnonymousSession();

  const {data: goal, error: goalError} = await supabase
    .from('savings_goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (goalError || !goal) {
    throw new Error('No se encontró la meta de ahorro.');
  }

  const {data, error} = await supabase
    .from('savings_movements')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavingsMovement[];
}

export function calculateSavingsGoalProgress(
  goal: SavingsGoal,
  movements: SavingsMovement[],
): SavingsGoalWithProgress {
  const savedAmount = movements.reduce((total, movement) => {
    const amount = Number(movement.amount);

    if (movement.type === 'DEPOSIT') {
      return total + amount;
    }

    if (movement.type === 'WITHDRAWAL') {
      return total - amount;
    }

    return total;
  }, 0);

  const saved = Math.round(savedAmount * 100) / 100;

  const target = Number(goal.target_amount);

  const remaining = Math.max(
    0,
    Math.round((target - saved) * 100) / 100,
  );

  const percentage =
    target > 0
      ? Math.min(100, Math.max(0, (saved / target) * 100))
      : 0;

  return {
    ...goal,
    saved_amount: saved,
    remaining_amount: remaining,
    progress_percentage: percentage,
  };
}

export async function getSavingsGoalsWithProgress(): Promise<
  SavingsGoalWithProgress[]
> {
  const userId = await ensureAnonymousSession();

  const {data: goals, error: goalsError} = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  const savingsGoals = (goals ?? []) as SavingsGoal[];

  if (savingsGoals.length === 0) {
    return [];
  }

  const goalIds = savingsGoals.map(goal => goal.id);

  const {data: movements, error: movementsError} = await supabase
    .from('savings_movements')
    .select('*')
    .in('goal_id', goalIds);

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  const savingsMovements = (movements ?? []) as SavingsMovement[];

  const movementsByGoal = new Map<string, SavingsMovement[]>();

  for (const movement of savingsMovements) {
    const current = movementsByGoal.get(movement.goal_id) ?? [];

    current.push(movement);

    movementsByGoal.set(movement.goal_id, current);
  }

  return savingsGoals.map(goal =>
    calculateSavingsGoalProgress(
      goal,
      movementsByGoal.get(goal.id) ?? [],
    ),
  );
}

export async function getSavingsBalanceSummary(
  existingTransactions?: Transaction[],
): Promise<SavingsBalanceSummary> {
  const [transactions, goals] = await Promise.all([
    existingTransactions !== undefined
      ? Promise.resolve(existingTransactions)
      : getTransactions(),
    getSavingsGoalsWithProgress(),
  ]);

  const totalIncome = transactions
    .filter(transaction => transaction.type?.toUpperCase() === 'INCOME')
    .reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0,
    );

  const totalExpense = transactions
    .filter(transaction => transaction.type?.toUpperCase() === 'EXPENSE')
    .reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0,
    );

  const accumulatedBalance = totalIncome - totalExpense;

  const reservedAmount = goals.reduce(
    (total, goal) => total + goal.saved_amount,
    0,
  );

  const availableBalance = accumulatedBalance - reservedAmount;

  return {
    accumulated_balance: Math.round(accumulatedBalance * 100) / 100,
    reserved_amount: Math.round(reservedAmount * 100) / 100,
    available_balance: Math.round(availableBalance * 100) / 100,
  };
}

