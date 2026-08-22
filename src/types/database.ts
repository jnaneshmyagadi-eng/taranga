export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          bio: string | null;
          website: string | null;
          location: string | null;
          is_verified: boolean;
          is_creator: boolean;
          is_admin: boolean;
          languages: string[];
          interests: string[];
          preferred_categories: string[];
          country_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          is_verified?: boolean;
          is_creator?: boolean;
          is_admin?: boolean;
          languages?: string[];
          interests?: string[];
          preferred_categories?: string[];
          country_code?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      videos: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          slug: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          category: string | null;
          tags: string[];
          language: string;
          visibility: "public" | "unlisted" | "private" | "scheduled";
          status: "uploading" | "processing" | "ready" | "failed" | "archived";
          is_short: boolean;
          view_count: number;
          like_count: number;
          comment_count: number;
          share_count: number;
          save_count: number;
          published_at: string | null;
          scheduled_at: string | null;
          community_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          slug?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          category?: string | null;
          tags?: string[];
          language?: string;
          visibility?: "public" | "unlisted" | "private" | "scheduled";
          status?: "uploading" | "processing" | "ready" | "failed" | "archived";
          is_short?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
      };
      // Additional tables follow the same pattern — full schema in supabase/schema.sql
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Video = Database["public"]["Tables"]["videos"]["Row"];
