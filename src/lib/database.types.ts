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
      jobs: {
        Row: {
          address: string | null
          assigned_to: string | null
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
          assigned_to?: string | null
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
          assigned_to?: string | null
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
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_directory"
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
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
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
          validity_days: number
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
          validity_days?: number
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
          assigned_to: string | null
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
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_directory"
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
      team_directory: {
        Row: {
          full_name: string | null
          id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      employee_finish_job: {
        Args: { p_job_id: string; p_note?: string }
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
