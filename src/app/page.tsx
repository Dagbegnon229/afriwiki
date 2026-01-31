import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

interface FeaturedEntrepreneur {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  country: string | null;
  verification_level: number;
  reason?: string;
}

export const revalidate = 60; // Revalider toutes les 60 secondes

export default async function HomePage() {
  const supabase = await createClient();

  // Récupérer l'entrepreneur à la une (position 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: featuredData } = await (supabase as any)
    .from("featured_items")
    .select("item_id, reason")
    .eq("item_type", "entrepreneur")
    .eq("position", 1)
    .or("ends_at.is.null,ends_at.gt.now()")
    .order("position", { ascending: true })
    .limit(1)
    .single();

  let featuredEntrepreneur: FeaturedEntrepreneur | null = null;

  if (featuredData) {
    const { data: entrepreneur } = await supabase
      .from("entrepreneurs")
      .select("id, slug, first_name, last_name, headline, bio, photo_url, country, verification_level")
      .eq("id", featuredData.item_id)
      .eq("is_published", true)
      .single();

    if (entrepreneur) {
      featuredEntrepreneur = {
        ...(entrepreneur as FeaturedEntrepreneur),
        reason: featuredData.reason,
      };
    }
  }

  // Si pas d'entrepreneur à la une, prendre un entrepreneur aléatoire vérifié
  if (!featuredEntrepreneur) {
    const { data: randomEntrepreneur } = await supabase
      .from("entrepreneurs")
      .select("id, slug, first_name, last_name, headline, bio, photo_url, country, verification_level")
      .eq("is_published", true)
      .gte("verification_level", 2)
      .order("views_count", { ascending: false })
      .limit(1)
      .single();

    if (randomEntrepreneur) {
      featuredEntrepreneur = randomEntrepreneur as FeaturedEntrepreneur;
    }
  }

  // Compter les stats
  const { count: entrepreneursCount } = await supabase
    .from("entrepreneurs")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  const { count: verifiedCount } = await supabase
    .from("entrepreneurs")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .gte("verification_level", 2);

  const stats = {
    profiles: entrepreneursCount || 0,
    countries: 54,
    verified: entrepreneursCount && verifiedCount ? Math.round((verifiedCount / entrepreneursCount) * 100) : 0,
  };

  // Fonction pour tronquer la bio
  const truncateBio = (bio: string | null, maxLength: number = 300) => {
    if (!bio) return "";
    if (bio.length <= maxLength) return bio;
    return bio.slice(0, maxLength).trim() + "...";
  };

  // Pays mapping
  const countryNames: Record<string, string> = {
    ng: "Nigeria",
    ke: "Kenya",
    za: "Afrique du Sud",
    gh: "Ghana",
    sn: "Sénégal",
    ci: "Côte d'Ivoire",
    bj: "Bénin",
    rw: "Rwanda",
    tz: "Tanzanie",
    eg: "Égypte",
    ma: "Maroc",
    tn: "Tunisie",
    et: "Éthiopie",
    ug: "Ouganda",
  };

  return (
    <>
      <Header />

      {/* Tabs navigation */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab active">
            Accueil
          </Link>
          <Link href="#" className="tab">
            Discussion
          </Link>
        </div>
        <div className="tabs-right">
          <Link href="#">Lire</Link>
          <Link href="#">Voir le texte source</Link>
          <Link href="#">Voir l&apos;historique</Link>
          <span>Outils ▾</span>
        </div>
      </nav>

      {/* Main container */}
      <div className="main-container">
        <main className="content-wrapper">
          {/* Welcome section */}
          <section className="welcome-section">
            <div className="welcome-title">Bienvenue sur AfriWiki</div>

            <div className="welcome-logo">
              <div className="welcome-globe">🌍</div>
              <div className="welcome-text">
                <h1>AfriWiki</h1>
                <p>
                  L&apos;encyclopédie des entrepreneurs africains que vous pouvez
                  améliorer
                </p>
              </div>
            </div>

            <div className="welcome-links">
              <div className="welcome-links-col">
                <Link href="/a-propos">Accueil de la communauté</Link>
                <Link href="/inscription">Comment contribuer ?</Link>
              </div>
              <div className="welcome-links-col">
                <Link href="/recherche">Portails thématiques</Link>
                <Link href="/a-propos">Principes fondateurs</Link>
              </div>
              <div className="welcome-links-col">
                <Link href="/aide">Sommaire de l&apos;aide</Link>
                <Link href="/aide">Poser une question</Link>
              </div>
            </div>
          </section>

          {/* Notice */}
          <div className="notice-box">
            <strong>AfriWiki</strong> recense actuellement{" "}
            <strong>{stats.profiles.toLocaleString("fr-FR")} profils</strong> d&apos;entrepreneurs vérifiés dans{" "}
            <strong>{stats.countries} pays africains</strong>.{" "}
            <Link href="/dashboard/creer">Créer votre page →</Link>
          </div>

          {/* Main content grid */}
          <div className="content-grid">
            {/* Left column */}
            <div>
              {/* Entrepreneur du jour */}
              <div className="content-box">
                <div className="content-box-header">
                  <h2>Entrepreneur du jour</h2>
                </div>
                <div className="content-box-body">
                  {featuredEntrepreneur ? (
                    <>
                      <span className="featured-label">
                        ⭐ {featuredEntrepreneur.reason || "À la une"}
                      </span>
                      <div className="entrepreneur-card">
                        <div className="entrepreneur-photo">
                          {featuredEntrepreneur.photo_url ? (
                            <img
                              src={featuredEntrepreneur.photo_url}
                              alt={`${featuredEntrepreneur.first_name} ${featuredEntrepreneur.last_name}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                            />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <div className="entrepreneur-info">
                          <h3>
                            <Link href={`/e/${featuredEntrepreneur.slug}`}>
                              {featuredEntrepreneur.first_name} {featuredEntrepreneur.last_name}
                            </Link>
                            {featuredEntrepreneur.verification_level >= 2 && (
                              <span className="verified-badge">✓ Vérifié</span>
                            )}
                          </h3>
                          <div className="entrepreneur-meta">
                            📍 {featuredEntrepreneur.country ? countryNames[featuredEntrepreneur.country.toLowerCase()] || featuredEntrepreneur.country : "Afrique"}
                            {featuredEntrepreneur.headline && ` • ${featuredEntrepreneur.headline}`}
                          </div>
                          <p className="entrepreneur-excerpt">
                            <b>{featuredEntrepreneur.first_name} {featuredEntrepreneur.last_name}</b>{" "}
                            {truncateBio(featuredEntrepreneur.bio)}{" "}
                            <Link href={`/e/${featuredEntrepreneur.slug}`}>Lire la suite</Link>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                      <p>Aucun entrepreneur à la une pour le moment.</p>
                      <Link href="/recherche">Explorer les profils →</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Secteurs d'activité */}
              <div className="content-box" style={{ marginTop: "1rem" }}>
                <div className="content-box-header">
                  <h2>Secteurs d&apos;activité</h2>
                </div>
                <div className="content-box-body">
                  <div className="categories-list">
                    <div className="category-item">
                      <span className="category-icon">💰</span>
                      <Link href="/secteur/fintech">Fintech & Mobile Money</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">⚡</span>
                      <Link href="/secteur/energie">Énergie & Cleantech</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🌾</span>
                      <Link href="/secteur/agriculture">Agriculture & Agritech</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🚚</span>
                      <Link href="/secteur/logistique">Logistique & Transport</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🏥</span>
                      <Link href="/secteur/sante">Santé & Healthtech</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🛒</span>
                      <Link href="/secteur/commerce">Commerce & E-commerce</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">📚</span>
                      <Link href="/secteur/education">Éducation & Edtech</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🏨</span>
                      <Link href="/secteur/immobilier">Immobilier & Proptech</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pays africains */}
              <div className="content-box" style={{ marginTop: "1rem" }}>
                <div className="content-box-header">
                  <h2>Par pays</h2>
                </div>
                <div className="content-box-body">
                  <div className="categories-list">
                    <div className="category-item">
                      <span className="category-icon">🇳🇬</span>
                      <Link href="/pays/ng">Nigeria</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇰🇪</span>
                      <Link href="/pays/ke">Kenya</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇿🇦</span>
                      <Link href="/pays/za">Afrique du Sud</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇬🇭</span>
                      <Link href="/pays/gh">Ghana</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇸🇳</span>
                      <Link href="/pays/sn">Sénégal</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇨🇮</span>
                      <Link href="/pays/ci">Côte d&apos;Ivoire</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇧🇯</span>
                      <Link href="/pays/bj">Bénin</Link>
                    </div>
                    <div className="category-item">
                      <span className="category-icon">🇷🇼</span>
                      <Link href="/pays/rw">Rwanda</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Présentation */}
              <div className="content-box">
                <div className="content-box-header">
                  <h2>Présentation</h2>
                </div>
                <div className="content-box-body">
                  <p>
                    <strong>AfriWiki</strong> est un projet d&apos;encyclopédie
                    collective des{" "}
                    <Link href="/recherche">entrepreneurs africains</Link>,
                    fonctionnant sur le principe du{" "}
                    <Link href="#">wiki</Link>. Ce projet vise à offrir un
                    contenu librement réutilisable, objectif et vérifiable, que
                    chacun peut modifier et améliorer.
                  </p>
                  <p>
                    Contrairement aux encyclopédies traditionnelles, AfriWiki se
                    concentre sur les{" "}
                    <strong>acteurs économiques du continent africain</strong> :
                    fondateurs de startups, chefs d&apos;entreprises,
                    investisseurs, et leaders d&apos;industrie.
                  </p>
                  <p>
                    Chaque profil est soumis à un processus de{" "}
                    <Link href="#">vérification d&apos;identité</Link> pour
                    garantir l&apos;authenticité des informations.
                  </p>

                  {/* Stats */}
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">{stats.profiles.toLocaleString("fr-FR")}</span>
                      <span className="stat-label">profils</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{stats.countries}</span>
                      <span className="stat-label">pays</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{stats.verified}%</span>
                      <span className="stat-label">vérifiés</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contribuer */}
              <div className="content-box" style={{ marginTop: "1rem" }}>
                <div className="content-box-header">
                  <h2>Contribuer</h2>
                </div>
                <div className="content-box-body">
                  <p>
                    Vous souhaitez participer à AfriWiki ? Voici comment vous
                    pouvez contribuer :
                  </p>
                  <ul>
                    <li>
                      <Link href="/inscription">Créer votre page entrepreneur</Link>
                    </li>
                    <li>
                      <Link href="/recherche">Améliorer un article existant</Link>
                    </li>
                    <li>
                      <Link href="/inscription">Ajouter des sources fiables</Link>
                    </li>
                    <li>
                      <Link href="/aide">Signaler une erreur</Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actualités */}
              <div className="content-box" style={{ marginTop: "1rem" }}>
                <div className="content-box-header">
                  <h2>Actualités</h2>
                </div>
                <div className="content-box-body">
                  <ul>
                    <li>
                      <strong>Janvier 2026</strong> — Lancement de la version
                      bêta d&apos;AfriWiki
                    </li>
                    <li>
                      <strong>Décembre 2025</strong> — Partenariat avec
                      l&apos;Union Africaine
                    </li>
                    <li>
                      <strong>Novembre 2025</strong> — 10 000 profils créés
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <Sidebar />
      </div>

      <Footer />
    </>
  );
}
