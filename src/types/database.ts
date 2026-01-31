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
      entrepreneurs: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          first_name: string;
          last_name: string;
          photo_url: string | null;
          bio: string | null;
          headline: string | null;
          country: string;
          city: string | null;
          verification_level: number;
          is_published: boolean;
          is_featured: boolean;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          first_name: string;
          last_name: string;
          photo_url?: string | null;
          bio?: string | null;
          headline?: string | null;
          country: string;
          city?: string | null;
          verification_level?: number;
          is_published?: boolean;
          is_featured?: boolean;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          first_name?: string;
          last_name?: string;
          photo_url?: string | null;
          bio?: string | null;
          headline?: string | null;
          country?: string;
          city?: string | null;
          verification_level?: number;
          is_published?: boolean;
          is_featured?: boolean;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          website: string | null;
          founded_year: number | null;
          country: string | null;
          sector_id: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          website?: string | null;
          founded_year?: number | null;
          country?: string | null;
          sector_id?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          website?: string | null;
          founded_year?: number | null;
          country?: string | null;
          sector_id?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      entrepreneur_companies: {
        Row: {
          id: string;
          entrepreneur_id: string;
          company_id: string;
          role: string;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          company_id: string;
          role: string;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          company_id?: string;
          role?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
        };
      };
      sectors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
        };
      };
      countries: {
        Row: {
          code: string;
          name: string;
          flag_emoji: string;
          continent: string | null;
        };
        Insert: {
          code: string;
          name: string;
          flag_emoji: string;
          continent?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          flag_emoji?: string;
          continent?: string | null;
        };
      };
      verifications: {
        Row: {
          id: string;
          entrepreneur_id: string;
          level: number;
          document_type: string | null;
          document_url: string | null;
          verified_at: string | null;
          verified_by: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          level: number;
          document_type?: string | null;
          document_url?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          level?: number;
          document_type?: string | null;
          document_url?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      social_links: {
        Row: {
          id: string;
          entrepreneur_id: string;
          platform: string;
          url: string;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          platform: string;
          url: string;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          platform?: string;
          url?: string;
        };
      };
      education: {
        Row: {
          id: string;
          entrepreneur_id: string;
          institution: string;
          degree: string | null;
          field: string | null;
          start_year: number | null;
          end_year: number | null;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          institution: string;
          degree?: string | null;
          field?: string | null;
          start_year?: number | null;
          end_year?: number | null;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          institution?: string;
          degree?: string | null;
          field?: string | null;
          start_year?: number | null;
          end_year?: number | null;
        };
      };
      awards: {
        Row: {
          id: string;
          entrepreneur_id: string;
          title: string;
          organization: string | null;
          year: number | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          title: string;
          organization?: string | null;
          year?: number | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          title?: string;
          organization?: string | null;
          year?: number | null;
          description?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          content: string | null;
          category: string;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          content?: string | null;
          category?: string;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          category?: string;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sources: {
        Row: {
          id: string;
          entrepreneur_id: string;
          type: string;
          title: string;
          url: string;
          status: string;
          submitted_at: string;
          validated_at: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          type: string;
          title: string;
          url: string;
          status?: string;
          submitted_at?: string;
          validated_at?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          type?: string;
          title?: string;
          url?: string;
          status?: string;
          submitted_at?: string;
          validated_at?: string | null;
          rejection_reason?: string | null;
        };
      };
      parcours: {
        Row: {
          id: string;
          entrepreneur_id: string;
          title: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          title: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          title?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          order_index?: number;
          created_at?: string;
        };
      };
      entreprises: {
        Row: {
          id: string;
          entrepreneur_id: string;
          name: string;
          role: string | null;
          description: string | null;
          website: string | null;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          name: string;
          role?: string | null;
          description?: string | null;
          website?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          name?: string;
          role?: string | null;
          description?: string | null;
          website?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          order_index?: number;
          created_at?: string;
        };
      };
      recompenses: {
        Row: {
          id: string;
          entrepreneur_id: string;
          title: string;
          organization: string | null;
          year: number | null;
          description: string | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entrepreneur_id: string;
          title: string;
          organization?: string | null;
          year?: number | null;
          description?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entrepreneur_id?: string;
          title?: string;
          organization?: string | null;
          year?: number | null;
          description?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific types for convenience
export type Entrepreneur = Tables<"entrepreneurs">;
export type Company = Tables<"companies">;
export type Sector = Tables<"sectors">;
export type Country = Tables<"countries">;
export type Verification = Tables<"verifications">;
export type Profile = Tables<"profiles">;
