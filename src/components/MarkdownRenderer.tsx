"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
  entrepreneurLinks?: { slug: string; name: string }[];
}

export const MarkdownRenderer = ({ content, entrepreneurLinks = [] }: MarkdownRendererProps) => {
  // Fonction pour auto-linker les noms d'entrepreneurs connus
  const processAutoLinks = (text: string): string => {
    let processedText = text;
    
    // Trier par longueur décroissante pour éviter les conflits de remplacement
    const sortedLinks = [...entrepreneurLinks].sort((a, b) => b.name.length - a.name.length);
    
    sortedLinks.forEach(({ slug, name }) => {
      // Éviter de remplacer dans les liens existants
      const regex = new RegExp(`(?<!\\[)\\b(${name})\\b(?!\\])`, "gi");
      processedText = processedText.replace(regex, `[$1](/e/${slug})`);
    });
    
    return processedText;
  };

  const processedContent = processAutoLinks(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Titres style Wikipedia
        h1: ({ children }) => (
          <h2
            style={{
              fontFamily: "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
              fontSize: "1.5rem",
              fontWeight: "normal",
              borderBottom: "1px solid var(--border-light)",
              paddingBottom: "0.2rem",
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
            }}
          >
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h3
            style={{
              fontFamily: "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
              fontSize: "1.3rem",
              fontWeight: "normal",
              borderBottom: "1px solid var(--border-light)",
              paddingBottom: "0.2rem",
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
            }}
          >
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h4
            style={{
              fontFamily: "'Libre Baskerville', 'Linux Libertine', Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 600,
              marginTop: "1.25rem",
              marginBottom: "0.5rem",
            }}
          >
            {children}
          </h4>
        ),
        // Paragraphes
        p: ({ children }) => (
          <p style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
            {children}
          </p>
        ),
        // Liens - vérifier si c'est un lien interne AfriWiki
        a: ({ href, children }) => {
          const isInternal = href?.startsWith("/");
          if (isInternal) {
            return (
              <Link href={href || "#"} style={{ color: "var(--link-color)" }}>
                {children}
              </Link>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--link-color)" }}
            >
              {children}
            </a>
          );
        },
        // Listes
        ul: ({ children }) => (
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: "0.25rem", lineHeight: 1.6 }}>
            {children}
          </li>
        ),
        // Gras et italique
        strong: ({ children }) => <strong>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        // Citations
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "3px solid var(--link-color)",
              paddingLeft: "1rem",
              marginLeft: 0,
              marginBottom: "0.75rem",
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            {children}
          </blockquote>
        ),
        // Code inline
        code: ({ children }) => (
          <code
            style={{
              background: "var(--background-secondary)",
              padding: "0.1rem 0.3rem",
              borderRadius: "3px",
              fontSize: "0.9em",
            }}
          >
            {children}
          </code>
        ),
        // Séparateur horizontal
        hr: () => (
          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-light)",
              margin: "1.5rem 0",
            }}
          />
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};
