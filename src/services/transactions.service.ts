import { supabase } from './supabase';
import { ensureAnonymousSession } from './auth.service';

import type {
  Transaction,
  CreateTransaction,
} from '../types/transactions.types';

export async function getTransactions(): Promise<Transaction[]> {
  const userId = await ensureAnonymousSession();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(
      `No se pudieron obtener las transacciones: ${error.message}`,
    );
  }

  return (data ?? []) as Transaction[];
}

export async function getTransactionById(
  transactionId: string,
): Promise<Transaction> {
  const userId = await ensureAnonymousSession();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error(
      'No se pudo obtener el movimiento solicitado.',
    );
  }

  return data as Transaction;
}

export async function createTransaction(
  transaction: CreateTransaction,
): Promise<Transaction> {
  const userId = await ensureAnonymousSession();

  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    throw new Error('El monto debe ser mayor que cero.');
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', transaction.category_id)
    .single();

  if (categoryError || !category) {
    throw new Error('La categoría seleccionada no existe.');
  }

  if (category.type !== transaction.type) {
    throw new Error(
      'La categoría no corresponde al tipo de transacción.',
    );
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      category_id: transaction.category_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description?.trim() || null,
      ...(transaction.date ? { date: transaction.date } : {}),
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `No se pudo registrar la transacción: ${error.message}`,
    );
  }

  return data as Transaction;
}

export async function updateTransaction(
  transactionId: string,
  transaction: CreateTransaction,
): Promise<Transaction> {
  const userId = await ensureAnonymousSession();

  if (
    !Number.isFinite(transaction.amount) ||
    transaction.amount <= 0
  ) {
    throw new Error('El monto debe ser mayor que cero.');
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', transaction.category_id)
    .single();

  if (categoryError || !category) {
    throw new Error('La categoría seleccionada no existe.');
  }

  if (category.type !== transaction.type) {
    throw new Error(
      'La categoría no corresponde al tipo de transacción.',
    );
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      category_id: transaction.category_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description?.trim() || null,
      ...(transaction.date
        ? { date: transaction.date }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo actualizar el movimiento: ${
        error?.message ?? 'Movimiento no encontrado.'
      }`,
    );
  }

  return data as Transaction;
}

export async function deleteTransaction(
  transactionId: string,
): Promise<void> {
  const userId = await ensureAnonymousSession();

  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    throw new Error(
      `No se pudo eliminar el movimiento: ${error.message}`,
    );
  }

  if (!data || data.length === 0) {
    throw new Error(
      'No se encontró el movimiento o no tienes permiso para eliminarlo.',
    );
  }
}
