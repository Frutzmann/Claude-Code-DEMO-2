/**
 * TypeScript types for Supabase database tables
 * Generated from migration files: 001_profiles.sql, 003_portraits.sql, 004_generations.sql
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

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
