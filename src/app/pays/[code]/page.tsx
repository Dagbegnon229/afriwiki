import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/data/demo";

interface Entrepreneur {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: string | null;
  city: string | null;
  verification_level: number;
  views_count: number;
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const country = COUNTRIES.find((c) => c.code.toLowerCase() === code.toLowerCase());
  
  if (!country) {
    return { title: "Pays non trouvé - AfriWiki" };
  }
  
  return {
    title: `Entrepreneurs du ${country.name} | AfriWiki`,
    description: `Découvrez les entrepreneurs du ${country.name}. Profils vérifiés et informations fiables sur les acteurs économiques.`,
  };
}

export default async function PaysPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createClient();

  // Trouver le pays
  const country = COUNTRIES.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!country) {
    notFound();
  }

  // Récupérer les entrepreneurs du pays
  const { data: entrepreneurs } = await supabase
    .from("entrepreneurs")
    .select("id, slug, first_name, last_name, headline, photo_url, city, verification_level, views_count")
    .eq("is_published", true)
    .ilike("country", country.code)
    .order("views_count", { ascending: false })
    .limit(100);

  const entrepreneursList = (entrepreneurs || []) as Entrepreneur[];

  // Stats
  const totalViews = entrepreneursList.reduce((sum, e) => sum + (e.views_count || 0), 0);
  const verifiedCount = entrepreneursList.filter((e) => e.verification_level >= 2).length;

  return (
    <>
      <Header />

      {/* Navigation tabs */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">Accueil</Link>
          <span className="tab active">{country.name}</span>
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
            <Link href="#" style={{ color: "var(--link-color)" }}>Pays</Link>
            {" > "}
            <span>{country.name}</span>
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
            <span style={{ fontSize: "4rem" }}>{country.flag_emoji}</span>
            <div>
              <h1 style={{ 
                fontSize: "1.75rem", 
                fontFamily: "'Libre Baskerville', Georgia, serif",
                margin: 0 
              }}>
                Entrepreneurs du {country.name}
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)" }}>
                Découvrez les acteurs économiques du {country.name}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "1rem", 
            marginBottom: "1.5rem" 
          }}>
            <div className="content-box" style={{ textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--link-color)" }}>
                {entrepreneursList.length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                entrepreneurs
              </div>
            </div>
            <div className="content-box" style={{ textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22c55e" }}>
                {verifiedCount}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                profils vérifiés
              </div>
            </div>
            <div className="content-box" style={{ textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#f59e0b" }}>
                {totalViews.toLocaleString("fr-FR")}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                vues totales
              </div>
            </div>
          </div>

          {/* Liste des entrepreneurs */}
          {entrepreneursList.length > 0 ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {entrepreneursList.map((e) => (
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
                        {e.city && `📍 ${e.city}`}
                        {e.city && e.views_count > 0 && " • "}
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
              ))}
            </div>
          ) : (
            <div className="content-box" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>{country.flag_emoji}</p>
              <h3>Aucun entrepreneur référencé au {country.name}</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Soyez le premier entrepreneur du {country.name} sur AfriWiki !
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

          {/* Autres pays */}
          <div className="content-box" style={{ marginTop: "2rem" }}>
            <div className="content-box-header">
              <h2>Autres pays</h2>
            </div>
            <div className="content-box-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {COUNTRIES.filter((c) => c.code.toLowerCase() !== code.toLowerCase()).slice(0, 15).map((c) => (
                  <Link
                    key={c.code}
                    href={`/pays/${c.code.toLowerCase()}`}
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
                    {c.flag_emoji} {c.name}
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
