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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          sender_profile_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          sender_profile_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "spark_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ghost_messages: {
        Row: {
          content: string
          created_at: string | null
          from_profile_id: string
          id: string
          read_at: string | null
          to_profile_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          from_profile_id: string
          id?: string
          read_at?: string | null
          to_profile_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          from_profile_id?: string
          id?: string
          read_at?: string | null
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ghost_messages_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ghost_messages_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          id: string
          is_present: boolean | null
          last_pulse: string | null
          profile_id: string
          visible_to_others: boolean | null
        }
        Insert: {
          id?: string
          is_present?: boolean | null
          last_pulse?: string | null
          profile_id: string
          visible_to_others?: boolean | null
        }
        Update: {
          id?: string
          is_present?: boolean | null
          last_pulse?: string | null
          profile_id?: string
          visible_to_others?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "presence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_tribes: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          tribe: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          tribe: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          tribe?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tribes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
          user_id: string
          vibe: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id: string
          vibe?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id?: string
          vibe?: string | null
        }
        Relationships: []
      }
      quedada_attendees: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          quedada_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          quedada_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          quedada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quedada_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quedada_attendees_quedada_id_fkey"
            columns: ["quedada_id"]
            isOneToOne: false
            referencedRelation: "quedadas"
            referencedColumns: ["id"]
          },
        ]
      }
      quedada_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          quedada_id: string
          sender_profile_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          quedada_id: string
          sender_profile_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          quedada_id?: string
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quedada_messages_quedada_id_fkey"
            columns: ["quedada_id"]
            isOneToOne: false
            referencedRelation: "quedadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quedada_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quedadas: {
        Row: {
          city: string
          created_at: string
          creator_profile_id: string
          description: string | null
          event_date: string
          id: string
          location_hint: string | null
          max_attendees: number | null
          title: string
        }
        Insert: {
          city: string
          created_at?: string
          creator_profile_id: string
          description?: string | null
          event_date: string
          id?: string
          location_hint?: string | null
          max_attendees?: number | null
          title: string
        }
        Update: {
          city?: string
          created_at?: string
          creator_profile_id?: string
          description?: string | null
          event_date?: string
          id?: string
          location_hint?: string | null
          max_attendees?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quedadas_creator_profile_id_fkey"
            columns: ["creator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_chats: {
        Row: {
          created_at: string | null
          extinguished_by_a: boolean | null
          extinguished_by_b: boolean | null
          id: string
          profile_a_id: string
          profile_b_id: string
        }
        Insert: {
          created_at?: string | null
          extinguished_by_a?: boolean | null
          extinguished_by_b?: boolean | null
          id?: string
          profile_a_id: string
          profile_b_id: string
        }
        Update: {
          created_at?: string | null
          extinguished_by_a?: boolean | null
          extinguished_by_b?: boolean | null
          id?: string
          profile_a_id?: string
          profile_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_chats_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_chats_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sparks: {
        Row: {
          created_at: string | null
          from_profile_id: string
          id: string
          to_profile_id: string
        }
        Insert: {
          created_at?: string | null
          from_profile_id: string
          id?: string
          to_profile_id: string
        }
        Update: {
          created_at?: string | null
          from_profile_id?: string
          id?: string
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sparks_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sparks_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
