// ============================================
// AfriWiki Demo Data
// Données de démonstration pour le développement
// ============================================

import type { Entrepreneur, Sector, Country } from "@/types";

// ============================================
// Secteurs d'activité
// ============================================

export const SECTORS: Sector[] = [
  { id: "1", name: "Fintech & Mobile Money", slug: "fintech", icon: "💰", description: "Services financiers et paiement mobile" },
  { id: "2", name: "Agriculture & Agritech", slug: "agriculture", icon: "🌾", description: "Agriculture et technologies agricoles" },
  { id: "3", name: "Santé & Healthtech", slug: "sante", icon: "🏥", description: "Santé et technologies médicales" },
  { id: "4", name: "Éducation & Edtech", slug: "education", icon: "🎓", description: "Éducation et technologies éducatives" },
  { id: "5", name: "E-commerce & Retail", slug: "ecommerce", icon: "🛒", description: "Commerce en ligne et distribution" },
  { id: "6", name: "Énergie & Cleantech", slug: "energie", icon: "⚡", description: "Énergie renouvelable et technologies propres" },
  { id: "7", name: "Logistique & Transport", slug: "logistique", icon: "🚚", description: "Logistique et transport" },
  { id: "8", name: "Construction & Immobilier", slug: "immobilier", icon: "🏗️", description: "Construction et immobilier" },
  { id: "9", name: "Médias & Divertissement", slug: "medias", icon: "🎨", description: "Médias, culture et divertissement" },
  { id: "10", name: "Services aux entreprises", slug: "services", icon: "💼", description: "Services B2B et conseil" },
];

// ============================================
// Pays africains
// ============================================

export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", name_en: "Nigeria", flag_emoji: "🇳🇬", region: "west" },
  { code: "ZA", name: "Afrique du Sud", name_en: "South Africa", flag_emoji: "🇿🇦", region: "south" },
  { code: "KE", name: "Kenya", name_en: "Kenya", flag_emoji: "🇰🇪", region: "east" },
  { code: "EG", name: "Égypte", name_en: "Egypt", flag_emoji: "🇪🇬", region: "north" },
  { code: "MA", name: "Maroc", name_en: "Morocco", flag_emoji: "🇲🇦", region: "north" },
  { code: "GH", name: "Ghana", name_en: "Ghana", flag_emoji: "🇬🇭", region: "west" },
  { code: "SN", name: "Sénégal", name_en: "Senegal", flag_emoji: "🇸🇳", region: "west" },
  { code: "CI", name: "Côte d'Ivoire", name_en: "Ivory Coast", flag_emoji: "🇨🇮", region: "west" },
  { code: "TN", name: "Tunisie", name_en: "Tunisia", flag_emoji: "🇹🇳", region: "north" },
  { code: "RW", name: "Rwanda", name_en: "Rwanda", flag_emoji: "🇷🇼", region: "east" },
  { code: "ET", name: "Éthiopie", name_en: "Ethiopia", flag_emoji: "🇪🇹", region: "east" },
  { code: "TZ", name: "Tanzanie", name_en: "Tanzania", flag_emoji: "🇹🇿", region: "east" },
  { code: "UG", name: "Ouganda", name_en: "Uganda", flag_emoji: "🇺🇬", region: "east" },
  { code: "CM", name: "Cameroun", name_en: "Cameroon", flag_emoji: "🇨🇲", region: "central" },
  { code: "DZ", name: "Algérie", name_en: "Algeria", flag_emoji: "🇩🇿", region: "north" },
  { code: "AO", name: "Angola", name_en: "Angola", flag_emoji: "🇦🇴", region: "south" },
  { code: "BJ", name: "Bénin", name_en: "Benin", flag_emoji: "🇧🇯", region: "west" },
  { code: "ML", name: "Mali", name_en: "Mali", flag_emoji: "🇲🇱", region: "west" },
];

// Statistiques par pays (nombre d'entrepreneurs)
export const COUNTRY_STATS: Record<string, number> = {
  NG: 2340,
  ZA: 1892,
  KE: 1567,
  EG: 1234,
  MA: 987,
  GH: 876,
  SN: 654,
  CI: 543,
  TN: 432,
  RW: 398,
  ET: 356,
  TZ: 289,
};

// ============================================
// Entrepreneurs de démonstration
// ============================================

