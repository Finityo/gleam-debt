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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          page_path: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      debt_calculator_settings: {
        Row: {
          created_at: string
          extra_monthly: number | null
          id: string
          one_time: number | null
          strategy: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extra_monthly?: number | null
          id?: string
          one_time?: number | null
          strategy?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extra_monthly?: number | null
          id?: string
          one_time?: number | null
          strategy?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          apr: number
          balance: number
          created_at: string
          debt_type: string | null
          due_date: string | null
          id: string
          last4: string | null
          min_payment: number
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apr: number
          balance: number
          created_at?: string
          debt_type?: string | null
          due_date?: string | null
          id?: string
          last4?: string | null
          min_payment: number
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apr?: number
          balance?: number
          created_at?: string
          debt_type?: string | null
          due_date?: string | null
          id?: string
          last4?: string | null
          min_payment?: number
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_verification_attempts: {
        Row: {
          attempted_at: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          phone: string
          success: boolean
        }
        Insert: {
          attempted_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          phone: string
          success: boolean
        }
        Update: {
          attempted_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          phone?: string
          success?: boolean
        }
        Relationships: []
      }
      plaid_accounts: {
        Row: {
          account_id: string
          available_balance: number | null
          created_at: string
          currency_code: string | null
          current_balance: number | null
          id: string
          mask: string | null
          name: string
          official_name: string | null
          plaid_item_id: string
          subtype: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          available_balance?: number | null
          created_at?: string
          currency_code?: string | null
          current_balance?: number | null
          id?: string
          mask?: string | null
          name: string
          official_name?: string | null
          plaid_item_id: string
          subtype?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          available_balance?: number | null
          created_at?: string
          currency_code?: string | null
          current_balance?: number | null
          id?: string
          mask?: string | null
          name?: string
          official_name?: string | null
          plaid_item_id?: string
          subtype?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaid_accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "plaid_items"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_api_logs: {
        Row: {
          account_id: string | null
          created_at: string
          endpoint: string
          error_code: string | null
          error_message: string | null
          error_type: string | null
          id: string
          item_id: string | null
          request_id: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          item_id?: string | null
          request_id: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          item_id?: string | null
          request_id?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: []
      }
      plaid_consent_log: {
        Row: {
          accepted_privacy: boolean
          accepted_terms: boolean
          consented_at: string
          finityo_terms_version: string | null
          id: string
          ip_address: string | null
          plaid_privacy_version: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_privacy?: boolean
          accepted_terms?: boolean
          consented_at?: string
          finityo_terms_version?: string | null
          id?: string
          ip_address?: string | null
          plaid_privacy_version?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_privacy?: boolean
          accepted_terms?: boolean
          consented_at?: string
          finityo_terms_version?: string | null
          id?: string
          ip_address?: string | null
          plaid_privacy_version?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plaid_encrypted_tokens: {
        Row: {
          created_at: string | null
          encrypted_token: string
          id: string
          item_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_token: string
          id?: string
          item_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_token?: string
          id?: string
          item_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plaid_item_status: {
        Row: {
          created_at: string
          id: string
          item_id: string
          last_webhook_at: string | null
          last_webhook_code: string | null
          needs_update: boolean
          update_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          last_webhook_at?: string | null
          last_webhook_code?: string | null
          needs_update?: boolean
          update_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          last_webhook_at?: string | null
          last_webhook_code?: string | null
          needs_update?: boolean
          update_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plaid_items: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          institution_id: string | null
          institution_name: string | null
          item_id: string
          link_session_id: string | null
          token_created_at: string | null
          token_last_rotated_at: string | null
          token_rotation_reason: string | null
          token_rotation_required: boolean | null
          updated_at: string
          user_id: string
          vault_secret_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          item_id: string
          link_session_id?: string | null
          token_created_at?: string | null
          token_last_rotated_at?: string | null
          token_rotation_reason?: string | null
          token_rotation_required?: boolean | null
          updated_at?: string
          user_id: string
          vault_secret_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          item_id?: string
          link_session_id?: string | null
          token_created_at?: string | null
          token_last_rotated_at?: string | null
          token_rotation_reason?: string | null
          token_rotation_required?: boolean | null
          updated_at?: string
          user_id?: string
          vault_secret_id?: string | null
        }
        Relationships: []
      }
      plaid_link_errors: {
        Row: {
          created_at: string
          display_message: string | null
          error_code: string | null
          error_message: string | null
          error_type: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          link_session_id: string
          request_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_message?: string | null
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          link_session_id: string
          request_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_message?: string | null
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          link_session_id?: string
          request_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plaid_link_events: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          error_type: string | null
          event_name: string
          id: string
          institution_id: string | null
          institution_name: string | null
          link_session_id: string
          metadata: Json | null
          timestamp: string
          user_id: string | null
          view_name: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          event_name: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          link_session_id: string
          metadata?: Json | null
          timestamp: string
          user_id?: string | null
          view_name?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          event_name?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          link_session_id?: string
          metadata?: Json | null
          timestamp?: string
          user_id?: string | null
          view_name?: string | null
        }
        Relationships: []
      }
      plaid_rate_limits: {
        Row: {
          action_type: string
          attempted_at: string
          id: string
          ip_address: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          action_type: string
          attempted_at?: string
          id?: string
          ip_address?: string | null
          success: boolean
          user_id: string
        }
        Update: {
          action_type?: string
          attempted_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      plaid_token_access_log: {
        Row: {
          access_type: string
          accessed_by: string | null
          created_at: string | null
          function_name: string
          id: string
          ip_address: string | null
          item_id: string
        }
        Insert: {
          access_type: string
          accessed_by?: string | null
          created_at?: string | null
          function_name: string
          id?: string
          ip_address?: string | null
          item_id: string
        }
        Update: {
          access_type?: string
          accessed_by?: string | null
          created_at?: string | null
          function_name?: string
          id?: string
          ip_address?: string | null
          item_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          subscription_price_id: string | null
          subscription_product_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end_date: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          subscription_price_id?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          subscription_price_id?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          auto_fixed: boolean | null
          check_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          auto_fixed?: boolean | null
          check_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          severity: string
        }
        Update: {
          auto_fixed?: boolean | null
          check_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      plaid_link_conversion_stats: {
        Row: {
          abandoned_sessions: number | null
          conversion_rate_pct: number | null
          date: string | null
          error_sessions: number | null
          successful_sessions: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_otp_rate_limit: {
        Args: { p_ip_address?: string; p_phone: string }
        Returns: {
          allowed: boolean
          attempts_count: number
          wait_seconds: number
        }[]
      }
      get_plaid_token_from_vault: {
        Args: { p_function_name?: string; p_item_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_plaid_api_call: {
        Args: {
          p_endpoint: string
          p_error_code?: string
          p_error_message?: string
          p_error_type?: string
          p_item_id: string
          p_request_id: string
          p_response_time_ms?: number
          p_status_code?: number
          p_user_id: string
        }
        Returns: string
      }
      log_plaid_link_error: {
        Args: {
          p_display_message?: string
          p_error_code?: string
          p_error_message?: string
          p_error_type?: string
          p_institution_id?: string
          p_institution_name?: string
          p_link_session_id: string
          p_request_id?: string
          p_status?: string
          p_user_id: string
        }
        Returns: string
      }
      log_plaid_link_event: {
        Args: {
          p_error_code?: string
          p_error_message?: string
          p_error_type?: string
          p_event_name: string
          p_institution_id?: string
          p_institution_name?: string
          p_link_session_id: string
          p_metadata?: Json
          p_timestamp?: string
          p_user_id: string
          p_view_name?: string
        }
        Returns: string
      }
      migrate_single_plaid_token: { Args: { p_item_id: string }; Returns: Json }
      store_plaid_token_in_vault: {
        Args: { p_description?: string; p_secret_name: string; p_token: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
