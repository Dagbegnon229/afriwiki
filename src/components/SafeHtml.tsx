"use client";

import { useMemo } from "react";

interface SafeHtmlProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  maxLength?: number;
}

/**
 * Composant pour afficher du HTML de manière sécurisée
 * Sanitize le contenu pour éviter les attaques XSS
 */
export const SafeHtml = ({ html, className, style, maxLength }: SafeHtmlProps) => {
  const sanitizedHtml = useMemo(() => {
    if (!html) return "";

    let content = html;

    // Tronquer si nécessaire
    if (maxLength && content.length > maxLength) {
      content = content.slice(0, maxLength) + "...";
    }

    // Supprimer les balises script et leur contenu
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Supprimer les event handlers inline
    content = content.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
    content = content.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

    // Supprimer les liens javascript:
    content = content.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    content = content.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

    // Supprimer les balises dangereuses
    content = content.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*>.*?<\/\1>/gi, "");
    content = content.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*\/?>/gi, "");

    // Supprimer les balises style inline avec expressions
    content = content.replace(/expression\s*\([^)]*\)/gi, "");
    content = content.replace(/javascript\s*:/gi, "");

    // Supprimer les balises meta, link, base
    content = content.replace(/<(meta|link|base)[^>]*\/?>/gi, "");

    // Supprimer les data URIs suspects (sauf images)
    content = content.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, 'src=""');

    return content;
  }, [html, maxLength]);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

/**
 * Version inline (span) du composant SafeHtml
 */
export const SafeHtmlInline = ({ html, className, style, maxLength }: SafeHtmlProps) => {
  const sanitizedHtml = useMemo(() => {
    if (!html) return "";

    let content = html;

    if (maxLength && content.length > maxLength) {
      content = content.slice(0, maxLength) + "...";
    }

    // Même sanitization que SafeHtml
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    content = content.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
    content = content.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
    content = content.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    content = content.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*>.*?<\/\1>/gi, "");
    content = content.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*\/?>/gi, "");
    content = content.replace(/expression\s*\([^)]*\)/gi, "");
    content = content.replace(/javascript\s*:/gi, "");

    return content;
  }, [html, maxLength]);

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeHtml;
