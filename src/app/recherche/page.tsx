"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";

interface Entrepreneur {
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
}

const SECTORS = [
  { value: "", label: "Tous les secteurs" },
  { value: "fintech", label: "Fintech" },
  { value: "agriculture", label: "Agriculture" },
  { value: "sante", label: "Santé" },
  { value: "education", label: "Éducation" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "energie", label: "Énergie" },
  { value: "industrie", label: "Industrie" },
  { value: "tech", label: "Tech" },
  { value: "ia", label: "Intelligence Artificielle" },
];

const COUNTRIES = [
  { value: "", label: "Tous les pays" },
  { value: "BJ", label: "🇧🇯 Bénin" },
  { value: "NG", label: "🇳🇬 Nigeria" },
  { value: "ZA", label: "🇿🇦 Afrique du Sud" },
  { value: "KE", label: "🇰🇪 Kenya" },
  { value: "EG", label: "🇪🇬 Égypte" },
  { value: "MA", label: "🇲🇦 Maroc" },
  { value: "GH", label: "🇬🇭 Ghana" },
  { value: "SN", label: "🇸🇳 Sénégal" },
  { value: "CI", label: "🇨🇮 Côte d'Ivoire" },
  { value: "CM", label: "🇨🇲 Cameroun" },
  { value: "TG", label: "🇹🇬 Togo" },
];

const VERIFICATION_LEVELS = [
  { value: "", label: "Tous les niveaux" },
  { value: "1", label: "🔵 Basique" },
  { value: "2", label: "✅ Vérifié" },
  { value: "3", label: "⭐ Pro" },
  { value: "4", label: "👑 Notable" },
];

const getVerificationBadge = (level: number) => {
  switch (level) {
    case 1:
      return <span className="verified-badge">🔵 Basique</span>;
    case 2:
      return <span className="verified-badge">✓ Vérifié</span>;
    case 3:
      return <span className="verified-badge verified-badge-pro">⭐ Pro</span>;
    case 4:
      return <span className="verified-badge verified-badge-pro">👑 Notable</span>;
    default:
      return null;
  }
};

const getCountryFlag = (code: string | null) => {
  const country = COUNTRIES.find(c => c.value === code);
  return country ? country.label : code;
};

function RechercheContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = React.useState(initialQuery);
  const [sector, setSector] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [verification, setVerification] = React.useState("");
  const [results, setResults] = React.useState<Entrepreneur[]>([]);
  const [suggestions, setSuggestions] = React.useState<Entrepreneur[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const supabase = createClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Fetch suggestions as user types
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data } = await supabase
        .from("entrepreneurs")
        .select("id, slug, first_name, last_name, headline, photo_url, country, verification_level")
        .eq("is_published", true)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(5);

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query, supabase]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search function
  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);

    let queryBuilder = supabase
      .from("entrepreneurs")
      .select("*")
      .eq("is_published", true);

    // Search by name
    if (searchQuery) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%`
      );
    }

    // Filter by country
    if (country) {
      queryBuilder = queryBuilder.eq("country", country);
    }

    // Filter by verification level
    if (verification) {
      queryBuilder = queryBuilder.eq("verification_level", parseInt(verification));
    }

    const { data, error } = await queryBuilder.order("verification_level", { ascending: false });

    if (error) {
      console.error("Search error:", error);
      setResults([]);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  // Initial search if query param exists
  React.useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = (entrepreneur: Entrepreneur) => {
    router.push(`/e/${entrepreneur.slug}`);
  };

  return (
    <>
      <Header />

      {/* Tabs navigation */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">
            Accueil
          </Link>
          <Link href="/recherche" className="tab active">
            Recherche
          </Link>
        </div>
        <div className="tabs-right">
          <Link href="#">Recherche avancée</Link>
        </div>
      </nav>

      <div className="main-container">
        <main className="content-wrapper">
          <h1 style={{ marginBottom: "1rem" }}>Recherche</h1>

          {/* Search input with suggestions */}
          <form className="search-page-input" onSubmit={handleSearch} style={{ position: "relative" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Rechercher un entrepreneur, une entreprise..."
                aria-label="Rechercher"
                autoComplete="off"
              />
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--background)",
                    border: "1px solid var(--border-color)",
                    borderTop: "none",
                    borderRadius: "0 0 4px 4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 100,
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--border-light)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--background-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt=""
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "var(--background-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                          }}
                        >
                          👤
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--link-color)" }}>
                          {item.first_name} {item.last_name}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {item.headline || "Entrepreneur"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="wiki-btn wiki-btn-primary">
              Rechercher
            </button>
          </form>

          {/* Filters */}
          <div className="search-filters">
            <select
              className="filter-select"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              aria-label="Filtrer par secteur"
            >
              {SECTORS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              aria-label="Filtrer par pays"
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              aria-label="Filtrer par niveau de vérification"
            >
              {VERIFICATION_LEVELS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          {searched && (
            <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
              {loading ? "Recherche en cours..." : (
                <>
                  {results.length} résultat{results.length !== 1 ? "s" : ""}{" "}
                  {query && `pour "${query}"`}
                </>
              )}
            </p>
          )}

          {/* Results */}
          <div className="search-results">
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                Recherche en cours...
              </div>
            ) : searched && results.length === 0 ? (
              <div className="notice-box">
                <strong>Aucun résultat trouvé.</strong> Essayez de modifier vos
                critères de recherche ou{" "}
                <Link href="/inscription">créez votre page</Link> si vous êtes
                entrepreneur.
              </div>
            ) : (
              results.map((result) => (
                <article key={result.slug} className="search-result-card">
                  <div className="entrepreneur-photo entrepreneur-photo-small">
                    {result.photo_url ? (
                      <img
                        src={result.photo_url}
                        alt={`${result.first_name} ${result.last_name}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div className="entrepreneur-info">
                    <h3 style={{ fontSize: "1rem" }}>
                      <Link href={`/e/${result.slug}`}>
                        {result.first_name} {result.last_name}
                      </Link>
                      {getVerificationBadge(result.verification_level)}
                    </h3>
                    <div className="entrepreneur-meta">
                      {result.headline || "Entrepreneur"} • {getCountryFlag(result.country)}
                      {result.city && ` • ${result.city}`}
                    </div>
                    {result.bio && (
                      <p className="entrepreneur-excerpt">
                        {result.bio.slice(0, 150)}...
                      </p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Help text if no search yet */}
          {!searched && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              <p>Commencez à taper pour voir les suggestions</p>
              <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                ou utilisez les filtres pour affiner votre recherche
              </p>
            </div>
          )}
        </main>

        <Sidebar />
      </div>

      <Footer />
    </>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Header />
        <p>Chargement...</p>
        <Footer />
      </div>
    }>
      <RechercheContent />
    </Suspense>
  );
}
