import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabase } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Role = Profile['role'];

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** true mientras se resuelve la sesión inicial (evita parpadeos al recargar) */
  initializing: boolean;
  /** true cuando el profile ya se resolvió (aunque sea null): distingue "cargando" de "sin perfil" */
  profileLoaded: boolean;
  setSession: (s: Session | null) => void;
  setProfile: (p: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  initializing: true,
  profileLoaded: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(
      error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message,
    );
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, profile: null, profileLoaded: false });
  },
}));

async function loadProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  useAuthStore.getState().setProfile(data ?? null);
  useAuthStore.setState({ profileLoaded: true });
}

let started = false;

/** Suscripción única a la sesión de Supabase (se llama al arrancar la app). */
export function initAuth() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    const prev = useAuthStore.getState().session;
    useAuthStore.setState({ session, initializing: false });
    if (session?.user.id !== prev?.user.id) {
      if (session) void loadProfile(session.user.id);
      else useAuthStore.getState().setProfile(null);
    }
  });
}

/** Jerarquía de roles: empleado < responsable < admin. */
const RANK: Record<Role, number> = { empleado: 0, responsable: 1, admin: 2 };

export function hasRole(profile: Profile | null, min: Role): boolean {
  return !!profile && RANK[profile.role] >= RANK[min];
}
