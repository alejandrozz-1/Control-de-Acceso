import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from './auth';

export interface AppNotification {
  id: string;
  type: 'turno' | 'acceso' | 'vacacion' | 'corporativa' | 'sistema';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

const KEY = 'notifications';
const UNREAD_KEY = 'notifications-unread';
export const NOTIFICATIONS_PAGE_SIZE = 20;

interface NotificationCursor {
  createdAt: string;
  id: string;
}

interface NotificationPage {
  items: AppNotification[];
  nextCursor: NotificationCursor | null;
}

/** Carga notificaciones por páginas estables, manteniendo el orden con inserciones en tiempo real. */
export function useNotifications() {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useInfiniteQuery({
    queryKey: [KEY, uid, 'infinite'],
    enabled: !!uid,
    initialPageParam: null as NotificationCursor | null,
    queryFn: async ({ pageParam }): Promise<NotificationPage> => {
      let query = supabase
        .from('notifications')
        .select('id, type, title, body, data, read_at, created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      if (pageParam) {
        query = query.or(
          `created_at.lt.${pageParam.createdAt},and(created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id})`,
        );
      }

      const { data, error } = await query.limit(NOTIFICATIONS_PAGE_SIZE);
      if (error) throw error;
      const items = data as AppNotification[];
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          items.length === NOTIFICATIONS_PAGE_SIZE && last
            ? { createdAt: last.created_at, id: last.id }
            : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Nº de no leídas (badge de la navegación). */
export function useUnreadCount() {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: [UNREAD_KEY, uid],
    enabled: !!uid,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      void qc.invalidateQueries({ queryKey: [UNREAD_KEY] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      void qc.invalidateQueries({ queryKey: [UNREAD_KEY] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      void qc.invalidateQueries({ queryKey: [UNREAD_KEY] });
    },
  });
}

/**
 * Suscripción realtime a INSERTs de notificaciones del usuario.
 * Se monta una sola vez (Shell); refresca lista y badge al llegar una nueva.
 */
export function useNotificationsRealtime() {
  const uid = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => {
          void qc.invalidateQueries({ queryKey: [KEY] });
          void qc.invalidateQueries({ queryKey: [UNREAD_KEY] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, qc]);
}
