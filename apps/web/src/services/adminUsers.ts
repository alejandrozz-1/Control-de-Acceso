import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AdminResponse = { error?: string };

export class AdminUsersFunctionUnavailableError extends Error {
  constructor() {
    super('La función de administración aún no está desplegada en Supabase.');
    this.name = 'AdminUsersFunctionUnavailableError';
  }
}

export async function adminUsersRequest<T extends object>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & AdminResponse>('admin-users', { body });
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    if (error.context.status === 404) throw new AdminUsersFunctionUnavailableError();
    let response: unknown;
    try {
      response = await error.context.clone().json();
    } catch {
      throw error;
    }
    if (response && typeof response === 'object' && 'error' in response && typeof response.error === 'string') {
      throw new Error(response.error);
    }
  }
  if (error) throw error;
  if (!data) throw new Error('El servidor devolvió una respuesta vacía.');
  if (data.error) throw new Error(data.error);
  return data;
}