export const DEMO_ENTREPRENEURS: Entrepreneur[] = [
  {
    id: "1",
    user_id: "user-1",
    slug: "ngozi-okonjo-iweala",
    first_name: "Ngozi",
    last_name: "Okonjo-Iweala",
    photo_url: null,
    bio: `**Ngozi Okonjo-Iweala** (née le 13 juin 1954 à Ogwashi-Ukwu, État du Delta, Nigeria) est une économiste et diplomate nigériane de renommée internationale.

Elle est directrice générale de l'**Organisation mondiale du commerce** (OMC) depuis le 1er mars 2021, devenant ainsi la première femme et la première Africaine à occuper ce poste.

Avant l'OMC, elle a exercé deux mandats en tant que **ministre des Finances du Nigeria** (2003-2006 et 2011-2015), où elle a mené d'importantes réformes économiques et négocié l'annulation de 18 milliards de dollars de dette du Nigeria.

Elle a également passé 25 ans à la **Banque mondiale**, où elle a occupé le poste de directrice générale. Elle est diplômée de Harvard et du MIT.`,
    headline: "Directrice générale de l'OMC",
    country: "NG",
    city: "Genève",
    verification_level: 4,
    is_published: true,
    is_featured: true,
    views_count: 45230,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-12-01T14:30:00Z",
  },
  {
    id: "2",
    user_id: "user-2",
    slug: "aliko-dangote",
    first_name: "Aliko",
    last_name: "Dangote",
    photo_url: null,
    bio: `**Aliko Dangote** (né le 10 avril 1957 à Kano, Nigeria) est un homme d'affaires nigérian, fondateur et président du **Dangote Group**, le plus grand conglomérat industriel d'Afrique de l'Ouest.

Avec une fortune estimée à plus de 13 milliards de dollars, il est régulièrement classé comme l'homme le plus riche d'Afrique par Forbes.

Le Dangote Group opère dans plusieurs secteurs : ciment, sucre, sel, farine, et plus récemment le raffinage de pétrole avec la **Dangote Refinery**, la plus grande raffinerie d'Afrique.`,
    headline: "Fondateur & Président, Dangote Group",
    country: "NG",
    city: "Lagos",
    verification_level: 4,
    is_published: true,
    is_featured: false,
    views_count: 38540,
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-11-15T09:00:00Z",
  },
  {
    id: "3",
    user_id: "user-3",
    slug: "amadou-diallo",
    first_name: "Amadou",
    last_name: "Diallo",
    photo_url: null,
    bio: `**Amadou Diallo** est un entrepreneur sénégalais, fondateur de **PaySahel**, une plateforme fintech spécialisée dans les paiements mobiles transfrontaliers en Afrique de l'Ouest.

Diplômé de l'École Polytechnique de Dakar et de Stanford, il a lancé PaySahel en 2019 pour faciliter les transferts d'argent entre les pays de la zone UEMOA.

La startup a levé 5 millions de dollars en Série A et traite plus de 100 000 transactions par mois.`,
    headline: "Fondateur & CEO, PaySahel",
    country: "SN",
    city: "Dakar",
    verification_level: 2,
    is_published: true,
    is_featured: false,
    views_count: 1250,
    created_at: "2024-06-15T14:00:00Z",
    updated_at: "2024-12-20T10:00:00Z",
  },
  {
    id: "4",
    user_id: "user-4",
    slug: "fatima-el-amin",
    first_name: "Fatima",
    last_name: "El-Amin",
    photo_url: null,
    bio: `**Fatima El-Amin** est une entrepreneuse marocaine, fondatrice et CEO de **MedTech Morocco**, une startup spécialisée dans les dispositifs médicaux innovants.

Ingénieure biomédicale de formation, elle a développé un appareil de diagnostic portable pour les zones rurales qui a été déployé dans plus de 200 centres de santé au Maroc.`,
    headline: "CEO, MedTech Morocco",
    country: "MA",
    city: "Casablanca",
    verification_level: 3,
    is_published: true,
    is_featured: false,
    views_count: 2340,
    created_at: "2024-08-20T09:00:00Z",
    updated_at: "2024-12-18T16:00:00Z",
  },
  {
    id: "5",
    user_id: "user-5",
    slug: "kwame-asante",
    first_name: "Kwame",
    last_name: "Asante",
    photo_url: null,
    bio: `**Kwame Asante** est un entrepreneur ghanéen, co-fondateur d'**AgriGhana**, une plateforme agritech qui connecte les petits agriculteurs aux marchés urbains.

Grâce à son application mobile, plus de 10 000 agriculteurs ont pu augmenter leurs revenus de 40% en moyenne.`,
    headline: "Co-fondateur, AgriGhana",
    country: "GH",
    city: "Accra",
    verification_level: 2,
    is_published: true,
    is_featured: false,
    views_count: 890,
    created_at: "2024-09-10T11:00:00Z",
    updated_at: "2024-12-15T08:00:00Z",
  },
];

// ============================================
// Statistiques globales
// ============================================

export const GLOBAL_STATS = {
  total_entrepreneurs: 12847,
  total_countries: 54,
  verified_percentage: 98,
  total_views: 1250000,
};
