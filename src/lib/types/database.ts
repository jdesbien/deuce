/**
 * Database types for the Supabase schema.
 *
 * Hand-maintained to match supabase/migrations. After schema changes you
 * can regenerate with:
 *   npx supabase gen types typescript --linked > src/lib/types/database.ts
 * (then re-add the convenience aliases at the bottom).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type GameDifficulty = "easy" | "medium" | "hard";
export type GameStatus = "draft" | "published";
export type SessionWinner = "player1" | "player2" | "tie" | "abandoned";
export type FeedbackStatus = "new" | "read" | "resolved";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_emoji: string;
          role: UserRole;
          couple_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_emoji?: string;
          role?: UserRole;
          couple_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_emoji?: string;
          role?: UserRole;
          couple_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          invite_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string;
          difficulty: GameDifficulty;
          avg_duration_minutes: number;
          deck_requirements: string;
          tags: string[];
          instructions: Json;
          scoring_template: Json;
          status: GameStatus;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary?: string;
          difficulty?: GameDifficulty;
          avg_duration_minutes?: number;
          deck_requirements?: string;
          tags?: string[];
          instructions?: Json;
          scoring_template?: Json;
          status?: GameStatus;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          summary?: string;
          difficulty?: GameDifficulty;
          avg_duration_minutes?: number;
          deck_requirements?: string;
          tags?: string[];
          instructions?: Json;
          scoring_template?: Json;
          status?: GameStatus;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          game_slug: string;
          couple_id: string | null;
          created_by: string | null;
          player1_name: string;
          player2_name: string;
          winner: SessionWinner | null;
          final_scores: Json;
          rounds: Json;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          game_slug: string;
          couple_id?: string | null;
          created_by?: string | null;
          player1_name?: string;
          player2_name?: string;
          winner?: SessionWinner | null;
          final_scores?: Json;
          rounds?: Json;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          game_slug?: string;
          couple_id?: string | null;
          created_by?: string | null;
          player1_name?: string;
          player2_name?: string;
          winner?: SessionWinner | null;
          final_scores?: Json;
          rounds?: Json;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          message: string;
          page_context: string | null;
          status: FeedbackStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          message: string;
          page_context?: string | null;
          status?: FeedbackStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          message?: string;
          page_context?: string | null;
          status?: FeedbackStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: boolean;
          ads_enabled: boolean;
          announcement_banner: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          ads_enabled?: boolean;
          announcement_banner?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          ads_enabled?: boolean;
          announcement_banner?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_couple: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["couples"]["Row"];
      };
      join_couple: {
        Args: { code: string };
        Returns: string;
      };
      leave_couple: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      is_admin: {
        Args: { uid?: string };
        Returns: boolean;
      };
      current_couple_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      user_role: UserRole;
      game_difficulty: GameDifficulty;
      game_status: GameStatus;
      session_winner: SessionWinner;
      feedback_status: FeedbackStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Couple = Database["public"]["Tables"]["couples"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameSession = Database["public"]["Tables"]["sessions"]["Row"];
export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
