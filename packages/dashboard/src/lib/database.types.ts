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
      account_deletion_jobs: {
        Row: {
          attempt_count: number
          claim_token: string | null
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          next_attempt_at: string
          status: string
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          claim_token?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          next_attempt_at?: string
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          claim_token?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          next_attempt_at?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      activation_milestones: {
        Row: {
          environment: string
          event_name: string
          first_seen_at: string
          metadata: Json
          project_id: string
          user_id: string
        }
        Insert: {
          environment?: string
          event_name: string
          first_seen_at?: string
          metadata?: Json
          project_id: string
          user_id: string
        }
        Update: {
          environment?: string
          event_name?: string
          first_seen_at?: string
          metadata?: Json
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_setup_audit: {
        Row: {
          created_at: string
          event_type: string
          expires_at: string | null
          id: string
          metadata: Json
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_setup_audit_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_setup_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          metadata: Json
          project_id: string
          revoked_at: string | null
          token_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          metadata?: Json
          project_id: string
          revoked_at?: string | null
          token_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json
          project_id?: string
          revoked_at?: string | null
          token_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_setup_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      api_idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key_hash: string
          project_id: string
          request_hash: string
          response_body: Json | null
          response_status: number | null
          route: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key_hash: string
          project_id: string
          request_hash?: string
          response_body?: Json | null
          response_status?: number | null
          route: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          key_hash?: string
          project_id?: string
          request_hash?: string
          response_body?: Json | null
          response_status?: number | null
          route?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_idempotency_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_applications: {
        Row: {
          applied_at: string
          created_at: string
          current_tool: string | null
          email: string
          email_hash: string
          id: string
          install_timeline: string
          product_stage: string
          status: string
          updated_at: string
          use_case: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          current_tool?: string | null
          email: string
          email_hash: string
          id?: string
          install_timeline: string
          product_stage: string
          status?: string
          updated_at?: string
          use_case: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          current_tool?: string | null
          email?: string
          email_hash?: string
          id?: string
          install_timeline?: string
          product_stage?: string
          status?: string
          updated_at?: string
          use_case?: string
        }
        Relationships: [
          {
            foreignKeyName: "beta_applications_email_hash_fkey"
            columns: ["email_hash"]
            isOneToOne: true
            referencedRelation: "marketing_leads"
            referencedColumns: ["email_hash"]
          },
        ]
      }
      early_adopter_feedback: {
        Row: {
          anything_else: string | null
          bad: string
          cycle_number: number
          good: string
          id: string
          improve: string
          membership_id: string
          submitted_at: string
        }
        Insert: {
          anything_else?: string | null
          bad: string
          cycle_number: number
          good: string
          id?: string
          improve: string
          membership_id: string
          submitted_at?: string
        }
        Update: {
          anything_else?: string | null
          bad?: string
          cycle_number?: number
          good?: string
          id?: string
          improve?: string
          membership_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "early_adopter_feedback_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "early_adopter_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      early_adopter_memberships: {
        Row: {
          accepted_at: string
          account_linked_at: string | null
          completed_at: string | null
          created_at: string
          email: string
          email_hash: string
          feedback_due_at: string | null
          feedback_opens_at: string | null
          grace_ends_at: string | null
          id: string
          last_feedback_at: string | null
          onboarding_completed_at: string | null
          pro_months_earned: number
          programme_ends_at: string | null
          programme_expires_at: string | null
          removed_at: string | null
          seat_number: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          account_linked_at?: string | null
          completed_at?: string | null
          created_at?: string
          email: string
          email_hash: string
          feedback_due_at?: string | null
          feedback_opens_at?: string | null
          grace_ends_at?: string | null
          id?: string
          last_feedback_at?: string | null
          onboarding_completed_at?: string | null
          pro_months_earned?: number
          programme_ends_at?: string | null
          programme_expires_at?: string | null
          removed_at?: string | null
          seat_number: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          account_linked_at?: string | null
          completed_at?: string | null
          created_at?: string
          email?: string
          email_hash?: string
          feedback_due_at?: string | null
          feedback_opens_at?: string | null
          grace_ends_at?: string | null
          id?: string
          last_feedback_at?: string | null
          onboarding_completed_at?: string | null
          pro_months_earned?: number
          programme_ends_at?: string | null
          programme_expires_at?: string | null
          removed_at?: string | null
          seat_number?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      early_adopter_notices: {
        Row: {
          cycle_number: number
          id: string
          membership_id: string
          notice_type: string
          sent_at: string
        }
        Insert: {
          cycle_number: number
          id?: string
          membership_id: string
          notice_type: string
          sent_at?: string
        }
        Update: {
          cycle_number?: number
          id?: string
          membership_id?: string
          notice_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "early_adopter_notices_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "early_adopter_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      early_adopter_programmes: {
        Row: {
          capacity: number
          created_at: string
          enrolment_open: boolean
          id: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          enrolment_open?: boolean
          id?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          enrolment_open?: boolean
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_accounts: {
        Row: {
          billing_currency: string | null
          billing_email: string | null
          billing_interval: string | null
          billing_interval_count: number | null
          billing_status: string
          cancel_at_period_end: boolean
          complimentary_pro_until: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          dodo_customer_id: string | null
          dodo_product_id: string | null
          dodo_subscription_id: string | null
          downgrade_finalized_at: string | null
          grace_cycle_id: string | null
          grace_ends_at: string | null
          grace_started_at: string | null
          last_event_at: string | null
          last_event_id: string | null
          last_event_type: string | null
          plan_tier: string
          recurring_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_currency?: string | null
          billing_email?: string | null
          billing_interval?: string | null
          billing_interval_count?: number | null
          billing_status?: string
          cancel_at_period_end?: boolean
          complimentary_pro_until?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dodo_customer_id?: string | null
          dodo_product_id?: string | null
          dodo_subscription_id?: string | null
          downgrade_finalized_at?: string | null
          grace_cycle_id?: string | null
          grace_ends_at?: string | null
          grace_started_at?: string | null
          last_event_at?: string | null
          last_event_id?: string | null
          last_event_type?: string | null
          plan_tier?: string
          recurring_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_currency?: string | null
          billing_email?: string | null
          billing_interval?: string | null
          billing_interval_count?: number | null
          billing_status?: string
          cancel_at_period_end?: boolean
          complimentary_pro_until?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dodo_customer_id?: string | null
          dodo_product_id?: string | null
          dodo_subscription_id?: string | null
          downgrade_finalized_at?: string | null
          grace_cycle_id?: string | null
          grace_ends_at?: string | null
          grace_started_at?: string | null
          last_event_at?: string | null
          last_event_id?: string | null
          last_event_type?: string | null
          plan_tier?: string
          recurring_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          attempt_count: number
          claim_token: string | null
          created_at: string
          dodo_customer_id: string | null
          dodo_subscription_id: string | null
          event_type: string
          id: string
          locked_at: string | null
          occurred_at: string | null
          payload: Json
          processed_at: string | null
          processing_error: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          claim_token?: string | null
          created_at?: string
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          event_type: string
          id: string
          locked_at?: string | null
          occurred_at?: string | null
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          claim_token?: string | null
          created_at?: string
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          event_type?: string
          id?: string
          locked_at?: string | null
          occurred_at?: string | null
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_lifecycle_notices: {
        Row: {
          created_at: string
          grace_cycle_id: string
          id: string
          notice_day: number
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grace_cycle_id: string
          id?: string
          notice_day: number
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grace_cycle_id?: string
          id?: string
          notice_day?: number
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      board_announcements: {
        Row: {
          board_id: string
          body: string
          created_at: string
          created_by: string | null
          href: string | null
          id: string
          project_id: string
          published_at: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          board_id: string
          body: string
          created_at?: string
          created_by?: string | null
          href?: string | null
          id?: string
          project_id: string
          published_at?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          board_id?: string
          body?: string
          created_at?: string
          created_by?: string | null
          href?: string | null
          id?: string
          project_id?: string
          published_at?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_announcements_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "public_board_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_announcements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      board_follows: {
        Row: {
          board_id: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_follows_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "public_board_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_follows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      board_reports: {
        Row: {
          board_id: string
          created_at: string
          details: string | null
          feedback_id: string | null
          id: string
          project_id: string
          reason: string
          reporter_email: string | null
          reporter_identifier: string
          status: string
          target_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          board_id: string
          created_at?: string
          details?: string | null
          feedback_id?: string | null
          id?: string
          project_id: string
          reason: string
          reporter_email?: string | null
          reporter_identifier: string
          status?: string
          target_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string
          details?: string | null
          feedback_id?: string | null
          id?: string
          project_id?: string
          reason?: string
          reporter_email?: string | null
          reporter_identifier?: string
          status?: string
          target_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_reports_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "public_board_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_reports_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          metadata: Json
          processed_count: number
          sent_count: number
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          metadata?: Json
          processed_count?: number
          sent_count?: number
          started_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          metadata?: Json
          processed_count?: number
          sent_count?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      email_delivery_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          occurred_at: string
          provider_email_id: string | null
          provider_event_id: string
          reason: string | null
          recipient_hashes: string[]
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          occurred_at: string
          provider_email_id?: string | null
          provider_event_id: string
          reason?: string | null
          recipient_hashes?: string[]
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          occurred_at?: string
          provider_email_id?: string | null
          provider_event_id?: string
          reason?: string | null
          recipient_hashes?: string[]
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string
          last_event_at: string
          provider_event_id: string
          reason: string
          recipient_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          last_event_at: string
          provider_event_id: string
          reason: string
          recipient_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          last_event_at?: string
          provider_event_id?: string
          reason?: string
          recipient_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          agent_name: string | null
          agent_session_id: string | null
          attachments: Json | null
          created_at: string
          email: string | null
          id: string
          is_archived: boolean
          is_public: boolean | null
          message: string
          metadata: Json
          priority: string
          project_id: string
          rating: number | null
          read_at: string | null
          resolved_at: string | null
          screenshot_path: string | null
          screenshot_url: string | null
          status: string
          structured_data: Json | null
          tags: string[]
          type: string | null
          updated_at: string
          url: string | null
          user_agent: string
          vote_count: number | null
        }
        Insert: {
          agent_name?: string | null
          agent_session_id?: string | null
          attachments?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          is_archived?: boolean
          is_public?: boolean | null
          message: string
          metadata?: Json
          priority?: string
          project_id: string
          rating?: number | null
          read_at?: string | null
          resolved_at?: string | null
          screenshot_path?: string | null
          screenshot_url?: string | null
          status?: string
          structured_data?: Json | null
          tags?: string[]
          type?: string | null
          updated_at?: string
          url?: string | null
          user_agent: string
          vote_count?: number | null
        }
        Update: {
          agent_name?: string | null
          agent_session_id?: string | null
          attachments?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          is_archived?: boolean
          is_public?: boolean | null
          message?: string
          metadata?: Json
          priority?: string
          project_id?: string
          rating?: number | null
          read_at?: string | null
          resolved_at?: string | null
          screenshot_path?: string | null
          screenshot_url?: string | null
          status?: string
          structured_data?: Json | null
          tags?: string[]
          type?: string | null
          updated_at?: string
          url?: string | null
          user_agent?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_activity: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          feedback_id: string
          from_value: Json | null
          id: string
          metadata: Json
          project_id: string
          to_value: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          feedback_id: string
          from_value?: Json | null
          id?: string
          metadata?: Json
          project_id: string
          to_value?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          feedback_id?: string
          from_value?: Json | null
          id?: string
          metadata?: Json
          project_id?: string
          to_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_activity_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_media: {
        Row: {
          bucket: string
          created_at: string
          deleted_at: string | null
          feedback_id: string
          id: string
          kind: string
          mime_type: string
          original_filename: string
          project_id: string
          safe_filename: string
          scan_status: string
          scanned_at: string | null
          sha256: string | null
          size_bytes: number
          storage_path: string
        }
        Insert: {
          bucket: string
          created_at?: string
          deleted_at?: string | null
          feedback_id: string
          id?: string
          kind: string
          mime_type: string
          original_filename: string
          project_id: string
          safe_filename: string
          scan_status?: string
          scanned_at?: string | null
          sha256?: string | null
          size_bytes: number
          storage_path: string
        }
        Update: {
          bucket?: string
          created_at?: string
          deleted_at?: string | null
          feedback_id?: string
          id?: string
          kind?: string
          mime_type?: string
          original_filename?: string
          project_id?: string
          safe_filename?: string
          scan_status?: string
          scanned_at?: string | null
          sha256?: string | null
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_media_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_notes: {
        Row: {
          content: string
          created_at: string
          feedback_id: string
          id: string
          is_public: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feedback_id: string
          id?: string
          is_public?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          feedback_id?: string
          id?: string
          is_public?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_notes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_watches: {
        Row: {
          board_id: string
          created_at: string
          feedback_id: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          feedback_id: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          feedback_id?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_watches_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "public_board_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_watches_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_watches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_conversion_events: {
        Row: {
          attempt_count: number
          attribution: Json
          consent_version: string
          created_at: string
          delivered_at: string | null
          email_hash: string | null
          event_id: string
          event_name: string
          provider_results: Json
          source_url: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          attribution?: Json
          consent_version: string
          created_at?: string
          delivered_at?: string | null
          email_hash?: string | null
          event_id: string
          event_name: string
          provider_results?: Json
          source_url?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          attribution?: Json
          consent_version?: string
          created_at?: string
          delivered_at?: string | null
          email_hash?: string | null
          event_id?: string
          event_name?: string
          provider_results?: Json
          source_url?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          attribution: Json
          consent_version: string
          consented_at: string
          created_at: string
          email: string
          email_hash: string
          id: string
          source: string
          updated_at: string
          use_case: string | null
        }
        Insert: {
          attribution?: Json
          consent_version: string
          consented_at: string
          created_at?: string
          email: string
          email_hash: string
          id?: string
          source?: string
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          attribution?: Json
          consent_version?: string
          consented_at?: string
          created_at?: string
          email?: string
          email_hash?: string
          id?: string
          source?: string
          updated_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      notification_digests: {
        Row: {
          created_at: string
          digest_date: string
          digest_type: string
          id: string
          item_count: number
          sent_at: string
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          digest_date: string
          digest_type: string
          id?: string
          item_count?: number
          sent_at?: string
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          created_at?: string
          digest_date?: string
          digest_type?: string
          id?: string
          item_count?: number
          sent_at?: string
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      product_update_metrics: {
        Row: {
          count: number
          created_at: string
          event_type: string
          metric_date: string
          project_id: string
          update_id: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          event_type: string
          metric_date?: string
          project_id: string
          update_id: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          event_type?: string
          metric_date?: string
          project_id?: string
          update_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_update_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_update_metrics_project_id_update_id_fkey"
            columns: ["project_id", "update_id"]
            isOneToOne: false
            referencedRelation: "product_updates"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      product_update_settings: {
        Row: {
          accent_color: string | null
          auto_show: boolean
          created_at: string
          display_delay_ms: number
          enabled: boolean
          exclude_paths: string[]
          include_paths: string[]
          project_id: string
          show_powered_by: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          auto_show?: boolean
          created_at?: string
          display_delay_ms?: number
          enabled?: boolean
          exclude_paths?: string[]
          include_paths?: string[]
          project_id: string
          show_powered_by?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          auto_show?: boolean
          created_at?: string
          display_delay_ms?: number
          enabled?: boolean
          exclude_paths?: string[]
          include_paths?: string[]
          project_id?: string
          show_powered_by?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_update_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      product_updates: {
        Row: {
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          ctas: Json
          expires_at: string | null
          highlights: string[]
          id: string
          image_alt_text: string | null
          image_path: string | null
          is_enabled: boolean
          project_id: string
          published_at: string | null
          status: string
          summary: string
          title: string
          updated_at: string
          version_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          ctas?: Json
          expires_at?: string | null
          highlights?: string[]
          id?: string
          image_alt_text?: string | null
          image_path?: string | null
          is_enabled?: boolean
          project_id: string
          published_at?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
          version_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          ctas?: Json
          expires_at?: string | null
          highlights?: string[]
          id?: string
          image_alt_text?: string | null
          image_path?: string | null
          is_enabled?: boolean
          project_id?: string
          published_at?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_api_key_events: {
        Row: {
          actor_user_id: string | null
          api_key_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          project_id: string
        }
        Insert: {
          actor_user_id?: string | null
          api_key_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          project_id: string
        }
        Update: {
          actor_user_id?: string | null
          api_key_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_api_key_events_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "project_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_api_key_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_last_four: string
          last_used_at: string | null
          name: string
          project_id: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_last_four: string
          last_used_at?: string | null
          name?: string
          project_id: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_last_four?: string
          last_used_at?: string | null
          name?: string
          project_id?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "project_api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_embed_installations: {
        Row: {
          created_at: string
          feedback_enabled: boolean
          last_seen_at: string
          project_id: string
          runtime_version: string | null
          updated_at: string
          updates_enabled: boolean
        }
        Insert: {
          created_at?: string
          feedback_enabled?: boolean
          last_seen_at?: string
          project_id: string
          runtime_version?: string | null
          updated_at?: string
          updates_enabled?: boolean
        }
        Update: {
          created_at?: string
          feedback_enabled?: boolean
          last_seen_at?: string
          project_id?: string
          runtime_version?: string | null
          updated_at?: string
          updates_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_embed_installations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_integration_secret_events: {
        Row: {
          created_at: string
          destination_hint: string
          endpoint_id: string
          event_type: string
          id: string
          kind: string
          project_id: string
        }
        Insert: {
          created_at?: string
          destination_hint: string
          endpoint_id: string
          event_type: string
          id?: string
          kind: string
          project_id: string
        }
        Update: {
          created_at?: string
          destination_hint?: string
          endpoint_id?: string
          event_type?: string
          id?: string
          kind?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_integration_secret_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_integration_secrets: {
        Row: {
          auth_tag: string
          ciphertext: string
          created_at: string
          destination_hint: string
          endpoint_id: string
          id: string
          initialization_vector: string
          key_version: number
          kind: string
          project_id: string
          updated_at: string
        }
        Insert: {
          auth_tag: string
          ciphertext: string
          created_at?: string
          destination_hint: string
          endpoint_id: string
          id?: string
          initialization_vector: string
          key_version?: number
          kind: string
          project_id: string
          updated_at?: string
        }
        Update: {
          auth_tag?: string
          ciphertext?: string
          created_at?: string
          destination_hint?: string
          endpoint_id?: string
          id?: string
          initialization_vector?: string
          key_version?: number
          kind?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_integration_secrets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          api_key: string | null
          api_key_hash: string | null
          api_key_last_four: string | null
          created_at: string
          creation_request_id: string | null
          domain: string | null
          environment: string
          expires_at: string | null
          id: string
          name: string
          owner_user_id: string
          plan_freeze_reason: string | null
          plan_frozen_at: string | null
          quarantined_at: string | null
          settings: Json
          test_namespace: string | null
          updated_at: string
          webhooks: Json
        }
        Insert: {
          api_key?: string | null
          api_key_hash?: string | null
          api_key_last_four?: string | null
          created_at?: string
          creation_request_id?: string | null
          domain?: string | null
          environment?: string
          expires_at?: string | null
          id?: string
          name: string
          owner_user_id: string
          plan_freeze_reason?: string | null
          plan_frozen_at?: string | null
          quarantined_at?: string | null
          settings?: Json
          test_namespace?: string | null
          updated_at?: string
          webhooks?: Json
        }
        Update: {
          api_key?: string | null
          api_key_hash?: string | null
          api_key_last_four?: string | null
          created_at?: string
          creation_request_id?: string | null
          domain?: string | null
          environment?: string
          expires_at?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          plan_freeze_reason?: string | null
          plan_frozen_at?: string | null
          quarantined_at?: string | null
          settings?: Json
          test_namespace?: string | null
          updated_at?: string
          webhooks?: Json
        }
        Relationships: []
      }
      public_board_settings: {
        Row: {
          accent_color: string | null
          allow_submissions: boolean | null
          branding: Json | null
          categories: string[]
          created_at: string
          custom_css: string | null
          description: string | null
          directory_opt_in: boolean
          display_name: string | null
          empty_state_description: string | null
          empty_state_title: string | null
          enabled: boolean
          hero_description: string | null
          hero_eyebrow: string | null
          hero_title: string | null
          id: string
          logo_emoji: string | null
          project_id: string
          require_email_to_vote: boolean | null
          show_types: string[] | null
          slug: string
          tagline: string | null
          title: string | null
          updated_at: string
          visibility: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          allow_submissions?: boolean | null
          branding?: Json | null
          categories?: string[]
          created_at?: string
          custom_css?: string | null
          description?: string | null
          directory_opt_in?: boolean
          display_name?: string | null
          empty_state_description?: string | null
          empty_state_title?: string | null
          enabled?: boolean
          hero_description?: string | null
          hero_eyebrow?: string | null
          hero_title?: string | null
          id?: string
          logo_emoji?: string | null
          project_id: string
          require_email_to_vote?: boolean | null
          show_types?: string[] | null
          slug: string
          tagline?: string | null
          title?: string | null
          updated_at?: string
          visibility?: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          allow_submissions?: boolean | null
          branding?: Json | null
          categories?: string[]
          created_at?: string
          custom_css?: string | null
          description?: string | null
          directory_opt_in?: boolean
          display_name?: string | null
          empty_state_description?: string | null
          empty_state_title?: string | null
          enabled?: boolean
          hero_description?: string | null
          hero_eyebrow?: string | null
          hero_title?: string | null
          id?: string
          logo_emoji?: string | null
          project_id?: string
          require_email_to_vote?: boolean | null
          show_types?: string[] | null
          slug?: string
          tagline?: string | null
          title?: string | null
          updated_at?: string
          visibility?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_board_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          key: string
          route: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          route: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          route?: string
        }
        Relationships: []
      }
      referral_programs: {
        Row: {
          code: string
          created_at: string
          reward_expires_at: string | null
          reward_granted_at: string | null
          successful_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          reward_expires_at?: string | null
          reward_granted_at?: string | null
          successful_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          reward_expires_at?: string | null
          reward_granted_at?: string | null
          successful_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_signups: {
        Row: {
          created_at: string
          device_hash: string | null
          id: string
          invited_email_hash: string | null
          invited_user_id: string
          inviter_user_id: string
          network_hash: string | null
          qualification_milestone: string | null
          qualified_at: string | null
          referral_code: string
          rejected_at: string | null
          risk_reasons: string[]
          risk_score: number
          status: string
        }
        Insert: {
          created_at?: string
          device_hash?: string | null
          id?: string
          invited_email_hash?: string | null
          invited_user_id: string
          inviter_user_id: string
          network_hash?: string | null
          qualification_milestone?: string | null
          qualified_at?: string | null
          referral_code: string
          rejected_at?: string | null
          risk_reasons?: string[]
          risk_score?: number
          status?: string
        }
        Update: {
          created_at?: string
          device_hash?: string | null
          id?: string
          invited_email_hash?: string | null
          invited_user_id?: string
          inviter_user_id?: string
          network_hash?: string | null
          qualification_milestone?: string | null
          qualified_at?: string | null
          referral_code?: string
          rejected_at?: string | null
          risk_reasons?: string[]
          risk_score?: number
          status?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          count: number
          created_at: string
          id: string
          metric: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          metric: string
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          metric?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_acquisition: {
        Row: {
          attribution: Json
          consent_version: string | null
          created_at: string
          device_hash: string | null
          network_hash: string | null
          referral_code: string | null
          signup_event_id: string | null
          signup_recorded_at: string
          user_id: string
        }
        Insert: {
          attribution?: Json
          consent_version?: string | null
          created_at?: string
          device_hash?: string | null
          network_hash?: string | null
          referral_code?: string | null
          signup_event_id?: string | null
          signup_recorded_at?: string
          user_id: string
        }
        Update: {
          attribution?: Json
          consent_version?: string | null
          created_at?: string
          device_hash?: string | null
          network_hash?: string | null
          referral_code?: string | null
          signup_event_id?: string | null
          signup_recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          notification_settings: Json
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notification_settings?: Json
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notification_settings?: Json
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          vote_type: string
          voter_identifier: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          vote_type: string
          voter_identifier: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          vote_type?: string
          voter_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          endpoint_id: string | null
          error: string | null
          event: string
          id: string
          kind: string
          payload: Json | null
          project_id: string
          response_body: string | null
          response_time_ms: number | null
          status: string
          status_code: number | null
          url: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          endpoint_id?: string | null
          error?: string | null
          event: string
          id?: string
          kind: string
          payload?: Json | null
          project_id: string
          response_body?: string | null
          response_time_ms?: number | null
          status: string
          status_code?: number | null
          url: string
        }
        Update: {
          attempt?: number
          created_at?: string
          endpoint_id?: string | null
          error?: string | null
          event?: string
          id?: string
          kind?: string
          payload?: Json | null
          project_id?: string
          response_body?: string | null
          response_time_ms?: number | null
          status?: string
          status_code?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_digest_items: {
        Row: {
          attempt: number
          created_at: string
          digest_date: string
          endpoint_id: string | null
          endpoint_url: string
          event: string
          id: string
          kind: string
          last_delivery_id: string | null
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          digest_date?: string
          endpoint_id?: string | null
          endpoint_url: string
          event?: string
          id?: string
          kind: string
          last_delivery_id?: string | null
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload: Json
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          digest_date?: string
          endpoint_id?: string | null
          endpoint_url?: string
          event?: string
          id?: string
          kind?: string
          last_delivery_id?: string | null
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_digest_items_last_delivery_id_fkey"
            columns: ["last_delivery_id"]
            isOneToOne: false
            referencedRelation: "webhook_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_digest_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_jobs: {
        Row: {
          attempt: number
          created_at: string
          endpoint_id: string | null
          endpoint_url: string
          event: string
          id: string
          kind: string
          last_delivery_id: string | null
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          endpoint_id?: string | null
          endpoint_url: string
          event: string
          id?: string
          kind: string
          last_delivery_id?: string | null
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload: Json
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          endpoint_id?: string | null
          endpoint_url?: string
          event?: string
          id?: string
          kind?: string
          last_delivery_id?: string | null
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_jobs_last_delivery_id_fkey"
            columns: ["last_delivery_id"]
            isOneToOne: false
            referencedRelation: "webhook_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_config_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          project_id: string
          user_id: string | null
          widget_config_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          project_id: string
          user_id?: string | null
          widget_config_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          project_id?: string
          user_id?: string | null
          widget_config_id?: string
        }
        Relationships: []
      }
      widget_configs: {
        Row: {
          channel: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          label: string
          project_id: string
          updated_at: string
          version: number
        }
        Insert: {
          channel?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          project_id: string
          updated_at?: string
          version: number
        }
        Update: {
          channel?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          project_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "widget_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_presets: {
        Row: {
          category: string | null
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          preview_image_url: string | null
          slug: string
        }
        Insert: {
          category?: string | null
          config: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          preview_image_url?: string | null
          slug: string
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          preview_image_url?: string | null
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_early_adopter: {
        Args: { p_email: string; p_email_hash: string }
        Returns: Json
      }
      activate_early_adopter_membership: {
        Args: { p_email: string; p_email_hash: string; p_user_id: string }
        Returns: Json
      }
      apply_claimed_billing_event: {
        Args: {
          p_billing_email: string
          p_billing_interval: string
          p_billing_interval_count: number
          p_billing_status: string
          p_cancel_at_period_end: boolean
          p_claim_token: string
          p_currency: string
          p_customer_id: string
          p_event_id: string
          p_occurred_at: string
          p_period_end: string
          p_period_start: string
          p_plan_tier: string
          p_product_id: string
          p_recurring_amount: number
          p_subscription_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      avg_rating_for_project: {
        Args: { p_project_id: string }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_limit?: number
          p_route: string
          p_window_seconds?: number
        }
        Returns: Json
      }
      complete_early_adopter_onboarding: {
        Args: { p_user_id: string }
        Returns: Json
      }
      claim_account_deletion_jobs: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          attempt_count: number
          claim_token: string | null
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          next_attempt_at: string
          status: string
          updated_at: string
          user_email: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "account_deletion_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_billing_event: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_event_type: string
          p_occurred_at: string
          p_payload: Json
          p_subscription_id: string
          p_user_id: string
        }
        Returns: string
      }
      count_by_column: {
        Args: {
          column_name: string
          filter_project_id: string
          table_name: string
        }
        Returns: Json
      }
      create_project_with_quota: {
        Args: {
          p_bypass_quota?: boolean
          p_free_project_limit?: number
          p_project: Json
        }
        Returns: Json
      }
      dashboard_stats: {
        Args: {
          p_history_cutoff?: string
          p_project_id?: string
          p_trend_start?: string
          p_user_id: string
        }
        Returns: Json
      }
      fail_claimed_billing_event: {
        Args: { p_claim_token: string; p_error: string; p_event_id: string }
        Returns: undefined
      }
      generate_api_key: { Args: never; Returns: string }
      get_owner_project_health: {
        Args: never
        Returns: {
          board_enabled: boolean
          board_listed: boolean
          board_visibility: string
          embed_last_seen_at: string
          failed_delivery_count: number
          feedback_count: number
          latest_feedback_at: string
          project_id: string
          unread_count: number
          updates_enabled: boolean
        }[]
      }
      get_public_board_directory: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_sort?: string
        }
        Returns: Json
      }
      get_public_board_directory_cursor: {
        Args: {
          p_after_activity?: string
          p_after_id?: string
          p_after_score?: number
          p_category?: string
          p_limit?: number
          p_query?: string
          p_snapshot_at?: string
          p_sort?: string
        }
        Returns: Json
      }
      increment_product_update_metric: {
        Args: {
          p_event_type: string
          p_metric_date?: string
          p_project_id: string
          p_update_id: string
        }
        Returns: number
      }
      increment_usage_counter: {
        Args: {
          p_amount?: number
          p_metric: string
          p_period_start: string
          p_user_id: string
        }
        Returns: number
      }
      submit_early_adopter_feedback: {
        Args: {
          p_anything_else?: string
          p_bad: string
          p_good: string
          p_improve: string
          p_user_id: string
        }
        Returns: Json
      }
      insert_feedback_with_quota: {
        Args: {
          p_allow_replay?: boolean
          p_bypass_plan_freeze?: boolean
          p_bypass_quota?: boolean
          p_feedback: Json
          p_free_feedback_limit?: number
          p_media?: Json
          p_record_first_feedback?: boolean
        }
        Returns: Json
      }
      publish_product_update:
        | {
            Args: {
              p_active_limit: number
              p_allow_scheduling: boolean
              p_expires_at: string
              p_project_id: string
              p_published_at: string
              p_update_id: string
            }
            Returns: {
              created_at: string
              created_by: string | null
              cta_label: string | null
              cta_url: string | null
              ctas: Json
              expires_at: string | null
              highlights: string[]
              id: string
              image_alt_text: string | null
              image_path: string | null
              is_enabled: boolean
              project_id: string
              published_at: string | null
              status: string
              summary: string
              title: string
              updated_at: string
              version_label: string | null
            }
            SetofOptions: {
              from: "*"
              to: "product_updates"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_active_limit: number
              p_allow_scheduling: boolean
              p_expected_updated_at: string
              p_expires_at: string
              p_project_id: string
              p_published_at: string
              p_update_id: string
            }
            Returns: {
              created_at: string
              created_by: string | null
              cta_label: string | null
              cta_url: string | null
              ctas: Json
              expires_at: string | null
              highlights: string[]
              id: string
              image_alt_text: string | null
              image_path: string | null
              is_enabled: boolean
              project_id: string
              published_at: string | null
              status: string
              summary: string
              title: string
              updated_at: string
              version_label: string | null
            }
            SetofOptions: {
              from: "*"
              to: "product_updates"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      qualify_referral_signup: {
        Args: { p_invited_user_id: string }
        Returns: Json
      }
      reconcile_plan_projects: {
        Args: {
          p_effective_pro: boolean
          p_free_project_limit?: number
          p_user_id: string
        }
        Returns: Json
      }
      register_referral_signup: {
        Args: {
          p_device_hash: string
          p_invited_email_hash: string
          p_invited_user_id: string
          p_network_hash: string
          p_referral_code: string
        }
        Returns: Json
      }
      resolve_referral_review: {
        Args: { p_approved: boolean; p_signup_id: string }
        Returns: Json
      }
      rotate_project_api_key: {
        Args: {
          p_actor_user_id: string
          p_key_hash: string
          p_key_last_four: string
          p_project_id: string
        }
        Returns: string
      }
      set_product_update_visibility: {
        Args: {
          p_active_limit: number
          p_enabled: boolean
          p_expected_updated_at: string
          p_project_id: string
          p_update_id: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          ctas: Json
          expires_at: string | null
          highlights: string[]
          id: string
          image_alt_text: string | null
          image_path: string | null
          is_enabled: boolean
          project_id: string
          published_at: string | null
          status: string
          summary: string
          title: string
          updated_at: string
          version_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "product_updates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_project_modules: {
        Args: { p_feedback: boolean; p_project_id: string; p_updates: boolean }
        Returns: {
          feedback: boolean
          updates: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
