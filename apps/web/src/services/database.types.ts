export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_credentials: {
        Row: {
          attempts_used: number
          created_at: string
          expires_at: string | null
          id: string
          issued_by: string | null
          kind: Database["public"]["Enums"]["credential_kind"]
          last_used_at: string | null
          max_attempts: number
          nfc_uid: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["credential_status"]
          token_hash: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts_used?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string | null
          kind?: Database["public"]["Enums"]["credential_kind"]
          last_used_at?: string | null
          max_attempts?: number
          nfc_uid?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          token_hash?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts_used?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string | null
          kind?: Database["public"]["Enums"]["credential_kind"]
          last_used_at?: string | null
          max_attempts?: number
          nfc_uid?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          token_hash?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_credentials_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_credentials_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_logs: {
        Row: {
          center_id: string | null
          credential_id: string | null
          event: Database["public"]["Enums"]["access_event"]
          id: number
          meta: Json | null
          method: Database["public"]["Enums"]["access_method"]
          recorded_by: string | null
          scanned_at: string
          source: Database["public"]["Enums"]["access_source"]
          user_id: string
        }
        Insert: {
          center_id?: string | null
          credential_id?: string | null
          event: Database["public"]["Enums"]["access_event"]
          id?: never
          meta?: Json | null
          method?: Database["public"]["Enums"]["access_method"]
          recorded_by?: string | null
          scanned_at?: string
          source?: Database["public"]["Enums"]["access_source"]
          user_id: string
        }
        Update: {
          center_id?: string | null
          credential_id?: string | null
          event?: Database["public"]["Enums"]["access_event"]
          id?: never
          meta?: Json | null
          method?: Database["public"]["Enums"]["access_method"]
          recorded_by?: string | null
          scanned_at?: string
          source?: Database["public"]["Enums"]["access_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "access_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          active: boolean
          address: string | null
          comunidad: string | null
          created_at: string
          id: string
          name: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          comunidad?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          comunidad?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_events: {
        Row: {
          all_day: boolean
          center_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          starts_at: string
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at: string
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_events_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          center_id: string | null
          comunidad: string | null
          date: string
          id: string
          name: string
          scope: Database["public"]["Enums"]["holiday_scope"]
        }
        Insert: {
          center_id?: string | null
          comunidad?: string | null
          date: string
          id?: string
          name: string
          scope?: Database["public"]["Enums"]["holiday_scope"]
        }
        Update: {
          center_id?: string | null
          comunidad?: string | null
          date?: string
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["holiday_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "holidays_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          center_id: string | null
          created_at: string
          email: string | null
          employee_code: string | null
          full_name: string
          id: string
          locale: string
          mfa_enabled: boolean
          notification_prefs: Json
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          email?: string | null
          employee_code?: string | null
          full_name?: string
          id: string
          locale?: string
          mfa_enabled?: boolean
          notification_prefs?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string
          email?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          locale?: string
          mfa_enabled?: boolean
          notification_prefs?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          pattern_id: string
          rotation_offset: number
          start_date: string
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          pattern_id: string
          rotation_offset?: number
          start_date: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          pattern_id?: string
          rotation_offset?: number
          start_date?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "shift_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_entries: {
        Row: {
          code: string
          date: string
          end_time: string | null
          overnight: boolean
          start_time: string | null
          user_id: string
        }
        Insert: {
          code: string
          date: string
          end_time?: string | null
          overnight?: boolean
          start_time?: string | null
          user_id: string
        }
        Update: {
          code?: string
          date?: string
          end_time?: string | null
          overnight?: boolean
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_patterns: {
        Row: {
          active: boolean
          color: string
          created_at: string
          cycle_days: number
          definition: Json
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          cycle_days: number
          definition: Json
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          cycle_days?: number
          definition?: Json
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          active: boolean
          center_id: string
          created_at: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          center_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          center_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_requests: {
        Row: {
          created_at: string
          days: number
          decided_at: string | null
          end_date: string
          id: string
          reason: string | null
          reviewer_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["leave_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          days: number
          decided_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          reviewer_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["leave_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          days?: number
          decided_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          reviewer_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["leave_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_assistance_daily: {
        Row: {
          day: string | null
          entries: number | null
          first_in: string | null
          last_out: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_check_temporal: { Args: { p_code: string }; Returns: Json }
      fn_generate_shift_entries: {
        Args: { p_from: string; p_to: string; p_user?: string }
        Returns: undefined
      }
      fn_is_admin: { Args: never; Returns: boolean }
      fn_is_staff: { Args: never; Returns: boolean }
      fn_is_team_leader: { Args: { p_team: string }; Returns: boolean }
      fn_issue_temporal: {
        Args: { p_ttl_seconds?: number; p_user_id: string }
        Returns: string
      }
      fn_leads_user: { Args: { p_user: string }; Returns: boolean }
      fn_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      fn_register_access: {
        Args: {
          p_credential_id: string
          p_event: Database["public"]["Enums"]["access_event"]
          p_method?: Database["public"]["Enums"]["access_method"]
          p_source?: Database["public"]["Enums"]["access_source"]
        }
        Returns: Json
      }
      fn_shares_team: { Args: { p_user: string }; Returns: boolean }
    }
    Enums: {
      access_event: "entrada" | "salida" | "denegado"
      access_method: "qr" | "temporal" | "nfc" | "manual"
      access_source: "app" | "torno" | "manual"
      credential_kind: "qr" | "temporal" | "nfc"
      credential_status: "activa" | "revocada" | "caducada"
      holiday_scope: "nacional" | "comunidad" | "centro"
      leave_type: "vacacion" | "baja" | "permiso"
      member_role: "miembro" | "lider"
      notification_type:
        | "turno"
        | "acceso"
        | "vacacion"
        | "corporativa"
        | "sistema"
      request_status: "pendiente" | "aprobada" | "rechazada" | "anulada"
      user_role: "empleado" | "responsable" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_event: ["entrada", "salida", "denegado"],
      access_method: ["qr", "temporal", "nfc", "manual"],
      access_source: ["app", "torno", "manual"],
      credential_kind: ["qr", "temporal", "nfc"],
      credential_status: ["activa", "revocada", "caducada"],
      holiday_scope: ["nacional", "comunidad", "centro"],
      leave_type: ["vacacion", "baja", "permiso"],
      member_role: ["miembro", "lider"],
      notification_type: [
        "turno",
        "acceso",
        "vacacion",
        "corporativa",
        "sistema",
      ],
      request_status: ["pendiente", "aprobada", "rechazada", "anulada"],
      user_role: ["empleado", "responsable", "admin"],
    },
  },
} as const
