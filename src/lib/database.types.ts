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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string
          detail: string
          id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          detail: string
          id?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          abn: string
          bank_account_name: string
          bank_account_number: string
          bank_bsb: string
          business_name: string
          default_quote_exclusions: string
          default_quote_terms: string
          id: boolean
          licence_number: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          abn?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_bsb?: string
          business_name?: string
          default_quote_exclusions?: string
          default_quote_terms?: string
          id?: boolean
          licence_number?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          abn?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_bsb?: string
          business_name?: string
          default_quote_exclusions?: string
          default_quote_terms?: string
          id?: boolean
          licence_number?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          contact: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          phone: string
        }
        Insert: {
          address?: string
          contact?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          notes?: string
          phone?: string
        }
        Update: {
          address?: string
          contact?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
        }
        Relationships: []
      }
      email_alerts: {
        Row: {
          ai_reason: string
          created_at: string
          dismissed: boolean
          from_address: string
          id: string
          message_id: string
          priority: string
          read_at: string | null
          received_at: string
          snippet: string
          subject: string
          thread_id: string | null
        }
        Insert: {
          ai_reason?: string
          created_at?: string
          dismissed?: boolean
          from_address?: string
          id?: string
          message_id: string
          priority?: string
          read_at?: string | null
          received_at: string
          snippet?: string
          subject?: string
          thread_id?: string | null
        }
        Update: {
          ai_reason?: string
          created_at?: string
          dismissed?: boolean
          from_address?: string
          id?: string
          message_id?: string
          priority?: string
          read_at?: string | null
          received_at?: string
          snippet?: string
          subject?: string
          thread_id?: string | null
        }
        Relationships: []
      }
      email_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          connected_by: string | null
          google_email: string | null
          id: boolean
          last_checked_at: string | null
          pending_state: string | null
          pending_state_expires_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          connected_by?: string | null
          google_email?: string | null
          id?: boolean
          last_checked_at?: string | null
          pending_state?: string | null
          pending_state_expires_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          connected_by?: string | null
          google_email?: string | null
          id?: boolean
          last_checked_at?: string | null
          pending_state?: string | null
          pending_state_expires_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processed_messages: {
        Row: {
          message_id: string
          processed_at: string
        }
        Insert: {
          message_id: string
          processed_at?: string
        }
        Update: {
          message_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          includes_gst: boolean
          job_id: string | null
          receipt_storage_path: string | null
          supplier: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          includes_gst?: boolean
          job_id?: string | null
          receipt_storage_path?: string | null
          supplier?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          includes_gst?: boolean
          job_id?: string | null
          receipt_storage_path?: string | null
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          qty: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          qty?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          qty?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          due_date: string
          first_viewed_at: string | null
          id: string
          include_gst: boolean
          job_id: string | null
          last_viewed_at: string | null
          notes: string
          number: string
          payment_terms: string
          share_token: string
          status: string
          view_count: number
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date: string
          due_date: string
          first_viewed_at?: string | null
          id?: string
          include_gst?: boolean
          job_id?: string | null
          last_viewed_at?: string | null
          notes?: string
          number: string
          payment_terms?: string
          share_token?: string
          status?: string
          view_count?: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          due_date?: string
          first_viewed_at?: string | null
          id?: string
          include_gst?: boolean
          job_id?: string | null
          last_viewed_at?: string | null
          notes?: string
          number?: string
          payment_terms?: string
          share_token?: string
          status?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignees: {
        Row: {
          assigned_at: string
          employee_id: string
          job_id: string
        }
        Insert: {
          assigned_at?: string
          employee_id: string
          job_id: string
        }
        Update: {
          assigned_at?: string
          employee_id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checkins: {
        Row: {
          check_in: string
          check_out: string | null
          employee_id: string
          id: string
          job_id: string
          note: string | null
        }
        Insert: {
          check_in: string
          check_out?: string | null
          employee_id: string
          id?: string
          job_id: string
          note?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string | null
          employee_id?: string
          id?: string
          job_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_checkins_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checkins_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checkins_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checkins_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          job_id: string
          po_number: string | null
          supplier: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          job_id: string
          po_number?: string | null
          supplier?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          job_id?: string
          po_number?: string | null
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_line_items: {
        Row: {
          description: string
          id: string
          job_id: string
          qty: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          job_id: string
          qty?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          job_id?: string
          qty?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notes: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          job_id: string
          text: string
          type: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          created_at?: string
          id?: string
          job_id: string
          text: string
          type: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          job_id?: string
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          created_at: string
          id: string
          job_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      job_stages: {
        Row: {
          claim_amount: number | null
          claimed_invoice_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          job_id: string
          name: string
          notes: string
          sort_order: number
          status: string
          target_date: string | null
        }
        Insert: {
          claim_amount?: number | null
          claimed_invoice_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          name: string
          notes?: string
          sort_order?: number
          status?: string
          target_date?: string | null
        }
        Update: {
          claim_amount?: number | null
          claimed_invoice_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          notes?: string
          sort_order?: number
          status?: string
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_stages_claimed_invoice_id_fkey"
            columns: ["claimed_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          coc_issued_date: string | null
          coc_number: string | null
          coc_status: string
          created_at: string
          customer_id: string
          due_date: string
          id: string
          number: string
          photos: number
          pricing_type: string
          quote_id: string | null
          scheduled_time: string | null
          status: string
          title: string
          value: number
        }
        Insert: {
          address?: string | null
          coc_issued_date?: string | null
          coc_number?: string | null
          coc_status?: string
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          number: string
          photos?: number
          pricing_type?: string
          quote_id?: string | null
          scheduled_time?: string | null
          status?: string
          title: string
          value?: number
        }
        Update: {
          address?: string | null
          coc_issued_date?: string | null
          coc_number?: string | null
          coc_status?: string
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          number?: string
          photos?: number
          pricing_type?: string
          quote_id?: string | null
          scheduled_time?: string | null
          status?: string
          title?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          hours: number
          id: string
          note: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          hours: number
          id?: string
          note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          hours?: number
          id?: string
          note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          job_id: string | null
          leave_request_id: string | null
          message: string
          quote_id: string | null
          read_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          leave_request_id?: string | null
          message: string
          quote_id?: string | null
          read_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          leave_request_id?: string | null
          message?: string
          quote_id?: string | null
          read_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          date: string
          id: string
          invoice_id: string
          method: string
        }
        Insert: {
          amount: number
          date: string
          id?: string
          invoice_id: string
          method: string
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          invoice_id?: string
          method?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          name: string
          unit: string
          unit_price: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          unit?: string
          unit_price?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          unit?: string
          unit_price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          employment_start_date: string | null
          employment_type: string
          full_name: string
          hourly_rate: number | null
          id: string
          role: string
          trade_role: string
          weekly_hours: number
        }
        Insert: {
          created_at?: string
          email: string
          employment_start_date?: string | null
          employment_type?: string
          full_name: string
          hourly_rate?: number | null
          id: string
          role: string
          trade_role?: string
          weekly_hours?: number
        }
        Update: {
          created_at?: string
          email?: string
          employment_start_date?: string | null
          employment_type?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          role?: string
          trade_role?: string
          weekly_hours?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          employee_id: string
          endpoint: string
          id: string
          p256dh: string
        }
        Insert: {
          auth: string
          created_at?: string
          employee_id: string
          endpoint: string
          id?: string
          p256dh: string
        }
        Update: {
          auth?: string
          created_at?: string
          employee_id?: string
          endpoint?: string
          id?: string
          p256dh?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          description: string
          id: string
          qty: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          qty?: number
          quote_id: string
          sort_order?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          qty?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          exclusions: string
          first_viewed_at: string | null
          id: string
          include_gst: boolean
          job_id: string | null
          last_viewed_at: string | null
          notes: string
          number: string
          share_token: string
          status: string
          terms: string
          validity_days: number
          view_count: number
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date: string
          exclusions?: string
          first_viewed_at?: string | null
          id?: string
          include_gst?: boolean
          job_id?: string | null
          last_viewed_at?: string | null
          notes?: string
          number: string
          share_token?: string
          status?: string
          terms?: string
          validity_days?: number
          view_count?: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          exclusions?: string
          first_viewed_at?: string | null
          id?: string
          include_gst?: boolean
          job_id?: string | null
          last_viewed_at?: string | null
          notes?: string
          number?: string
          share_token?: string
          status?: string
          terms?: string
          validity_days?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customers_field_view: {
        Row: {
          address: string | null
          contact: string | null
          id: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      job_line_items_field_view: {
        Row: {
          description: string | null
          id: string | null
          job_id: string | null
          qty: number | null
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          job_id?: string | null
          qty?: number | null
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          id?: string | null
          job_id?: string | null
          qty?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_field_view: {
        Row: {
          address: string | null
          customer_id: string | null
          due_date: string | null
          id: string | null
          number: string | null
          pricing_type: string | null
          scheduled_time: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          address?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string | null
          number?: string | null
          pricing_type?: string | null
          scheduled_time?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          address?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string | null
          number?: string | null
          pricing_type?: string | null
          scheduled_time?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      team_directory: {
        Row: {
          full_name: string | null
          id: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      employee_finish_job: {
        Args: { p_blocked?: boolean; p_job_id: string; p_note?: string }
        Returns: {
          check_in: string
          check_out: string | null
          employee_id: string
          id: string
          job_id: string
          note: string | null
        }
        SetofOptions: {
          from: "*"
          to: "job_checkins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      employee_join_job: { Args: { p_job_id: string }; Returns: undefined }
      employee_start_job: {
        Args: { p_job_id: string }
        Returns: {
          check_in: string
          check_out: string | null
          employee_id: string
          id: string
          job_id: string
          note: string | null
        }
        SetofOptions: {
          from: "*"
          to: "job_checkins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      employee_update_job_status: {
        Args: { p_job_id: string; p_status: string }
        Returns: undefined
      }
      employee_update_stage: {
        Args: { p_complete?: boolean; p_notes?: string; p_stage_id: string }
        Returns: {
          claim_amount: number | null
          claimed_invoice_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          job_id: string
          name: string
          notes: string
          sort_order: number
          status: string
          target_date: string | null
        }
        SetofOptions: {
          from: "*"
          to: "job_stages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_job_crew: {
        Args: { p_job_ids: string[] }
        Returns: {
          check_in: string
          employee_id: string
          full_name: string
          job_id: string
          on_site: boolean
          trade_role: string
        }[]
      }
      get_joinable_jobs: {
        Args: never
        Returns: {
          address: string
          id: string
          number: string
          scheduled_time: string
          status: string
          title: string
        }[]
      }
      get_public_invoice: {
        Args: { p_token: string }
        Returns: {
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_bsb: string
          business_abn: string
          business_licence_number: string
          business_logo_url: string
          business_name: string
          customer_address: string
          customer_contact: string
          customer_name: string
          date: string
          due_date: string
          id: string
          include_gst: boolean
          notes: string
          number: string
          paid_amount: number
          payment_terms: string
          status: string
        }[]
      }
      get_public_invoice_line_items: {
        Args: { p_token: string }
        Returns: {
          description: string
          id: string
          qty: number
          unit_price: number
        }[]
      }
      get_public_quote: {
        Args: { p_token: string }
        Returns: {
          amount: number
          business_abn: string
          business_licence_number: string
          business_logo_url: string
          business_name: string
          customer_address: string
          customer_contact: string
          customer_name: string
          date: string
          exclusions: string
          id: string
          include_gst: boolean
          notes: string
          number: string
          status: string
          terms: string
          validity_days: number
        }[]
      }
      get_public_quote_line_items: {
        Args: { p_token: string }
        Returns: {
          description: string
          id: string
          qty: number
          unit_price: number
        }[]
      }
      is_owner: { Args: never; Returns: boolean }
      mark_invoice_viewed: { Args: { p_token: string }; Returns: undefined }
      mark_quote_viewed: { Args: { p_token: string }; Returns: undefined }
      next_invoice_number: { Args: never; Returns: string }
      next_job_number: { Args: never; Returns: string }
      next_quote_number: { Args: never; Returns: string }
      request_leave: {
        Args: {
          p_end_date: string
          p_hours: number
          p_note?: string
          p_start_date: string
          p_type: string
        }
        Returns: {
          created_at: string
          employee_id: string
          end_date: string
          hours: number
          id: string
          note: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "leave_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_public_quote: {
        Args: { p_accept: boolean; p_token: string }
        Returns: undefined
      }
      review_leave_request: {
        Args: { p_approve: boolean; p_request_id: string }
        Returns: {
          created_at: string
          employee_id: string
          end_date: string
          hours: number
          id: string
          note: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "leave_requests"
          isOneToOne: true
          isSetofReturn: false
        }
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
    Enums: {},
  },
} as const
