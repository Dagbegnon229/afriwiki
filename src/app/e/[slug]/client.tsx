"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SuggestEditModal } from "@/components/SuggestEditModal";
import { applyStaticAutoLinks } from "@/lib/autolink";

// Fonction de sanitization pour éviter les attaques XSS
const sanitizeHtml = (html: string): string => {
  if (!html) return "";

  let sanitized = html;

  // Supprimer les balises script
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Supprimer les event handlers inline
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // Supprimer les liens javascript:
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

  // Supprimer les balises dangereuses
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*>.*?<\/\1>/gi, "");
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*\/?>/gi, "");

  // Supprimer les expressions CSS dangereuses
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, "");

  return sanitized;
};

interface EntrepreneurData {
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  city: string | null;
  verification_level: number;
  views_count: number;
  updated_at: string;
  country: string | null;
}

interface CountryData {
  code: string;
  name: string;
  flag_emoji: string;
}

interface ParcoursData {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
}

interface EntrepriseData {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  website: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
}

interface RecompenseData {
  id: string;
  title: string;
  organization: string | null;
  year: number | null;
  description: string | null;
  source_url: string | null;
}

interface Props {
  entrepreneur: EntrepreneurData;
  country: CountryData | undefined;
  fullName: string;
  parcours: ParcoursData[];
  entreprises: EntrepriseData[];
  recompenses: RecompenseData[];
}

