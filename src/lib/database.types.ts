/**
 * =====================================================
 * SUPABASE DATABASE TYPES
 * =====================================================
 * TypeScript types generated from your Supabase schema
 * These types ensure type safety when working with the database
 * 
 * To regenerate these types, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
 * =====================================================
 */

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
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'USER' | 'ADMIN'
          phone: string | null
          address: string | null
          avatar: string | null
          is_blocked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'USER' | 'ADMIN'
          phone?: string | null
          address?: string | null
          avatar?: string | null
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'USER' | 'ADMIN'
          phone?: string | null
          address?: string | null
          avatar?: string | null
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: 'FABRICS' | 'CLOTHES' | 'KITS' | 'THREADS' | 'ACCESSORIES'
          images: Json
          sizes: Json
          stock: number
          availability: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: 'FABRICS' | 'CLOTHES' | 'KITS' | 'THREADS' | 'ACCESSORIES'
          images?: Json
          sizes?: Json
          stock?: number
          availability?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: 'FABRICS' | 'CLOTHES' | 'KITS' | 'THREADS' | 'ACCESSORIES'
          images?: Json
          sizes?: Json
          stock?: number
          availability?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
          total_amount: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          size: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          size: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          size?: string
          price?: number
          created_at?: string
        }
      }
      custom_orders: {
        Row: {
          id: string
          client_name: string
          phone_number: string
          ponge_items: Json
          reference_materials: Json
          images: Json | null
          start_date: string | null
          finish_date: string
          down_payment: number
          advance_money: number
          payment_months: number
          total_amount: number
          status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
          payment_schedule: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_name: string
          phone_number: string
          ponge_items?: Json
          reference_materials?: Json
          images?: Json | null
          start_date?: string | null
          finish_date: string
          down_payment: number
          advance_money?: number
          payment_months: number
          total_amount: number
          status?: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
          payment_schedule?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          phone_number?: string
          ponge_items?: Json
          reference_materials?: Json
          images?: Json | null
          start_date?: string | null
          finish_date?: string
          down_payment?: number
          advance_money?: number
          payment_months?: number
          total_amount?: number
          status?: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
          payment_schedule?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_messages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          subject: string | null
          message: string
          product_id: string | null
          status: 'UNREAD' | 'READ' | 'RESPONDED'
          response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          subject?: string | null
          message: string
          product_id?: string | null
          status?: 'UNREAD' | 'READ' | 'RESPONDED'
          response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          subject?: string | null
          message?: string
          product_id?: string | null
          status?: 'UNREAD' | 'READ' | 'RESPONDED'
          response?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          reference: string
          client_id: string
          client_name: string
          date: string
          items: Json
          subtotal: number
          discount_type: 'PERCENTAGE' | 'AMOUNT' | null
          discount_value: number | null
          total: number
          amount_paid: number
          amount_due: number
          status: 'PAID' | 'PARTIAL' | 'UNPAID'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference: string
          client_id: string
          client_name: string
          date: string
          items?: Json
          subtotal: number
          discount_type?: 'PERCENTAGE' | 'AMOUNT' | null
          discount_value?: number | null
          total: number
          amount_paid?: number
          amount_due: number
          status: 'PAID' | 'PARTIAL' | 'UNPAID'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference?: string
          client_id?: string
          client_name?: string
          date?: string
          items?: Json
          subtotal?: number
          discount_type?: 'PERCENTAGE' | 'AMOUNT' | null
          discount_value?: number | null
          total?: number
          amount_paid?: number
          amount_due?: number
          status?: 'PAID' | 'PARTIAL' | 'UNPAID'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          method: 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'MOBILE'
          amount: number
          date: string
          reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          method: 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'MOBILE'
          amount: number
          date: string
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          method?: 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'MOBILE'
          amount?: number
          date?: string
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: 'USER' | 'ADMIN'
      }
      calculate_order_total: {
        Args: { p_order_id: string }
        Returns: number
      }
      generate_payment_schedule: {
        Args: {
          p_total_amount: number
          p_down_payment: number
          p_advance_money: number
          p_payment_months: number
          p_start_date: string
        }
        Returns: Json
      }
      calculate_invoice_amounts: {
        Args: {
          p_subtotal: number
          p_discount_type: 'PERCENTAGE' | 'AMOUNT' | null
          p_discount_value: number | null
        }
        Returns: { total: number; discount_amount: number }[]
      }
      search_products: {
        Args: { search_term: string }
        Returns: Database['public']['Tables']['products']['Row'][]
      }
      search_orders: {
        Args: { search_term: string; user_uuid?: string }
        Returns: Database['public']['Tables']['orders']['Row'][]
      }
      get_sales_stats: {
        Args: { p_start_date?: string; p_end_date?: string }
        Returns: {
          total_orders: number
          total_revenue: number
          average_order_value: number
          pending_orders: number
          completed_orders: number
        }[]
      }
      get_top_products: {
        Args: { p_limit?: number }
        Returns: {
          product_id: string
          product_name: string
          total_quantity: number
          total_revenue: number
        }[]
      }
      generate_invoice_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_valid_email: {
        Args: { p_email: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'USER' | 'ADMIN'
      product_category: 'FABRICS' | 'CLOTHES' | 'KITS' | 'THREADS' | 'ACCESSORIES'
      order_status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
      message_status: 'UNREAD' | 'READ' | 'RESPONDED'
      invoice_status: 'PAID' | 'PARTIAL' | 'UNPAID'
      payment_method: 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'MOBILE'
      discount_type: 'PERCENTAGE' | 'AMOUNT'
      installment_status: 'PAID' | 'PENDING' | 'OVERDUE'
    }
  }
}

