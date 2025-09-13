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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_sessions: {
        Row: {
          activity_type: string
          created_at: string | null
          difficulty_level: number | null
          id: string
          score: number
          session_data: Json | null
          time_spent: number
          total_questions: number
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          score: number
          session_data?: Json | null
          time_spent: number
          total_questions: number
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          score?: number
          session_data?: Json | null
          time_spent?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_challenge_cache: {
        Row: {
          challenge_type: string
          correct_answer: string
          created_at: string | null
          difficulty: number
          explanation: string | null
          id: string
          options: Json
          question: string
          success_rate: number | null
          usage_count: number | null
          word_id: string | null
        }
        Insert: {
          challenge_type: string
          correct_answer: string
          created_at?: string | null
          difficulty: number
          explanation?: string | null
          id?: string
          options: Json
          question: string
          success_rate?: number | null
          usage_count?: number | null
          word_id?: string | null
        }
        Update: {
          challenge_type?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: number
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          success_rate?: number | null
          usage_count?: number | null
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_challenge_cache_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "ai_word_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_word_cache: {
        Row: {
          antonyms: string[] | null
          category: string
          created_at: string | null
          definition: string | null
          difficulty: string
          example: string | null
          hint: string
          id: string
          last_used: string | null
          part_of_speech: string | null
          phonetics: string | null
          success_rate: number | null
          synonyms: string[] | null
          updated_at: string | null
          usage_count: number | null
          word: string
        }
        Insert: {
          antonyms?: string[] | null
          category: string
          created_at?: string | null
          definition?: string | null
          difficulty: string
          example?: string | null
          hint: string
          id?: string
          last_used?: string | null
          part_of_speech?: string | null
          phonetics?: string | null
          success_rate?: number | null
          synonyms?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          word: string
        }
        Update: {
          antonyms?: string[] | null
          category?: string
          created_at?: string | null
          definition?: string | null
          difficulty?: string
          example?: string | null
          hint?: string
          id?: string
          last_used?: string | null
          part_of_speech?: string | null
          phonetics?: string | null
          success_rate?: number | null
          synonyms?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          word?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_type: string | null
          requirement_value: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          id: string
          message_type: string
          metadata: Json | null
          session_id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          message_type: string
          metadata?: Json | null
          session_id: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          session_id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comprehension_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          options: Json | null
          passage_id: string
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          passage_id: string
          question_text: string
          question_type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          passage_id?: string
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprehension_questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "reading_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          grade_level: number | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          grade_level?: number | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          grade_level?: number | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reading_passages: {
        Row: {
          ai_generated: boolean | null
          content: string
          created_at: string | null
          created_by: string | null
          difficulty_level: number | null
          id: string
          title: string
          topic: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          id?: string
          title: string
          topic?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          id?: string
          title?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_passages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          accuracy: number
          avg_response_time: number
          correct_answers: number
          created_at: string | null
          current_difficulty: number
          hints_used: number
          id: string
          last_updated: string | null
          topic: string
          total_questions: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          avg_response_time?: number
          correct_answers?: number
          created_at?: string | null
          current_difficulty?: number
          hints_used?: number
          id?: string
          last_updated?: string | null
          topic: string
          total_questions?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          avg_response_time?: number
          correct_answers?: number
          created_at?: string | null
          current_difficulty?: number
          hints_used?: number
          id?: string
          last_updated?: string | null
          topic?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
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
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          activity_type: string
          best_streak: number | null
          correct_answers: number | null
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          last_activity: string | null
          total_attempts: number | null
          total_time_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          best_streak?: number | null
          correct_answers?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity?: string | null
          total_attempts?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          best_streak?: number | null
          correct_answers?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity?: string | null
          total_attempts?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          passage_id: string
          questions_answered: number | null
          questions_correct: number | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passage_id: string
          questions_answered?: number | null
          questions_correct?: number | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passage_id?: string
          questions_answered?: number | null
          questions_correct?: number | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "reading_passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      word_scramble_analytics: {
        Row: {
          challenge_attempted: boolean | null
          challenge_correct: boolean | null
          created_at: string | null
          difficulty_level: number | null
          game_mode: string | null
          hint_types: string[] | null
          hints_used: number | null
          id: string
          is_correct: boolean
          points_earned: number | null
          response_time_seconds: number | null
          session_id: string
          streak_at_time: number | null
          user_answer: string | null
          user_id: string | null
          word_id: string | null
          word_presented: string
        }
        Insert: {
          challenge_attempted?: boolean | null
          challenge_correct?: boolean | null
          created_at?: string | null
          difficulty_level?: number | null
          game_mode?: string | null
          hint_types?: string[] | null
          hints_used?: number | null
          id?: string
          is_correct: boolean
          points_earned?: number | null
          response_time_seconds?: number | null
          session_id: string
          streak_at_time?: number | null
          user_answer?: string | null
          user_id?: string | null
          word_id?: string | null
          word_presented: string
        }
        Update: {
          challenge_attempted?: boolean | null
          challenge_correct?: boolean | null
          created_at?: string | null
          difficulty_level?: number | null
          game_mode?: string | null
          hint_types?: string[] | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean
          points_earned?: number | null
          response_time_seconds?: number | null
          session_id?: string
          streak_at_time?: number | null
          user_answer?: string | null
          user_id?: string | null
          word_id?: string | null
          word_presented?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_scramble_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_scramble_analytics_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "ai_word_cache"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      word_scramble_performance: {
        Row: {
          accuracy_percentage: number | null
          avg_response_time: number | null
          best_streak: number | null
          correct_answers: number | null
          days_played: number | null
          total_hints_used: number | null
          total_points: number | null
          total_sessions: number | null
          total_words_attempted: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_scramble_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_word_scramble_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          accuracy_percentage: number
          best_streak: number
          display_name: string
          rank: number
          total_points: number
          total_words_attempted: number
          user_id: string
        }[]
      }
      update_student_progress_adaptive: {
        Args: {
          p_hints_used: number
          p_is_correct: boolean
          p_response_time: number
          p_topic: string
          p_user_id: string
        }
        Returns: number
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
