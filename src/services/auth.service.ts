import { supabase } from './supabase';

export async function ensureAnonymousSession(): Promise<string> {

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      `No se pudo recuperar la sesión: ${sessionError.message}`,
    );
  }

  if (session) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(
        `No se pudo verificar la sesión: ${userError.message}`,
      );
    }

    if (user) {
      return user.id;
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error(
      `No se pudo iniciar la sesión anónima: ${error.message}`,
    );
  }

  if (!data.user) {
    throw new Error('Supabase no devolvió un usuario válido.');
  }

  return data.user.id;
}
