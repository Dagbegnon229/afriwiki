"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";

interface Suggestion {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: string | null;
}

export const Header: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Fetch suggestions as user types
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data } = await supabase
        .from("entrepreneurs")
        .select("id, slug, first_name, last_name, headline, photo_url")
        .eq("is_published", true)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
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
  }, [searchQuery, supabase]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/e/${slug}`);
  };

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="header-left">
          <button className="menu-btn" aria-label="Menu">
            ☰
          </button>
          <Link href="/" className="logo">
            <div className="globe-logo">🌍</div>
            <div className="logo-text">
              <span className="logo-title">AfriWiki</span>
              <span className="logo-subtitle">L&apos;encyclopédie libre</span>
            </div>
          </Link>
        </div>

        <form className="search-container" onSubmit={handleSearch} style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Rechercher sur AfriWiki"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            aria-label="Rechercher sur AfriWiki"
            autoComplete="off"
          />
          <button type="submit" className="search-btn">
            Rechercher
          </button>

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
                zIndex: 1000,
                maxHeight: "350px",
                overflowY: "auto",
              }}
            >
              <div style={{ padding: "0.5rem 1rem", background: "var(--background-secondary)", fontSize: "0.8rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                Suggestions
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionClick(item.slug)}
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
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--background-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt=""
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--background-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      👤
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--link-color)", fontSize: "0.95rem" }}>
                      {item.first_name} {item.last_name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {item.headline || "Entrepreneur"}
                    </div>
                  </div>
                </button>
              ))}
              <Link
                href={`/recherche?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => setShowSuggestions(false)}
                style={{
                  display: "block",
                  padding: "0.75rem 1rem",
                  textAlign: "center",
                  fontSize: "0.9rem",
                  color: "var(--link-color)",
                  background: "var(--background-secondary)",
                }}
              >
                Voir tous les résultats pour &quot;{searchQuery}&quot; →
              </Link>
            </div>
          )}
        </form>

        <div className="header-right">
          <span className="lang-selector">🌐 12 langues ▾</span>
          <Link href="/contribuer">Contribuer</Link>
          <Link href="/inscription">Créer un compte</Link>
          <Link href="/connexion">Se connecter</Link>
        </div>
      </div>
    </header>
  );
};
