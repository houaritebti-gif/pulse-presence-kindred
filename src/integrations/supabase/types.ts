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
      bio_blacklist: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_blacklist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          sender_profile_id: string
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          sender_profile_id: string
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          sender_profile_id?: string
          updated_at?: string | null
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
      cleanup_executions: {
        Row: {
          deleted_from_completed: number
          deleted_old_verifications: number
          deleted_orphaned: number
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          id: string
          success: boolean
          total_deleted: number
          triggered_by: string | null
        }
        Insert: {
          deleted_from_completed?: number
          deleted_old_verifications?: number
          deleted_orphaned?: number
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          success?: boolean
          total_deleted?: number
          triggered_by?: string | null
        }
        Update: {
          deleted_from_completed?: number
          deleted_old_verifications?: number
          deleted_orphaned?: number
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          success?: boolean
          total_deleted?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          created_at: string
          from_profile_id: string
          id: string
          message: string | null
          responded_at: string | null
          status: string
          to_profile_id: string
        }
        Insert: {
          created_at?: string
          from_profile_id: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          to_profile_id: string
        }
        Update: {
          created_at?: string
          from_profile_id?: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_to_profile_id_fkey"
            columns: ["to_profile_id"]
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
          is_premium_message: boolean | null
          is_second_chance: boolean | null
          is_super_spark: boolean | null
          read_at: string | null
          to_profile_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          from_profile_id: string
          id?: string
          is_premium_message?: boolean | null
          is_second_chance?: boolean | null
          is_super_spark?: boolean | null
          read_at?: string | null
          to_profile_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          from_profile_id?: string
          id?: string
          is_premium_message?: boolean | null
          is_second_chance?: boolean | null
          is_super_spark?: boolean | null
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
      identity_verifications: {
        Row: {
          ai_confidence: string | null
          ai_reason: string | null
          created_at: string
          id: string
          profile_id: string
          rejection_reason: string | null
          selfie_url: string
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          ai_confidence?: string | null
          ai_reason?: string | null
          created_at?: string
          id?: string
          profile_id: string
          rejection_reason?: string | null
          selfie_url: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          ai_confidence?: string | null
          ai_reason?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          selfie_url?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kiki_now_boosts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          profile_id: string
          started_at: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          profile_id: string
          started_at?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string
          started_at?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kiki_now_boosts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      muted_quedadas: {
        Row: {
          id: string
          muted_at: string
          profile_id: string
          quedada_id: string
        }
        Insert: {
          id?: string
          muted_at?: string
          profile_id: string
          quedada_id: string
        }
        Update: {
          id?: string
          muted_at?: string
          profile_id?: string
          quedada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muted_quedadas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "muted_quedadas_quedada_id_fkey"
            columns: ["quedada_id"]
            isOneToOne: false
            referencedRelation: "quedadas"
            referencedColumns: ["id"]
          },
        ]
      }
      muted_spark_chats: {
        Row: {
          chat_id: string
          id: string
          muted_at: string
          profile_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          muted_at?: string
          profile_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          muted_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muted_spark_chats_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "spark_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "muted_spark_chats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          link: string | null
          profile_id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          profile_id: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          profile_id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_presence_notifications: {
        Row: {
          created_at: string
          id: string
          new_user_city: string | null
          new_user_profile_id: string
          recipient_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_user_city?: string | null
          new_user_profile_id: string
          recipient_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_user_city?: string | null
          new_user_profile_id?: string
          recipient_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_presence_notifications_new_user_profile_id_fkey"
            columns: ["new_user_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_presence_notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
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
      presence_exhaustion: {
        Row: {
          created_at: string
          exhausted_at: string
          id: string
          notified_at: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string
          exhausted_at?: string
          id?: string
          notified_at?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string
          exhausted_at?: string
          id?: string
          notified_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_exhaustion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_gender_preferences: {
        Row: {
          created_at: string | null
          gender_preference: Database["public"]["Enums"]["gender_type"]
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          gender_preference: Database["public"]["Enums"]["gender_type"]
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          gender_preference?: Database["public"]["Enums"]["gender_type"]
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_gender_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          profile_id?: string
        }
        Relationships: []
      }
      profile_music_styles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          style: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          style: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          style?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_music_styles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          photo_url: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          photo_url: string
          profile_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          photo_url?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_spark_energy: {
        Row: {
          created_at: string
          current_energy: number
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          profile_id: string
          total_earned: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_energy?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          profile_id: string
          total_earned?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_energy?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          profile_id?: string
          total_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_spark_energy_profile_id_fkey"
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
          alternative_aesthetic: boolean | null
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          city: string | null
          colored_hair: boolean | null
          created_at: string | null
          email_verified: boolean | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          gothic_style: boolean | null
          has_piercings: boolean | null
          has_tattoos: boolean | null
          id: string
          identity_verified: boolean | null
          looking_for: string[] | null
          name: string | null
          notify_max_age: number | null
          notify_min_age: number | null
          notify_new_presence: boolean
          notify_same_city_only: boolean
          share_typing_status: boolean | null
          shaved_head: boolean | null
          updated_at: string | null
          user_id: string
          vibe: string | null
          vintage_style: boolean | null
        }
        Insert: {
          alternative_aesthetic?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          city?: string | null
          colored_hair?: boolean | null
          created_at?: string | null
          email_verified?: boolean | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gothic_style?: boolean | null
          has_piercings?: boolean | null
          has_tattoos?: boolean | null
          id?: string
          identity_verified?: boolean | null
          looking_for?: string[] | null
          name?: string | null
          notify_max_age?: number | null
          notify_min_age?: number | null
          notify_new_presence?: boolean
          notify_same_city_only?: boolean
          share_typing_status?: boolean | null
          shaved_head?: boolean | null
          updated_at?: string | null
          user_id: string
          vibe?: string | null
          vintage_style?: boolean | null
        }
        Update: {
          alternative_aesthetic?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          city?: string | null
          colored_hair?: boolean | null
          created_at?: string | null
          email_verified?: boolean | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gothic_style?: boolean | null
          has_piercings?: boolean | null
          has_tattoos?: boolean | null
          id?: string
          identity_verified?: boolean | null
          looking_for?: string[] | null
          name?: string | null
          notify_max_age?: number | null
          notify_min_age?: number | null
          notify_new_presence?: boolean
          notify_same_city_only?: boolean
          share_typing_status?: boolean | null
          shaved_head?: boolean | null
          updated_at?: string | null
          user_id?: string
          vibe?: string | null
          vintage_style?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      quedada_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quedada_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "quedada_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quedada_message_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      quedada_read_status: {
        Row: {
          id: string
          last_read_at: string
          profile_id: string
          quedada_id: string
        }
        Insert: {
          id?: string
          last_read_at?: string
          profile_id: string
          quedada_id: string
        }
        Update: {
          id?: string
          last_read_at?: string
          profile_id?: string
          quedada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quedada_read_status_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quedada_read_status_quedada_id_fkey"
            columns: ["quedada_id"]
            isOneToOne: false
            referencedRelation: "quedadas"
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
          private_attendees: boolean
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
          private_attendees?: boolean
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
          private_attendees?: boolean
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
      spark_purchased_items: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_key: string
          metadata: Json | null
          profile_id: string
          quantity: number
          used_quantity: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_key: string
          metadata?: Json | null
          profile_id: string
          quantity?: number
          used_quantity?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_key?: string
          metadata?: Json | null
          profile_id?: string
          quantity?: number
          used_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "spark_purchased_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_read_status: {
        Row: {
          chat_id: string
          id: string
          last_read_at: string
          profile_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          last_read_at?: string
          profile_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          last_read_at?: string
          profile_id?: string
        }
        Relationships: []
      }
      spark_transactions: {
        Row: {
          action: string
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          profile_id: string
          type: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          profile_id: string
          type: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_transactions_profile_id_fkey"
            columns: ["profile_id"]
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
      stripe_customer_data: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customer_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          metadata: Json | null
          profile_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_key: string
          id?: string
          metadata?: Json | null
          profile_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_key?: string
          id?: string
          metadata?: Json | null
          profile_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_profile_id: string
          blocker_profile_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_profile_id: string
          blocker_profile_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_profile_id?: string
          blocker_profile_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_profile_id_fkey"
            columns: ["blocked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_profile_id_fkey"
            columns: ["blocker_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_profile_id: string
          reporter_profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_profile_id: string
          reporter_profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_profile_id?: string
          reporter_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_profile_id_fkey"
            columns: ["reported_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          profile_id: string
          started_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_started_at: string | null
          trial_used: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          profile_id: string
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          profile_id?: string
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
      calculate_age: { Args: { birthdate: string }; Returns: number }
      can_view_profile: {
        Args: { target_profile_id: string; viewer_user_id: string }
        Returns: boolean
      }
      contains_blacklisted_words: {
        Args: { text_to_check: string }
        Returns: boolean
      }
      get_available_item_quantity: {
        Args: { p_item_key: string; p_profile_id: string }
        Returns: number
      }
      get_blacklisted_matches: {
        Args: { text_to_check: string }
        Returns: string[]
      }
      get_connection_status: {
        Args: { target_profile_id: string; viewer_user_id: string }
        Returns: string
      }
      get_spark_level: { Args: { p_total_earned: number }; Returns: number }
      get_today_earned_energy: {
        Args: { p_profile_id: string }
        Returns: number
      }
      get_user_subscription_tier: {
        Args: { p_profile_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_active_kiki_now_boost: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_purchased_item: {
        Args: { p_item_key: string; p_profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      gender_type:
        | "woman"
        | "man"
        | "non_binary"
        | "trans_woman"
        | "trans_man"
        | "genderqueer"
        | "genderfluid"
        | "agender"
        | "two_spirit"
        | "other"
        | "prefer_not_to_say"
      subscription_tier: "free" | "plus" | "premium"
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
      app_role: ["admin", "moderator", "user"],
      gender_type: [
        "woman",
        "man",
        "non_binary",
        "trans_woman",
        "trans_man",
        "genderqueer",
        "genderfluid",
        "agender",
        "two_spirit",
        "other",
        "prefer_not_to_say",
      ],
      subscription_tier: ["free", "plus", "premium"],
    },
  },
} as const
