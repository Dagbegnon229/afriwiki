import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { SECTORS } from "@/data/demo";

interface Entrepreneur {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: string | null;
  country: string | null;
  verification_level: number;
  views_count: number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const sector = SECTORS.find((s) => s.slug === slug);
  
  if (!sector) {
    return { title: "Secteur non trouvé - AfriWiki" };
  }
  
  return {
    title: `${sector.name} - Entrepreneurs Africains | AfriWiki`,
    description: `Découvrez les entrepreneurs africains dans le secteur ${sector.name}. Profils vérifiés et informations fiables.`,
  };
}

export default async function SecteurPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Trouver le secteur
  const sector = SECTORS.find((s) => s.slug === slug);
  if (!sector) {
    notFound();
  }

  // Récupérer les entrepreneurs du secteur
  // Note: Cela suppose qu'il y a un champ sector dans la table entrepreneurs
  // Sinon, on récupère tous les entrepreneurs publiés pour l'instant
  const { data: entrepreneurs } = await supabase
    .from("entrepreneurs")
    .select("id, slug, first_name, last_name, headline, photo_url, country, verification_level, views_count")
    .eq("is_published", true)
    .order("views_count", { ascending: false })
    .limit(50);

  const entrepreneursList = (entrepreneurs || []) as Entrepreneur[];

  // Mapping des pays
  const countryNames: Record<string, { name: string; flag: string }> = {
    ng: { name: "Nigeria", flag: "🇳🇬" },
    ke: { name: "Kenya", flag: "🇰🇪" },
    za: { name: "Afrique du Sud", flag: "🇿🇦" },
    gh: { name: "Ghana", flag: "🇬🇭" },
    sn: { name: "Sénégal", flag: "🇸🇳" },
    ci: { name: "Côte d'Ivoire", flag: "🇨🇮" },
    bj: { name: "Bénin", flag: "🇧🇯" },
    rw: { name: "Rwanda", flag: "🇷🇼" },
    tz: { name: "Tanzanie", flag: "🇹🇿" },
    eg: { name: "Égypte", flag: "🇪🇬" },
    ma: { name: "Maroc", flag: "🇲🇦" },
    tn: { name: "Tunisie", flag: "🇹🇳" },
  };

  return (
    <>
      <Header />

      {/* Navigation tabs */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">Accueil</Link>
          <span className="tab active">{sector.name}</span>
        </div>
        <div className="tabs-right">
          <Link href="/recherche">Rechercher</Link>
        </div>
      </nav>

      <div className="main-container">
        <main className="content-wrapper">
          {/* Breadcrumb */}
          <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            <Link href="/" style={{ color: "var(--link-color)" }}>Accueil</Link>
            {" > "}
            <Link href="#" style={{ color: "var(--link-color)" }}>Secteurs</Link>
            {" > "}
            <span>{sector.name}</span>
          </div>

          {/* Header */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem", 
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border-color)"
          }}>
            <span style={{ fontSize: "3rem" }}>{sector.icon}</span>
            <div>
              <h1 style={{ 
                fontSize: "1.75rem", 
                fontFamily: "'Libre Baskerville', Georgia, serif",
                margin: 0 
              }}>
                {sector.name}
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)" }}>
                Entrepreneurs africains dans le secteur {sector.name.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="notice-box" style={{ marginBottom: "1.5rem" }}>
            <strong>{entrepreneursList.length}</strong> entrepreneur(s) référencé(s) dans ce secteur.
            {" "}
            <Link href="/dashboard/creer">Ajouter votre profil →</Link>
          </div>

          {/* Liste des entrepreneurs */}
          {entrepreneursList.length > 0 ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {entrepreneursList.map((e) => {
                const country = e.country ? countryNames[e.country.toLowerCase()] : null;
                return (
                  <div
                    key={e.id}
                    className="content-box"
                    style={{ padding: "1rem 1.25rem" }}
                  >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      {/* Photo */}
                      <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#f3f4f6",
                        border: "2px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}>
                        {e.photo_url ? (
                          <img
                            src={e.photo_url}
                            alt={`${e.first_name} ${e.last_name}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          `${e.first_name.charAt(0)}${e.last_name.charAt(0)}`
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                          <Link href={`/e/${e.slug}`} style={{ color: "var(--link-color)" }}>
                            {e.first_name} {e.last_name}
                          </Link>
                          {e.verification_level >= 2 && (
                            <span style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.5rem",
                              backgroundColor: "#dcfce7",
                              color: "#166534",
                              borderRadius: "4px",
                            }}>
                              ✓ Vérifié
                            </span>
                          )}
                        </h3>
                        {e.headline && (
                          <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {e.headline}
                          </p>
                        )}
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {country && `${country.flag} ${country.name}`}
                          {country && e.views_count > 0 && " • "}
                          {e.views_count > 0 && `${e.views_count.toLocaleString("fr-FR")} vues`}
                        </p>
                      </div>

                      {/* Actions */}
                      <Link
                        href={`/e/${e.slug}`}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "var(--link-color)",
                          color: "white",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          borderRadius: "4px",
                        }}
                      >
                        Voir le profil
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="content-box" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</p>
              <h3>Aucun entrepreneur dans ce secteur</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Soyez le premier à créer votre page !
              </p>
              <Link
                href="/dashboard/creer"
                className="wiki-btn wiki-btn-primary"
                style={{ display: "inline-block", marginTop: "1rem" }}
              >
                Créer ma page →
              </Link>
            </div>
          )}

          {/* Autres secteurs */}
          <div className="content-box" style={{ marginTop: "2rem" }}>
            <div className="content-box-header">
              <h2>Autres secteurs</h2>
            </div>
            <div className="content-box-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {SECTORS.filter((s) => s.slug !== slug).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/secteur/${s.slug}`}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                      textDecoration: "none",
                      color: "var(--text-primary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {s.icon} {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>

        <Sidebar />
      </div>

      <Footer />
    </>
  );
}
