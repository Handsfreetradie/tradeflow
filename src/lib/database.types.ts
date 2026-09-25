export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          id: boolean
          business_name: string
          abn: string
          logo_url: string | null
          updated_at: string
          licence_number: string
          bank_account_name: string
          bank_bsb: string
          bank_account_number: string
          default_quote_terms: string
          default_quote_exclusions: string
        }
        Insert: {
          id?: boolean
          business_name?: string
          abn?: string
          logo_url?: string | null
          updated_at?: string
          licence_number?: string
          bank_account_name?: string
          bank_bsb?: string
          bank_account_number?: string
          default_quote_terms?: string
          default_quote_exclusions?: string
        }
        Update: {
          id?: boolean
          business_name?: string
          abn?: string
          logo_url?: string | null
          updated_at?: string
          licence_number?: string
          bank_account_name?: string
          bank_bsb?: string
          bank_account_number?: string
          default_quote_terms?: string
          default_quote_exclusions?: string
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
          id: string
          include_gst: boolean
          job_id: string | null
          notes: string
          number: string
          payment_terms: string
          status: string
          share_token: string
          first_viewed_at: string | null
          last_viewed_at: string | null
          view_count: number
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date: string
          due_date: string
          id?: string
          include_gst?: boolean
          job_id?: string | null
          notes?: string
          number: string
          payment_terms?: string
          status?: string
          share_token?: string
          first_viewed_at?: string | null
          last_viewed_at?: string | null
          view_count?: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          due_date?: string
          id?: string
          include_gst?: boolean
          job_id?: string | null
          notes?: string
          number?: string
          payment_terms?: string
          status?: string
          share_token?: string
          first_viewed_at?: string | null
          last_viewed_at?: string | null
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
            foreignKeyName: "job_assignees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
      job_photos: {
        Row: {
          id: string
          job_id: string
          storage_path: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          storage_path: string
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          storage_path?: string
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: []
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
      jobs: {
        Row: {
          address: string | null
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
          coc_status: string
          coc_number: string | null
          coc_issued_date: string | null
        }
        Insert: {
          address?: string | null
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
          coc_status?: string
          coc_number?: string | null
          coc_issued_date?: string | null
        }
        Update: {
          address?: string | null
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
          coc_status?: string
          coc_number?: string | null
          coc_issued_date?: string | null
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
      notifications: {
        Row: {
          id: string
          job_id: string | null
          invoice_id: string | null
          quote_id: string | null
          type: string
          message: string
          created_by: string | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          invoice_id?: string | null
          quote_id?: string | null
          type: string
          message: string
          created_by?: string | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          invoice_id?: string | null
          quote_id?: string | null
          type?: string
          message?: string
          created_by?: string | null
          created_at?: string
          read_at?: string | null
        }
        Relationships: []
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
          id: string
          name: string
          description: string
          category: string
          unit: string
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          category?: string
          unit?: string
          unit_price?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          unit?: string
          unit_price?: number
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          hourly_rate: number | null
          trade_role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          hourly_rate?: number | null
          trade_role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          hourly_rate?: number | null
          trade_role?: string
        }
        Relationships: []
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
          id: string
          include_gst: boolean
          job_id: string | null
          notes: string
          number: string
          status: string
          terms: string
          exclusions: string
          validity_days: number
          share_token: string
          first_viewed_at: string | null
          last_viewed_at: string | null
          view_count: number
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date: string
          id?: string
          include_gst?: boolean
          job_id?: string | null
          notes?: string
          number: string
          status?: string
          terms?: string
          exclusions?: string
          validity_days?: number
          share_token?: string
          first_viewed_at?: string | null
          last_viewed_at?: string | null
          view_count?: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          include_gst?: boolean
          job_id?: string | null
          notes?: string
          number?: string
          status?: string
          terms?: string
          exclusions?: string
          share_token?: string
          first_viewed_at?: string | null
          last_viewed_at?: string | null
          view_count?: number
          validity_days?: number
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
        Relationships: []
      }
    }
    Functions: {
      get_job_crew: {
        Args: { p_job_ids: string[] }
        Returns: {
          job_id: string
          employee_id: string
          full_name: string
          trade_role: string | null
          on_site: boolean
          check_in: string | null
        }[]
      }
      get_public_quote: {
        Args: { p_token: string }
        Returns: {
          id: string
          number: string
          date: string
          amount: number
          status: string
          include_gst: boolean
          validity_days: number
          terms: string
          exclusions: string
          notes: string
          customer_name: string
          customer_contact: string
          customer_address: string
          business_name: string
          business_abn: string
          business_licence_number: string
          business_logo_url: string | null
        }[]
      }
      get_public_quote_line_items: {
        Args: { p_token: string }
        Returns: { id: string; description: string; qty: number; unit_price: number }[]
      }
      mark_quote_viewed: {
        Args: { p_token: string }
        Returns: undefined
      }
      respond_to_public_quote: {
        Args: { p_token: string; p_accept: boolean }
        Returns: undefined
      }
      get_public_invoice: {
        Args: { p_token: string }
        Returns: {
          id: string
          number: string
          date: string
          due_date: string
          amount: number
          status: string
          include_gst: boolean
          notes: string
          payment_terms: string
          customer_name: string
          customer_contact: string
          customer_address: string
          business_name: string
          business_abn: string
          business_licence_number: string
          business_logo_url: string | null
          bank_account_name: string
          bank_bsb: string
          bank_account_number: string
          paid_amount: number
        }[]
      }
      get_public_invoice_line_items: {
        Args: { p_token: string }
        Returns: { id: string; description: string; qty: number; unit_price: number }[]
      }
      mark_invoice_viewed: {
        Args: { p_token: string }
        Returns: undefined
      }
      employee_finish_job: {
        Args: { p_job_id: string; p_note?: string; p_blocked?: boolean }
        Returns: {
          check_in: string
          check_out: string | null
          employee_id: string
          id: string
          job_id: string
          note: string | null
        }
      }
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
      }
      employee_update_job_status: {
        Args: { p_job_id: string; p_status: string }
        Returns: undefined
      }
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
      next_invoice_number: { Args: Record<PropertyKey, never>; Returns: string }
      next_job_number: { Args: Record<PropertyKey, never>; Returns: string }
      next_quote_number: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
