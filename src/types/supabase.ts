export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          actor_id: string | null
          contract_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          contract_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          contract_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
        }
        Relationships: []
      }
      contract_negotiations: {
        Row: {
          id: string
          contract_id: string
          round_number: number
          submitted_by: string
          status: string
          changes_summary: string | null
          milestone_changes: Json | null
          terms_changes: string | null
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          round_number: number
          submitted_by: string
          status?: string
          changes_summary?: string | null
          milestone_changes?: Json | null
          terms_changes?: string | null
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          round_number?: number
          submitted_by?: string
          status?: string
          changes_summary?: string | null
          milestone_changes?: Json | null
          terms_changes?: string | null
          created_at?: string
          responded_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          completed_at: string | null
          counterparty_id: string | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          funded_at: string | null
          id: string
          industry: string
          initiator_id: string
          initiator_role: string
          invite_token: string | null
          payment_method: string
          platform_fee: number | null
          platform_fee_pct: number
          ref_code: string
          signed_counterparty_at: string | null
          signed_initiator_at: string | null
          start_date: string | null
          state: string
          terms: string | null
          title: string
          total_value: number
        }
        Insert: {
          completed_at?: string | null
          counterparty_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          funded_at?: string | null
          id?: string
          industry?: string
          initiator_id: string
          initiator_role?: string
          invite_token?: string | null
          payment_method?: string
          platform_fee?: number | null
          platform_fee_pct?: number
          ref_code: string
          signed_counterparty_at?: string | null
          signed_initiator_at?: string | null
          start_date?: string | null
          state?: string
          terms?: string | null
          title: string
          total_value: number
        }
        Update: {
          completed_at?: string | null
          counterparty_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          funded_at?: string | null
          id?: string
          industry?: string
          initiator_id?: string
          initiator_role?: string
          invite_token?: string | null
          payment_method?: string
          platform_fee?: number | null
          platform_fee_pct?: number
          ref_code?: string
          signed_counterparty_at?: string | null
          signed_initiator_at?: string | null
          start_date?: string | null
          state?: string
          terms?: string | null
          title?: string
          total_value?: number
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          author_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          industry: string
          is_public: boolean
          is_system: boolean
          terms: string | null
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          industry?: string
          is_public?: boolean
          is_system?: boolean
          terms?: string | null
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          author_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          industry?: string
          is_public?: boolean
          is_system?: boolean
          terms?: string | null
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          milestone_id: string
          note: string | null
          submitted_by: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          milestone_id: string
          note?: string | null
          submitted_by: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          milestone_id?: string
          note?: string | null
          submitted_by?: string
        }
        Relationships: []
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          file_name: string | null
          file_url: string | null
          id: string
          submitted_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          submitted_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          submitted_by?: string
        }
        Relationships: []
      }
      dispute_ai_analyses: {
        Row: {
          appeal_risk: string
          applied: boolean
          applied_at: string | null
          applied_by: string | null
          auto_resolvable: boolean
          confidence: number
          contract_compliance: Json | null
          created_at: string
          dispute_id: string
          evidence_summary: Json | null
          id: string
          key_factors: string[]
          overridden: boolean
          recommended_ruling: string
          reasoning: string
          vendor_pct: number | null
        }
        Insert: {
          appeal_risk?: string
          applied?: boolean
          applied_at?: string | null
          applied_by?: string | null
          auto_resolvable?: boolean
          confidence: number
          contract_compliance?: Json | null
          created_at?: string
          dispute_id: string
          evidence_summary?: Json | null
          id?: string
          key_factors?: string[]
          overridden?: boolean
          recommended_ruling: string
          reasoning: string
          vendor_pct?: number | null
        }
        Update: {
          appeal_risk?: string
          applied?: boolean
          applied_at?: string | null
          applied_by?: string | null
          auto_resolvable?: boolean
          confidence?: number
          contract_compliance?: Json | null
          created_at?: string
          dispute_id?: string
          evidence_summary?: Json | null
          id?: string
          key_factors?: string[]
          overridden?: boolean
          recommended_ruling?: string
          reasoning?: string
          vendor_pct?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          arbitrator_id: string | null
          contract_id: string
          description: string
          dispute_fee_paid: boolean
          id: string
          milestone_id: string
          raised_at: string
          raised_by: string
          reason: string
          resolved_at: string | null
          respondent_id: string
          response_due_at: string
          ruling: string | null
          ruling_notes: string | null
          ruling_pct_vendor: number | null
          status: string
        }
        Insert: {
          arbitrator_id?: string | null
          contract_id: string
          description: string
          dispute_fee_paid?: boolean
          id?: string
          milestone_id: string
          raised_at?: string
          raised_by: string
          reason: string
          resolved_at?: string | null
          respondent_id: string
          response_due_at: string
          ruling?: string | null
          ruling_notes?: string | null
          ruling_pct_vendor?: number | null
          status?: string
        }
        Update: {
          arbitrator_id?: string | null
          contract_id?: string
          description?: string
          dispute_fee_paid?: boolean
          id?: string
          milestone_id?: string
          raised_at?: string
          raised_by?: string
          reason?: string
          resolved_at?: string | null
          respondent_id?: string
          response_due_at?: string
          ruling?: string | null
          ruling_notes?: string | null
          ruling_pct_vendor?: number | null
          status?: string
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          contract_id: string | null
          created_at: string
          flagged_by: string
          id: string
          notes: string | null
          reason: string
          severity: string
          status: string
          user_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          flagged_by: string
          id?: string
          notes?: string | null
          reason: string
          severity?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          flagged_by?: string
          id?: string
          notes?: string | null
          reason?: string
          severity?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          amount: number
          approved_at: string | null
          auto_released: boolean
          contract_id: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          order_index: number
          paid_at: string | null
          state: string
          submitted_at: string | null
          title: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          auto_released?: boolean
          contract_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          order_index: number
          paid_at?: string | null
          state?: string
          submitted_at?: string | null
          title: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          auto_released?: boolean
          contract_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          order_index?: number
          paid_at?: string | null
          state?: string
          submitted_at?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          contract_id: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          contract_id?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          contract_id: string
          created_at: string
          currency: string
          fee_amount: number
          gross_amount: number
          id: string
          metadata: Json | null
          milestone_id: string | null
          net_amount: number
          payment_type: string
          provider: string
          provider_ref: string | null
          provider_status: string
          recipient_id: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          currency: string
          fee_amount?: number
          gross_amount: number
          id?: string
          metadata?: Json | null
          milestone_id?: string | null
          net_amount: number
          payment_type: string
          provider: string
          provider_ref?: string | null
          provider_status?: string
          recipient_id?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          currency?: string
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json | null
          milestone_id?: string | null
          net_amount?: number
          payment_type?: string
          provider?: string
          provider_ref?: string | null
          provider_status?: string
          recipient_id?: string | null
        }
        Relationships: []
      }
      template_milestones: {
        Row: {
          amount_hint: number | null
          created_at: string
          description: string | null
          id: string
          order_index: number
          template_id: string
          title: string
        }
        Insert: {
          amount_hint?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          template_id: string
          title: string
        }
        Update: {
          amount_hint?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          template_id?: string
          title?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          event_type: string
          failed_at: string | null
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          subscription_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          failed_at?: string | null
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          failed_at?: string | null
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id?: string
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          secret: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events: string[]
          id?: string
          is_active?: boolean
          secret: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bank_account_number: string | null
          bank_code: string | null
          bank_name: string | null
          completed_count: number
          created_at: string
          dispute_count: number
          email: string
          full_name: string
          id: string
          kyc_status: string
          paystack_recipient_code: string | null
          phone: string | null
          preferred_payout: string
          total_contracts: number
          trust_score: number
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          completed_count?: number
          created_at?: string
          dispute_count?: number
          email: string
          full_name: string
          id: string
          kyc_status?: string
          paystack_recipient_code?: string | null
          phone?: string | null
          preferred_payout?: string
          total_contracts?: number
          trust_score?: number
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          completed_count?: number
          created_at?: string
          dispute_count?: number
          email?: string
          full_name?: string
          id?: string
          kyc_status?: string
          paystack_recipient_code?: string | null
          phone?: string | null
          preferred_payout?: string
          total_contracts?: number
          trust_score?: number
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      platform_metrics: {
        Row: {
          active_contracts: number | null
          completed_contracts: number | null
          disputed_contracts: number | null
          open_disputes: number | null
          total_contracts: number | null
          total_escrow_volume: number | null
          total_revenue: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_contract_state_distribution: {
        Args: Record<string, never>
        Returns: {
          count: number
          state: string
        }[]
      }
      increment_template_use: {
        Args: {
          template_id: string
        }
        Returns: undefined
      }
      increment_user_completed: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      increment_user_contracts: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      update_trust_score: {
        Args: {
          direction: string
          user_id: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
