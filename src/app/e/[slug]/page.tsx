import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/data/demo";
import { EntrepreneurPageClient } from "./client";

interface EntrepreneurRow {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  country: string | null;
  city: string | null;
  verification_level: number;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

// Génération des métadonnées dynamiques
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("entrepreneurs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) {
    return { title: "Profil non trouvé — AfriWiki" };
  }

  const entrepreneur = data as EntrepreneurRow;
  const fullName = `${entrepreneur.first_name} ${entrepreneur.last_name}`;

  return {
    title: `${fullName} — AfriWiki`,
    description:
      entrepreneur.bio?.slice(0, 160) || `Profil de ${fullName} sur AfriWiki, l'encyclopédie des entrepreneurs africains.`,
    openGraph: {
      title: `${fullName} — AfriWiki`,
      description: entrepreneur.headline || `Entrepreneur africain`,
      type: "profile",
    },
  };
}

export default async function EntrepreneurPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Récupérer l'entrepreneur depuis Supabase
  const { data, error } = await supabase
    .from("entrepreneurs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    notFound();
  }

  const entrepreneur = data as EntrepreneurRow;

  // Incrémenter le compteur de vues (fire and forget)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any)
    .from("entrepreneurs")
    .update({ views_count: entrepreneur.views_count + 1 })
    .eq("id", entrepreneur.id)
    .then(() => {});

  // Récupérer les données liées (parcours, entreprises, récompenses)
  const [parcoursResult, entreprisesResult, recompensesResult] = await Promise.all([
    supabase
      .from("parcours")
      .select("*")
      .eq("entrepreneur_id", entrepreneur.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("entreprises")
      .select("*")
      .eq("entrepreneur_id", entrepreneur.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("recompenses")
      .select("*")
      .eq("entrepreneur_id", entrepreneur.id)
      .order("year", { ascending: false }),
  ]);

  const country = COUNTRIES.find((c) => c.code === entrepreneur.country);
  const fullName = `${entrepreneur.first_name} ${entrepreneur.last_name}`;

  return (
    <EntrepreneurPageClient
      entrepreneur={entrepreneur}
      country={country}
      fullName={fullName}
      parcours={parcoursResult.data || []}
      entreprises={entreprisesResult.data || []}
      recompenses={recompensesResult.data || []}
    />
  );
}
