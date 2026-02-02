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
      ai_training_configs: {
        Row: {
          achievement_indicators: string[] | null
          achievement_weightage: number | null
          communication_indicators: string[] | null
          communication_weightage: number | null
          conflict_handling_importance: number | null
          created_at: string
          crm_tools: string[] | null
          cultural_fit_weightage: number | null
          customer_interaction_depth: string | null
          domain: string
          evaluation_notes: string | null
          experience_weightage: number | null
          id: string
          is_active: boolean | null
          min_experience_years: number | null
          negative_keywords: string[] | null
          positive_keywords: string[] | null
          preferred_backgrounds: string[] | null
          preferred_industries: string[] | null
          preferred_roles: string[] | null
          progression_weightage: number | null
          red_flags: string[] | null
          required_behavioral_traits: string[] | null
          required_skills: string[] | null
          skill_weightage: number | null
          ticketing_experience_required: boolean | null
          updated_at: string
        }
        Insert: {
          achievement_indicators?: string[] | null
          achievement_weightage?: number | null
          communication_indicators?: string[] | null
          communication_weightage?: number | null
          conflict_handling_importance?: number | null
          created_at?: string
          crm_tools?: string[] | null
          cultural_fit_weightage?: number | null
          customer_interaction_depth?: string | null
          domain: string
          evaluation_notes?: string | null
          experience_weightage?: number | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          negative_keywords?: string[] | null
          positive_keywords?: string[] | null
          preferred_backgrounds?: string[] | null
          preferred_industries?: string[] | null
          preferred_roles?: string[] | null
          progression_weightage?: number | null
          red_flags?: string[] | null
          required_behavioral_traits?: string[] | null
          required_skills?: string[] | null
          skill_weightage?: number | null
          ticketing_experience_required?: boolean | null
          updated_at?: string
        }
        Update: {
          achievement_indicators?: string[] | null
          achievement_weightage?: number | null
          communication_indicators?: string[] | null
          communication_weightage?: number | null
          conflict_handling_importance?: number | null
          created_at?: string
          crm_tools?: string[] | null
          cultural_fit_weightage?: number | null
          customer_interaction_depth?: string | null
          domain?: string
          evaluation_notes?: string | null
          experience_weightage?: number | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          negative_keywords?: string[] | null
          positive_keywords?: string[] | null
          preferred_backgrounds?: string[] | null
          preferred_industries?: string[] | null
          preferred_roles?: string[] | null
          progression_weightage?: number | null
          red_flags?: string[] | null
          required_behavioral_traits?: string[] | null
          required_skills?: string[] | null
          skill_weightage?: number | null
          ticketing_experience_required?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_training_settings: {
        Row: {
          apply_training_rules: boolean | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          apply_training_rules?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          apply_training_rules?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_progress: {
        Row: {
          ai_score: number | null
          behavioral_completed: boolean | null
          completed_at: string | null
          created_at: string | null
          feedback: string | null
          id: string
          red_flags_completed: boolean | null
          resume_id: string
          scorecard_completed: boolean | null
          user_id: string
          user_score: number | null
        }
        Insert: {
          ai_score?: number | null
          behavioral_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          red_flags_completed?: boolean | null
          resume_id: string
          scorecard_completed?: boolean | null
          user_id: string
          user_score?: number | null
        }
        Update: {
          ai_score?: number | null
          behavioral_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          red_flags_completed?: boolean | null
          resume_id?: string
          scorecard_completed?: boolean | null
          user_id?: string
          user_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_progress_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          hint: string | null
          id: string
          is_active: boolean
          question_text: string
          sort_order: number | null
          stage: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          hint?: string | null
          id?: string
          is_active?: boolean
          question_text: string
          sort_order?: number | null
          stage: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          hint?: string | null
          id?: string
          is_active?: boolean
          question_text?: string
          sort_order?: number | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_reports: {
        Row: {
          ai_scores: Json
          ai_total_score: number
          comparative_feedback: Json
          created_at: string
          id: string
          overall_feedback: string
          resume_id: string
          user_id: string
          user_scores: Json
          user_total_score: number
        }
        Insert: {
          ai_scores: Json
          ai_total_score: number
          comparative_feedback: Json
          created_at?: string
          id?: string
          overall_feedback: string
          resume_id: string
          user_id: string
          user_scores: Json
          user_total_score: number
        }
        Update: {
          ai_scores?: Json
          ai_total_score?: number
          comparative_feedback?: Json
          created_at?: string
          id?: string
          overall_feedback?: string
          resume_id?: string
          user_id?: string
          user_scores?: Json
          user_total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_reports_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      call_simulations: {
        Row: {
          answer: string | null
          created_at: string
          feedback: string | null
          id: string
          question: string
          resume_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          question: string
          resume_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          question?: string
          resume_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_simulations_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_content: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          metadata: Json | null
          section: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          metadata?: Json | null
          section: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          metadata?: Json | null
          section?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      landing_page_media: {
        Row: {
          alt_text: string | null
          created_at: string | null
          file_name: string
          file_url: string
          id: string
          media_type: string
          section: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          file_name: string
          file_url: string
          id?: string
          media_type: string
          section: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          media_type?: string
          section?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assessment_completed: boolean | null
          avatar_url: string | null
          calls_completed: number | null
          created_at: string
          designation: string | null
          email: string | null
          full_name: string | null
          has_completed_onboarding: boolean | null
          id: string
          last_pool_resume_index: number | null
          phone: string | null
          red_flags_found: number | null
          resumes_screened: number | null
          selected_domain: string | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          assessment_completed?: boolean | null
          avatar_url?: string | null
          calls_completed?: number | null
          created_at?: string
          designation?: string | null
          email?: string | null
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id: string
          last_pool_resume_index?: number | null
          phone?: string | null
          red_flags_found?: number | null
          resumes_screened?: number | null
          selected_domain?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          assessment_completed?: boolean | null
          avatar_url?: string | null
          calls_completed?: number | null
          created_at?: string
          designation?: string | null
          email?: string | null
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          last_pool_resume_index?: number | null
          phone?: string | null
          red_flags_found?: number | null
          resumes_screened?: number | null
          selected_domain?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      red_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_type: string
          id: string
          resume_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_type: string
          id?: string
          resume_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_type?: string
          id?: string
          resume_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_flags_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_scores: {
        Row: {
          achievements_score: number
          communication_score: number
          created_at: string
          cultural_fit_score: number
          experience_score: number
          id: string
          notes: string | null
          progression_score: number
          resume_id: string
          skills_score: number
          total_score: number
          user_id: string
        }
        Insert: {
          achievements_score: number
          communication_score: number
          created_at?: string
          cultural_fit_score: number
          experience_score: number
          id?: string
          notes?: string | null
          progression_score: number
          resume_id: string
          skills_score: number
          total_score: number
          user_id: string
        }
        Update: {
          achievements_score?: number
          communication_score?: number
          created_at?: string
          cultural_fit_score?: number
          experience_score?: number
          id?: string
          notes?: string | null
          progression_score?: number
          resume_id?: string
          skills_score?: number
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_scores_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          candidate_name: string
          department: string
          domain: string | null
          file_path: string
          file_url: string | null
          id: string
          is_pool_resume: boolean | null
          status: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          candidate_name: string
          department: string
          domain?: string | null
          file_path: string
          file_url?: string | null
          id?: string
          is_pool_resume?: boolean | null
          status?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          candidate_name?: string
          department?: string
          domain?: string | null
          file_path?: string
          file_url?: string | null
          id?: string
          is_pool_resume?: boolean | null
          status?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_profiles_admin: {
        Args: never
        Returns: {
          avatar_url: string
          calls_completed: number
          created_at: string
          designation: string
          email: string
          full_name: string
          id: string
          phone: string
          red_flags_found: number
          resumes_screened: number
          selected_domain: string
          total_points: number
        }[]
      }
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          total_points: number
        }[]
      }
      get_user_badges_for_leaderboard: {
        Args: never
        Returns: {
          badge_id: string
          earned_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
