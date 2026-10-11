import { supabase } from './supabase';
import type { Category } from '../types/transactions.types';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, type, created_at')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(
      `No se pudieron obtener las categorías: ${error.message}`,
    );
  }

  return (data ?? []) as Category[];
}
