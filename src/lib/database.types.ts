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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      _connectivity_test: {
        Row: {
          id: number | null
        }
        Insert: {
          id?: number | null
        }
        Update: {
          id?: number | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          business_id: string | null
          created_at: string
          detail: string
          id: string
          title: string
          type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          detail: string
          id?: string
          title: string
          type: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      bas_periods: {
        Row: {
          business_id: string
          g1: number
          lodged_at: string
          net_gst: number
          one_a: number
          one_b: number
          quarter_index: number
          year: number
        }
        Insert: {
          business_id: string
          g1?: number
          lodged_at?: string
          net_gst?: number
          one_a?: number
          one_b?: number
          quarter_index: number
          year: number
        }
        Update: {
          business_id?: string
          g1?: number
          lodged_at?: string
          net_gst?: number
          one_a?: number
          one_b?: number
          quarter_index?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "bas_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_email_connection: {
        Row: {
          access_token: string | null
          business_id: string
          check_interval_minutes: number
          connected_at: string | null
          connected_by: string | null
          google_email: string | null
          last_checked_at: string | null
          pending_state: string | null
          pending_state_expires_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          business_id: string
          check_interval_minutes?: number
          connected_at?: string | null
          connected_by?: string | null
          google_email?: string | null
          last_checked_at?: string | null
          pending_state?: string | null
          pending_state_expires_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          business_id?: string
          check_interval_minutes?: number
          connected_at?: string | null
          connected_by?: string | null
          google_email?: string | null
          last_checked_at?: string | null
          pending_state?: string | null
          pending_state_expires_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_email_connection_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_email_connection_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_email_connection_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      business_memberships: {
        Row: {
          annual_leave_opening_hours: number
          business_id: string
          created_at: string
          employment_start_date: string | null
          employment_type: string
          hourly_rate: number | null
          id: string
          person_id: string
          role: string
          sick_leave_opening_hours: number
          trade_role: string
          weekly_hours: number
        }
        Insert: {
          annual_leave_opening_hours?: number
          business_id: string
          created_at?: string
          employment_start_date?: string | null
          employment_type?: string
          hourly_rate?: number | null
          id?: string
          person_id: string
          role: string
          sick_leave_opening_hours?: number
          trade_role?: string
          weekly_hours?: number
        }
        Update: {
          annual_leave_opening_hours?: number
          business_id?: string
          created_at?: string
          employment_start_date?: string | null
          employment_type?: string
          hourly_rate?: number | null
          id?: string
          person_id?: string
          role?: string
          sick_leave_opening_hours?: number
          trade_role?: string
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profile: {
        Row: {
          abn: string
          bank_account_name: string
          bank_account_number: string
          bank_bsb: string
          business_id: string
          business_name: string
          default_quote_exclusions: string
          default_quote_terms: string
          is_gst_registered: boolean
          licence_number: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          abn?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_bsb?: string
          business_id: string
          business_name?: string
          default_quote_exclusions?: string
          default_quote_terms?: string
          is_gst_registered?: boolean
          licence_number?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          abn?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_bsb?: string
          business_id?: string
          business_name?: string
          default_quote_exclusions?: string
          default_quote_terms?: string
          is_gst_registered?: boolean
          licence_number?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profile_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          abn: string
          bank_account_name: string
          bank_account_number: string
          bank_bsb: string
          business_id: string | null
          business_name: string
          default_quote_exclusions: string
          default_quote_terms: string
          id: boolean
          is_gst_registered: boolean
          licence_number: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          abn?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_bsb?: string
          business_id?: string | null
          business_name?: string
          default_quote_exclusions?: string
          default_quote_terms?: string
          id?: boolean
          is_gst_registered?: boolean
          licence_number?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          abn?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_bsb?: string
          business_id?: string | null
          business_name?: string
          default_quote_exclusions?: string
          default_quote_terms?: string
          id?: boolean
          is_gst_registered?: boolean
          licence_number?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          business_id: string | null
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
          business_id?: string | null
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
          business_id?: string | null
          contact?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_alerts: {
        Row: {
          ai_reason: string
          business_id: string | null
          category: string | null
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
          business_id?: string | null
          category?: string | null
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
          business_id?: string | null
          category?: string | null
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
        Relationships: [
          {
            foreignKeyName: "email_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_connections: {
        Row: {
          access_token: string | null
          business_id: string | null
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
          business_id?: string | null
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
          business_id?: string | null
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
            foreignKeyName: "email_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      email_invoice_candidates: {
        Row: {
          amount: number | null
          business_id: string | null
          category: string | null
          created_at: string
          created_expense_id: string | null
          date: string | null
          description: string
          from_address: string
          gst_type: string
          id: string
          job_id: string | null
          matched_po_number: string | null
          message_id: string
          receipt_storage_path: string | null
          received_at: string
          status: string
          subject: string
          supplier: string | null
          thread_id: string | null
        }
        Insert: {
          amount?: number | null
          business_id?: string | null
          category?: string | null
          created_at?: string
          created_expense_id?: string | null
          date?: string | null
          description?: string
          from_address?: string
          gst_type?: string
          id?: string
          job_id?: string | null
          matched_po_number?: string | null
          message_id: string
          receipt_storage_path?: string | null
          received_at: string
          status?: string
          subject?: string
          supplier?: string | null
          thread_id?: string | null
        }
        Update: {
          amount?: number | null
          business_id?: string | null
          category?: string | null
          created_at?: string
          created_expense_id?: string | null
          date?: string | null
          description?: string
          from_address?: string
          gst_type?: string
          id?: string
          job_id?: string | null
          matched_po_number?: string | null
          message_id?: string
          receipt_storage_path?: string | null
          received_at?: string
          status?: string
          subject?: string
          supplier?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_invoice_candidates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_invoice_candidates_created_expense_id_fkey"
            columns: ["created_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_invoice_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_invoice_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processed_messages: {
        Row: {
          business_id: string
          message_id: string
          processed_at: string
        }
        Insert: {
          business_id: string
          message_id: string
          processed_at?: string
        }
        Update: {
          business_id?: string
          message_id?: string
          processed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_processed_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          gst_type: string
          id: string
          includes_gst: boolean
          job_id: string | null
          receipt_storage_path: string | null
          supplier: string | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          category: string
          created_at?: string
          date: string
          description: string
          gst_type?: string
          id?: string
          includes_gst?: boolean
          job_id?: string | null
          receipt_storage_path?: string | null
          supplier?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          gst_type?: string
          id?: string
          includes_gst?: boolean
          job_id?: string | null
          receipt_storage_path?: string | null
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          business_id: string | null
          created_at: string
          customer_id: string
          date: string
          due_date: string
          first_viewed_at: string | null
          gst_type: string
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
          business_id?: string | null
          created_at?: string
          customer_id: string
          date: string
          due_date: string
          first_viewed_at?: string | null
          gst_type?: string
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
          business_id?: string | null
          created_at?: string
          customer_id?: string
          date?: string
          due_date?: string
          first_viewed_at?: string | null
          gst_type?: string
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
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          edit_note: string | null
          edited_at: string | null
          employee_id: string
          entered_manually: boolean
          id: string
          job_id: string
          note: string | null
        }
        Insert: {
          check_in: string
          check_out?: string | null
          edit_note?: string | null
          edited_at?: string | null
          employee_id: string
          entered_manually?: boolean
          id?: string
          job_id: string
          note?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string | null
          edit_note?: string | null
          edited_at?: string | null
          employee_id?: string
          entered_manually?: boolean
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
          logged_by_employee_id: string | null
          logged_by_employee_name: string | null
          needs_pricing: boolean
          po_number: string | null
          product_id: string | null
          quantity: number | null
          receipt_storage_path: string | null
          signature_data_url: string | null
          supplier: string | null
          unit: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          job_id: string
          logged_by_employee_id?: string | null
          logged_by_employee_name?: string | null
          needs_pricing?: boolean
          po_number?: string | null
          product_id?: string | null
          quantity?: number | null
          receipt_storage_path?: string | null
          signature_data_url?: string | null
          supplier?: string | null
          unit?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          job_id?: string
          logged_by_employee_id?: string | null
          logged_by_employee_name?: string | null
          needs_pricing?: boolean
          po_number?: string | null
          product_id?: string | null
          quantity?: number | null
          receipt_storage_path?: string | null
          signature_data_url?: string | null
          supplier?: string | null
          unit?: string | null
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
          {
            foreignKeyName: "job_costs_logged_by_employee_id_fkey"
            columns: ["logged_by_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_costs_logged_by_employee_id_fkey"
            columns: ["logged_by_employee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_field_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documents: {
        Row: {
          business_id: string
          created_at: string
          id: string
          job_id: string
          name: string
          source: string
          storage_path: string
          uploaded_by: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          job_id: string
          name: string
          source?: string
          storage_path: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          source?: string
          storage_path?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
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
          business_id: string | null
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
          sort_order: number
          status: string
          title: string
          value: number
        }
        Insert: {
          address?: string | null
          business_id?: string | null
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
          sort_order?: number
          status?: string
          title: string
          value?: number
        }
        Update: {
          address?: string | null
          business_id?: string | null
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
          sort_order?: number
          status?: string
          title?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          business_id: string
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
          business_id: string
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
          business_id?: string
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
            foreignKeyName: "leave_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          business_id: string | null
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
          business_id?: string | null
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
          business_id?: string | null
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
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      on_call_roster: {
        Row: {
          business_id: string
          created_at: string
          employee_id: string | null
          id: string
          week_start: string
        }
        Insert: {
          business_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          week_start: string
        }
        Update: {
          business_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_call_roster_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_call_roster_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_call_roster_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
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
          business_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          name: string
          unit: string
          unit_price: number
        }
        Insert: {
          business_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          unit?: string
          unit_price?: number
        }
        Update: {
          business_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          annual_leave_opening_hours: number
          business_id: string | null
          created_at: string
          email: string
          employment_start_date: string | null
          employment_type: string
          full_name: string
          hourly_rate: number | null
          id: string
          role: string
          sick_leave_opening_hours: number
          trade_role: string
          weekly_hours: number
        }
        Insert: {
          annual_leave_opening_hours?: number
          business_id?: string | null
          created_at?: string
          email: string
          employment_start_date?: string | null
          employment_type?: string
          full_name: string
          hourly_rate?: number | null
          id: string
          role: string
          sick_leave_opening_hours?: number
          trade_role?: string
          weekly_hours?: number
        }
        Update: {
          annual_leave_opening_hours?: number
          business_id?: string | null
          created_at?: string
          email?: string
          employment_start_date?: string | null
          employment_type?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          role?: string
          sick_leave_opening_hours?: number
          trade_role?: string
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount: number | null
          business_id: string | null
          created_at: string
          description: string
          id: string
          job_id: string
          number: string
          received_expense_id: string | null
          status: string
          supplier: string
        }
        Insert: {
          amount?: number | null
          business_id?: string | null
          created_at?: string
          description?: string
          id?: string
          job_id: string
          number: string
          received_expense_id?: string | null
          status?: string
          supplier?: string
        }
        Update: {
          amount?: number | null
          business_id?: string | null
          created_at?: string
          description?: string
          id?: string
          job_id?: string
          number?: string
          received_expense_id?: string | null
          status?: string
          supplier?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_received_expense_id_fkey"
            columns: ["received_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
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
          business_id: string | null
          created_at: string
          customer_id: string
          date: string
          exclusions: string
          first_viewed_at: string | null
          gst_type: string
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
          business_id?: string | null
          created_at?: string
          customer_id: string
          date: string
          exclusions?: string
          first_viewed_at?: string | null
          gst_type?: string
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
          business_id?: string | null
          created_at?: string
          customer_id?: string
          date?: string
          exclusions?: string
          first_viewed_at?: string | null
          gst_type?: string
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
            foreignKeyName: "quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      setout_handoffs: {
        Row: {
          business_id: string
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          job_id: string
          user_id: string
          uses: number
        }
        Insert: {
          business_id: string
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          job_id: string
          user_id: string
          uses?: number
        }
        Update: {
          business_id?: string
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string
          user_id?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "setout_handoffs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setout_handoffs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setout_handoffs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_field_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setout_handoffs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setout_handoffs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_attempts: {
        Row: {
          attempted_at: string
          ip_hash: string
        }
        Insert: {
          attempted_at?: string
          ip_hash: string
        }
        Update: {
          attempted_at?: string
          ip_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      customers_field_view: {
        Row: {
          address: string | null
          business_id: string | null
          contact: string | null
          id: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          contact?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string | null
          contact?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      job_line_items_field_view: {
        Row: {
          description: string | null
          id: string | null
          job_id: string | null
          qty: number | null
          sort_order: number | null
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
          business_id: string | null
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
          business_id?: string | null
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
          business_id?: string | null
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
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      products_field_view: {
        Row: {
          business_id: string | null
          category: string | null
          description: string | null
          id: string | null
          name: string | null
          unit: string | null
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          unit?: string | null
        }
        Update: {
          business_id?: string | null
          category?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      current_business_id: { Args: never; Returns: string }
      employee_add_job_cost: {
        Args: {
          p_amount: number
          p_category: string
          p_description: string
          p_job_id: string
          p_receipt_storage_path: string
          p_signature_data_url: string
          p_supplier: string
        }
        Returns: undefined
      }
      employee_add_job_materials: {
        Args: { p_items: Json; p_job_id: string }
        Returns: number
      }
      employee_finish_job: {
        Args: { p_blocked?: boolean; p_job_id: string; p_note?: string }
        Returns: {
          check_in: string
          check_out: string | null
          edit_note: string | null
          edited_at: string | null
          employee_id: string
          entered_manually: boolean
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
      employee_job_materials: {
        Args: { p_job_id: string }
        Returns: {
          created_at: string
          description: string
          id: string
          logged_by_employee_id: string
          logged_by_employee_name: string
          needs_pricing: boolean
          quantity: number
          unit: string
        }[]
      }
      employee_join_job: { Args: { p_job_id: string }; Returns: undefined }
      employee_leave_job: { Args: { p_job_id: string }; Returns: undefined }
      employee_remove_job_material: {
        Args: { p_cost_id: string }
        Returns: undefined
      }
      employee_set_job_time: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_checkin_id?: string
          p_job_id: string
          p_note: string
        }
        Returns: {
          check_in: string
          check_out: string | null
          edit_note: string | null
          edited_at: string | null
          employee_id: string
          entered_manually: boolean
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
      employee_start_job: {
        Args: { p_job_id: string }
        Returns: {
          check_in: string
          check_out: string | null
          edit_note: string | null
          edited_at: string | null
          employee_id: string
          entered_manually: boolean
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
        Args: { p_business_id?: string }
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
          gst_type: string
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
          gst_type: string
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
      mark_invoice_viewed: { Args: { p_token: string }; Returns: undefined }
      mark_quote_viewed: { Args: { p_token: string }; Returns: undefined }
      next_invoice_number: { Args: never; Returns: string }
      next_job_number: { Args: never; Returns: string }
      next_po_number: { Args: never; Returns: string }
      next_quote_number: { Args: never; Returns: string }
      request_leave: {
        Args: {
          p_business_id?: string
          p_end_date: string
          p_hours: number
          p_note?: string
          p_start_date: string
          p_type: string
        }
        Returns: {
          business_id: string
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
          business_id: string
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
