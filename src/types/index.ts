// ============================================
// AfriWiki Type Definitions
// ============================================

/**
 * Verification levels for entrepreneurs
 */
export type VerificationLevel = 0 | 1 | 2 | 3 | 4;

export const VERIFICATION_LEVELS = {
  0: { name: "Nouveau", badge: null, color: "gray" },
  1: { name: "Basique", badge: "🔵", color: "blue" },
  2: { name: "Vérifié", badge: "✅", color: "green" },
  3: { name: "Pro", badge: "⭐", color: "gold" },
  4: { name: "Notable", badge: "👑", color: "purple" },
} as const;

/**
 * User from Supabase Auth
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Entrepreneur profile
 */
export interface Entrepreneur {
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
  verification_level: VerificationLevel;
  is_published: boolean;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  companies?: EntrepreneurCompany[];
  education?: Education[];
  awards?: Award[];
  social_links?: SocialLink[];
}

/**
 * Company
 */
export interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  founded_year: number | null;
  country: string | null;
  sector_id: string | null;
  created_at: string;
  // Relations
  sector?: Sector;
}

/**
 * Entrepreneur-Company relation
 */
export interface EntrepreneurCompany {
  entrepreneur_id: string;
  company_id: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  // Relations
  company?: Company;
}

/**
 * Sector / Industry
 */
export interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

/**
 * Country
 */
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  name_en: string;
  flag_emoji: string;
  region: "north" | "west" | "east" | "central" | "south";
}

/**
 * Education entry
 */
export interface Education {
  id: string;
  entrepreneur_id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  start_year: number | null;
  end_year: number | null;
}

/**
 * Award / Recognition
 */
export interface Award {
  id: string;
  entrepreneur_id: string;
  title: string;
  organization: string | null;
  year: number | null;
  description: string | null;
}

/**
 * Social media link
 */
export interface SocialLink {
  id: string;
  entrepreneur_id: string;
  platform: "linkedin" | "twitter" | "website" | "instagram" | "facebook" | "youtube" | "other";
  url: string;
}

/**
 * Page revision history
 */
export interface PageRevision {
  id: string;
  entrepreneur_id: string;
  content_json: Record<string, unknown>;
  created_by: string;
  created_at: string;
  comment: string | null;
}

/**
 * Report / Flag
 */
export interface Report {
  id: string;
  entrepreneur_id: string;
  reporter_id: string;
  reason: "spam" | "fake" | "inappropriate" | "copyright" | "other";
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

/**
 * Verification document
 */
export interface Verification {
  id: string;
  entrepreneur_id: string;
  level: VerificationLevel;
  document_type: "id_card" | "passport" | "business_registration" | "other";
  document_url: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  status: "pending" | "approved" | "rejected";
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// ============================================
// Form Types
// ============================================

export interface EntrepreneurFormData {
  first_name: string;
  last_name: string;
  headline?: string;
  bio?: string;
  country: string;
  city?: string;
  photo?: File;
}

export interface SearchFilters {
  query?: string;
  country?: string;
  sector?: string;
  verification_level?: VerificationLevel;
  sort_by?: "relevance" | "date" | "views";
  page?: number;
  per_page?: number;
}