export const EntrepreneurPageClient = ({ entrepreneur, country, fullName, parcours, entreprises, recompenses }: Props) => {
  // State pour les accordéons
  const [expandedParcours, setExpandedParcours] = useState<string | null>(null);
  const [expandedEntreprise, setExpandedEntreprise] = useState<string | null>(null);
  const [expandedRecompense, setExpandedRecompense] = useState<string | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Helper pour formater les dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  // Helper pour convertir le markdown simple en HTML
  const parseMarkdown = (text: string) => {
    if (!text) return "";

    // D'abord, on sépare par doubles sauts de ligne pour avoir les paragraphes
    const blocks = text.split(/\n\n+/);

    const processedBlocks = blocks.map((block) => {
      // Nettoyer les espaces au début et à la fin
      block = block.trim();
      if (!block) return "";

      // Titres ### 
      if (block.startsWith("### ")) {
        const title = block.replace(/^### /, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return `<h4 class="wiki-h4">${title}</h4>`;
      }

      // Titres ## 
      if (block.startsWith("## ")) {
        const title = block.replace(/^## /, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return `<h3 class="wiki-h3">${title}</h3>`;
      }

      // Listes à puces (lignes commençant par * ou -)
      if (/^[\*\-] /m.test(block)) {
        const items = block.split(/\n/).map((line) => {
          if (/^[\*\-] /.test(line)) {
            const content = line.replace(/^[\*\-] /, "")
              .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
              .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '<strong>$1</strong>')
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>");
            return `<li>${content}</li>`;
          }
          return line;
        }).join("");
        return `<ul class="wiki-list">${items}</ul>`;
      }

      // Listes numérotées
      if (/^\d+\. /m.test(block)) {
        const items = block.split(/\n/).map((line) => {
          if (/^\d+\. /.test(line)) {
            const content = line.replace(/^\d+\. /, "")
              .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
              .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '<strong>$1</strong>')
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>");
            return `<li>${content}</li>`;
          }
          return line;
        }).join("");
        return `<ol class="wiki-list">${items}</ol>`;
      }

      // Paragraphe normal avec mise en forme inline
      let html = block
        // Liens markdown [texte](url) - si url commence par http ou / c'est un vrai lien
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>')
        // Liens markdown mal formés [texte](texte) - on garde juste le premier texte en gras
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '<strong>$1</strong>')
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");

      return `<p class="wiki-paragraph">${html}</p>`;
    });

    return processedBlocks.filter(b => b).join("");
  };

  // Helper pour détecter si le contenu est du HTML ou du Markdown
  const isHtml = (text: string) => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  // Rendu du contenu (supporte HTML et Markdown) avec auto-linking et sanitization
  const renderContent = (text: string | null) => {
    if (!text) return null;

    let html: string;

    // Si c'est déjà du HTML (venant de l'éditeur riche), on l'utilise directement
    if (isHtml(text)) {
      html = text;
    } else {
      // Sinon on parse le markdown
      html = parseMarkdown(text);
    }

    // SÉCURITÉ: Sanitizer le HTML pour éviter les attaques XSS
    html = sanitizeHtml(html);

    // Appliquer l'auto-linking pour créer des liens vers les pages AfriWiki
    html = applyStaticAutoLinks(html);

    return <div dangerouslySetInnerHTML={{ __html: html }} className="wiki-content" />;
  };
  // Verification badge text
  const verificationBadges: Record<number, { icon: string; text: string }> = {
    1: { icon: "🔵", text: "Basique" },
    2: { icon: "✓", text: "Vérifié" },
    3: { icon: "⭐", text: "Pro" },
    4: { icon: "👑", text: "Notable" },
  };

  const badge = verificationBadges[entrepreneur.verification_level];

  return (
    <>
      <Header />

      {/* Tabs navigation */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="#" className="tab active">
            Article
          </Link>
          <Link href="#" className="tab">
            Discussion
          </Link>
        </div>
        <div className="tabs-right">
          <Link href={`/e/${entrepreneur.slug}`}>Lire</Link>
          <button
            onClick={() => setShowSuggestModal(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--link-color)",
              fontSize: "inherit",
              padding: 0,
            }}
          >
            Modifier
          </button>
          <Link href={`/connexion?redirect=/dashboard/editer&article=${entrepreneur.slug}`}>Voir l&apos;historique</Link>
          <span>Outils ▾</span>
        </div>
      </nav>

      {/* Main container */}
      <div className="main-container">
        <main className="content-wrapper">
          {/* Page title */}
          <h1
            style={{
              fontFamily:
                "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
              fontSize: "1.8rem",
              fontWeight: "normal",
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "0.25rem",
              marginBottom: "1rem",
            }}
          >
            {fullName}
          </h1>

          {/* Content with infobox */}
          <div style={{ overflow: "hidden" }}>
            {/* Infobox - Wikipedia style */}
            <div
              style={{
                float: "right",
                clear: "right",
                marginLeft: "1rem",
                marginBottom: "1rem",
                width: "280px",
                border: "1px solid var(--border-color)",
                background: "var(--background-secondary)",
                fontSize: "0.9rem",
              }}
            >
              {/* Infobox header */}
              <div
                style={{
                  background: "var(--header-bg)",
                  padding: "0.5rem",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {fullName}
              </div>

              {/* Photo */}
              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "var(--background)",
                }}
              >
                {entrepreneur.photo_url ? (
                  <img
                    src={entrepreneur.photo_url}
                    alt={fullName}
                    style={{
                      width: "150px",
                      height: "180px",
                      margin: "0 auto",
                      objectFit: "cover",
                      border: "1px solid var(--border-light)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "150px",
                      height: "180px",
                      margin: "0 auto",
                      background: "var(--background-secondary)",
                      border: "1px solid var(--border-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                    }}
                  >
                    👩🏾‍💼
                  </div>
                )}
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.5rem",
                  }}
                >
                  {entrepreneur.headline}
                </p>
              </div>

              {/* Infobox rows */}
              <div
                style={{
                  display: "flex",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    flex: "0 0 35%",
                    padding: "0.35rem 0.5rem",
                    background: "var(--header-bg)",
                    fontWeight: 500,
                  }}
                >
                  Vérification
                </div>
                <div style={{ flex: 1, padding: "0.35rem 0.5rem" }}>
                  {badge && (
                    <span
                      className={`verified-badge ${entrepreneur.verification_level === 3
                        ? "verified-badge-pro"
                        : ""
                        }`}
                    >
                      {badge.icon} {badge.text}
                    </span>
                  )}
                </div>
              </div>

              {country && (
                <div
                  style={{
                    display: "flex",
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      flex: "0 0 35%",
                      padding: "0.35rem 0.5rem",
                      background: "var(--header-bg)",
                      fontWeight: 500,
                    }}
                  >
                    Nationalité
                  </div>
                  <div style={{ flex: 1, padding: "0.35rem 0.5rem" }}>
                    {country.flag_emoji}{" "}
                    <Link href={`/pays/${country.code.toLowerCase()}`}>
                      {country.name}
                    </Link>
                  </div>
                </div>
              )}

              {entrepreneur.city && (
                <div
                  style={{
                    display: "flex",
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      flex: "0 0 35%",
                      padding: "0.35rem 0.5rem",
                      background: "var(--header-bg)",
                      fontWeight: 500,
                    }}
                  >
                    Résidence
                  </div>
                  <div style={{ flex: 1, padding: "0.35rem 0.5rem" }}>
                    {entrepreneur.city}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    flex: "0 0 35%",
                    padding: "0.35rem 0.5rem",
                    background: "var(--header-bg)",
                    fontWeight: 500,
                  }}
                >
                  Profession
                </div>
                <div style={{ flex: 1, padding: "0.35rem 0.5rem" }}>
                  {entrepreneur.headline || "Entrepreneur"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    flex: "0 0 35%",
                    padding: "0.35rem 0.5rem",
                    background: "var(--header-bg)",
                    fontWeight: 500,
                  }}
                >
                  Consultations
                </div>
                <div style={{ flex: 1, padding: "0.35rem 0.5rem" }}>
                  {entrepreneur.views_count.toLocaleString("fr-FR")}
                </div>
              </div>
            </div>

            {/* Main article content */}
            <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
              <b>{fullName}</b>{" "}
              {entrepreneur.headline && (
                <>est {entrepreneur.headline.toLowerCase()}. </>
              )}
              {country && (
                <>
                  Entrepreneur {country.flag_emoji}{" "}
                  <Link href={`/pays/${country.code.toLowerCase()}`}>
                    {country.name.toLowerCase()}
                  </Link>
                  {entrepreneur.city && <>, basé à {entrepreneur.city}</>}.
                </>
              )}
            </p>

            {/* Biographie */}
            {entrepreneur.bio && (
              <>
                <h2
                  style={{
                    fontFamily:
                      "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
                    fontSize: "1.3rem",
                    fontWeight: "normal",
                    borderBottom: "1px solid var(--border-light)",
                    paddingBottom: "0.2rem",
                    marginTop: "1.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  Biographie
                </h2>
                {renderContent(entrepreneur.bio)}
              </>
            )}

            {/* Parcours */}
            <h2
              style={{
                fontFamily:
                  "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
                fontSize: "1.3rem",
                fontWeight: "normal",
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: "0.2rem",
                marginTop: "1.5rem",
                marginBottom: "0.75rem",
              }}
            >
              Parcours
            </h2>
            {parcours.length > 0 ? (
              <div style={{ marginBottom: "1rem" }}>
                {parcours.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      marginBottom: "0.5rem",
                      border: "1px solid var(--border-light)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setExpandedParcours(expandedParcours === item.id ? null : item.id)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: expandedParcours === item.id ? "var(--background-secondary)" : "var(--background)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                        fontSize: "0.95rem",
                      }}
                    >
                      <span>
                        <span style={{ color: "var(--link-color)", textDecoration: "underline" }}>{item.title}</span>
                        {(item.start_date || item.end_date || item.is_current) && (
                          <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem", fontWeight: "normal" }}>
                            ({formatDate(item.start_date)}
                            {item.start_date && (item.end_date || item.is_current) && " – "}
                            {item.is_current ? "présent" : formatDate(item.end_date)})
                          </span>
                        )}
                      </span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {expandedParcours === item.id ? "▲" : "▼"}
                      </span>
                    </button>
                    {expandedParcours === item.id && item.description && (
                      <div style={{ padding: "1rem", borderTop: "1px solid var(--border-light)", background: "var(--background-secondary)" }}>
                        {renderContent(item.description)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                Cette section est en cours de rédaction.{" "}
                <Link href="#">Contribuer</Link>
              </p>
            )}

            {/* Entreprises */}
            <h2
              style={{
                fontFamily:
                  "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
                fontSize: "1.3rem",
                fontWeight: "normal",
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: "0.2rem",
                marginTop: "1.5rem",
                marginBottom: "0.75rem",
              }}
            >
              Entreprises
            </h2>
            {entreprises.length > 0 ? (
              <div style={{ marginBottom: "1rem" }}>
                {entreprises.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      marginBottom: "0.5rem",
                      border: "1px solid var(--border-light)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setExpandedEntreprise(expandedEntreprise === item.id ? null : item.id)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: expandedEntreprise === item.id ? "var(--background-secondary)" : "var(--background)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                        fontSize: "0.95rem",
                      }}
                    >
                      <span>
                        <span style={{ color: "var(--link-color)", textDecoration: "underline" }}>{item.name}</span>
                        {item.role && <span style={{ fontWeight: "normal" }}> — {item.role}</span>}
                        {(item.start_date || item.end_date || item.is_current) && (
                          <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem", fontWeight: "normal", fontSize: "0.9rem" }}>
                            ({formatDate(item.start_date)}
                            {item.start_date && (item.end_date || item.is_current) && " – "}
                            {item.is_current ? "présent" : formatDate(item.end_date)})
                          </span>
                        )}
                      </span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {expandedEntreprise === item.id ? "▲" : "▼"}
                      </span>
                    </button>
                    {expandedEntreprise === item.id && (
                      <div style={{ padding: "1rem", borderTop: "1px solid var(--border-light)", background: "var(--background-secondary)" }}>
                        {item.description && (
                          <div style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
                            {renderContent(item.description)}
                          </div>
                        )}
                        {item.website && (
                          <p style={{ fontSize: "0.9rem" }}>
                            🔗 <Link href={item.website} target="_blank" rel="noopener noreferrer">
                              {item.website}
                            </Link>
                          </p>
                        )}
                        {!item.description && !item.website && (
                          <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                            Aucune description disponible.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                Aucune entreprise renseignée.{" "}
                <Link href="#">Contribuer</Link>
              </p>
            )}

            {/* Récompenses */}
            {recompenses.length > 0 && (
              <>
                <h2
                  style={{
                    fontFamily:
                      "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
                    fontSize: "1.3rem",
                    fontWeight: "normal",
                    borderBottom: "1px solid var(--border-light)",
                    paddingBottom: "0.2rem",
                    marginTop: "1.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  Récompenses et distinctions
                </h2>
                <div style={{ marginBottom: "1rem" }}>
                  {recompenses.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        marginBottom: "0.5rem",
                        border: "1px solid var(--border-light)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => setExpandedRecompense(expandedRecompense === item.id ? null : item.id)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          background: expandedRecompense === item.id ? "var(--background-secondary)" : "var(--background)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          textAlign: "left",
                          fontSize: "0.95rem",
                        }}
                      >
                        <span>
                          🏆 <span style={{ color: "var(--link-color)", textDecoration: "underline" }}>{item.title}</span>
                          {item.organization && <span style={{ fontWeight: "normal" }}> — {item.organization}</span>}
                          {item.year && <span style={{ color: "var(--text-secondary)", fontWeight: "normal" }}> ({item.year})</span>}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {expandedRecompense === item.id ? "▲" : "▼"}
                        </span>
                      </button>
                      {expandedRecompense === item.id && (
                        <div style={{ padding: "1rem", borderTop: "1px solid var(--border-light)", background: "var(--background-secondary)" }}>
                          {item.description && (
                            <p style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>
                              {item.description}
                            </p>
                          )}
                          {item.source_url && (
                            <p style={{ fontSize: "0.9rem" }}>
                              📎 <Link href={item.source_url} target="_blank" rel="noopener noreferrer">
                                Voir la source
                              </Link>
                            </p>
                          )}
                          {!item.description && !item.source_url && (
                            <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                              Aucun détail supplémentaire.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Références */}
            <h2
              style={{
                fontFamily:
                  "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
                fontSize: "1.3rem",
                fontWeight: "normal",
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: "0.2rem",
                marginTop: "1.5rem",
                marginBottom: "0.75rem",
              }}
            >
              Références
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontStyle: "italic",
                fontSize: "0.9rem",
              }}
            >
              Cette section nécessite des sources.{" "}
              <Link href="#">Ajouter des références</Link>
            </p>

            {/* Liens externes */}
            <h2
              style={{
                fontFamily:
                  "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
                fontSize: "1.3rem",
                fontWeight: "normal",
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: "0.2rem",
                marginTop: "1.5rem",
                marginBottom: "0.75rem",
              }}
            >
              Liens externes
            </h2>
            <ul style={{ paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
              <li>
                <Link href="#">Profil LinkedIn</Link>
              </li>
              <li>
                <Link href="#">Site officiel</Link>
              </li>
            </ul>
          </div>

          {/* Categories footer */}
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-light)",
            }}
          >
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong>Catégories</strong> :{" "}
              <Link href={`/pays/${country?.code.toLowerCase()}`}>
                Entrepreneur {country?.name}
              </Link>
              {" • "}
              <Link href="/secteur/fintech">Fintech</Link>
              {" • "}
              <Link href="/verification">
                Profil vérifié niveau {entrepreneur.verification_level}
              </Link>
            </p>
          </div>

          {/* Page metadata */}
          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
            }}
          >
            <p>
              Dernière modification le{" "}
              {new Date(entrepreneur.updated_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              • {entrepreneur.views_count.toLocaleString("fr-FR")} consultations
            </p>
          </div>
        </main>

        <Sidebar />
      </div>

      <Footer />

      {/* Modal de suggestion de modification */}
      <SuggestEditModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        entrepreneurSlug={entrepreneur.slug}
        entrepreneurName={fullName}
        currentBio={entrepreneur.bio}
        currentHeadline={entrepreneur.headline}
      />
    </>
  );
};
