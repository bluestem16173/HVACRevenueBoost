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
      systems: {
        Row: {
          id: string
          name: string
          slug: string
          category: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category?: string | null
          description?: string | null
          created_at?: string
        }
      }
      symptoms: {
        Row: {
          id: string
          system_id: string
          name: string
          slug: string
          search_intent: string | null
          priority_score: number
          created_at: string
        }
        Insert: {
          id?: string
          system_id: string
          name: string
          slug: string
          search_intent?: string | null
          priority_score?: number
          created_at?: string
        }
      }
      causes: {
        Row: {
          id: string
          system_id: string
          name: string
          slug: string
          difficulty: string | null
          confidence_score: number
          created_at: string
        }
        Insert: {
          id?: string
          system_id: string
          name: string
          slug: string
          difficulty?: string | null
          confidence_score?: number
          created_at?: string
        }
      }
      symptom_causes: {
        Row: {
          symptom_id: string
          cause_id: string
        }
        Insert: {
          symptom_id: string
          cause_id: string
        }
      }
      repairs: {
        Row: {
          id: string
          cause_id: string
          name: string
          slug: string
          repair_type: string | null
          skill_level: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cause_id: string
          name: string
          slug: string
          repair_type?: string | null
          skill_level?: string | null
          created_at?: string
        }
      }
      diagnostics: {
        Row: {
          id: string
          system_id: string
          symptom_id: string | null
          name: string
          slug: string
          description: string | null
          priority_score: number
          created_at: string
        }
        Insert: {
          id?: string
          system_id: string
          symptom_id?: string | null
          name: string
          slug: string
          description?: string | null
          priority_score?: number
          created_at?: string
        }
      }
      diagnostic_steps: {
        Row: {
          id: string
          diagnostic_id: string
          step_order: number
          question: string
          yes_target_slug: string | null
          no_target_slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          diagnostic_id: string
          step_order: number
          question: string
          yes_target_slug?: string | null
          no_target_slug?: string | null
          created_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          page_type: string
          slug: string
          title: string
          status: string
          content_json: Json | null
          content_html: string | null
          system_id: string | null
          symptom_id: string | null
          cause_id: string | null
          repair_id: string | null
          diagnostic_id: string | null
          city: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_type: string
          slug: string
          title: string
          status?: string
          content_json?: Json | null
          content_html?: string | null
          system_id?: string | null
          symptom_id?: string | null
          cause_id?: string | null
          repair_id?: string | null
          diagnostic_id?: string | null
          city?: string | null
          created_at?: string
        }
      }
      internal_links: {
        Row: {
          id: string
          source_slug: string
          target_slug: string
          anchor_text: string | null
          link_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source_slug: string
          target_slug: string
          anchor_text?: string | null
          link_reason?: string | null
          created_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          city: string
          state: string
          slug: string
          population: number | null
          created_at: string
        }
        Insert: {
          id?: string
          city: string
          state: string
          slug: string
          population?: number | null
          created_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          company_name: string
          trade: string | null
          city: string | null
          city_slug: string | null
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          trade?: string | null
          city?: string | null
          city_slug?: string | null
          state?: string | null
          created_at?: string
        }
      }
    }
  }
}
