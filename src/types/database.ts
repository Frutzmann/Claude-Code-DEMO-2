/**
 * TypeScript types for Supabase database tables
 * Generated from migration files: 001_profiles.sql, 003_portraits.sql, 004_generations.sql, 006_billing.sql
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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      portraits: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          public_url: string
          label: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          public_url: string
          label?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          storage_path?: string
          public_url?: string
          label?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          portrait_id: string | null
          portrait_url: string
          keywords: string
          background_count: number
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
          progress: number
          current_step: string | null
          thumbnail_count: number
          error_message: string | null
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
          credits_used: number
        }
        Insert: {
          id?: string
          user_id: string
          portrait_id?: string | null
          portrait_url: string
          keywords: string
          background_count: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
          progress?: number
          current_step?: string | null
          thumbnail_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
          credits_used?: number
        }
        Update: {
          id?: string
          user_id?: string
          portrait_id?: string | null
          portrait_url?: string
          keywords?: string
          background_count?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
          progress?: number
          current_step?: string | null
          thumbnail_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
          credits_used?: number
        }
      }
      thumbnails: {
        Row: {
          id: string
          generation_id: string
          storage_path: string
          public_url: string
          prompt: string | null
          prompt_index: number | null
          background_index: number | null
          kie_task_id: string | null
          status: 'success' | 'failed'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          generation_id: string
          storage_path: string
          public_url: string
          prompt?: string | null
          prompt_index?: number | null
          background_index?: number | null
          kie_task_id?: string | null
          status?: 'success' | 'failed'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          generation_id?: string
          storage_path?: string
          public_url?: string
          prompt?: string | null
          prompt_index?: number | null
          background_index?: number | null
          kie_task_id?: string | null
          status?: 'success' | 'failed'
          error_message?: string | null
          created_at?: string
        }
      }
      // Billing tables (006_billing.sql)
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          active: boolean
          name: string | null
          description: string | null
          image: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          active?: boolean
          name?: string | null
          description?: string | null
          image?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          active?: boolean
          name?: string | null
          description?: string | null
          image?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string | null
          active: boolean
          description: string | null
          unit_amount: number | null
          currency: string
          type: PricingType
          interval: PricingPlanInterval
          interval_count: number
          trial_period_days: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          product_id?: string | null
          active?: boolean
          description?: string | null
          unit_amount?: number | null
          currency?: string
          type?: PricingType
          interval?: PricingPlanInterval
          interval_count?: number
          trial_period_days?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          active?: boolean
          description?: string | null
          unit_amount?: number | null
          currency?: string
          type?: PricingType
          interval?: PricingPlanInterval
          interval_count?: number
          trial_period_days?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: SubscriptionStatus
          metadata: Json
          price_id: string | null
          quantity: number
          cancel_at_period_end: boolean
          created: string | null
          current_period_start: string
          current_period_end: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
        Insert: {
          id: string
          user_id: string
          status: SubscriptionStatus
          metadata?: Json
          price_id?: string | null
          quantity?: number
          cancel_at_period_end?: boolean
          created?: string | null
          current_period_start: string
          current_period_end: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: SubscriptionStatus
          metadata?: Json
          price_id?: string | null
          quantity?: number
          cancel_at_period_end?: boolean
          created?: string | null
          current_period_start?: string
          current_period_end?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pricing_type: PricingType
      pricing_plan_interval: PricingPlanInterval
      subscription_status: SubscriptionStatus
    }
  }
}

// Billing enum types
export type PricingType = 'one_time' | 'recurring'
export type PricingPlanInterval = 'day' | 'week' | 'month' | 'year'
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused'

// Convenience type aliases for common usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Portrait = Database['public']['Tables']['portraits']['Row']
export type PortraitInsert = Database['public']['Tables']['portraits']['Insert']
export type PortraitUpdate = Database['public']['Tables']['portraits']['Update']

export type Generation = Database['public']['Tables']['generations']['Row']
export type GenerationInsert = Database['public']['Tables']['generations']['Insert']
export type GenerationUpdate = Database['public']['Tables']['generations']['Update']
export type GenerationStatus = Generation['status']

export type Thumbnail = Database['public']['Tables']['thumbnails']['Row']
export type ThumbnailInsert = Database['public']['Tables']['thumbnails']['Insert']
export type ThumbnailUpdate = Database['public']['Tables']['thumbnails']['Update']
export type ThumbnailStatus = Thumbnail['status']

// Billing type aliases
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Price = Database['public']['Tables']['prices']['Row']
export type PriceInsert = Database['public']['Tables']['prices']['Insert']
export type PriceUpdate = Database['public']['Tables']['prices']['Update']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']
