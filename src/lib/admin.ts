/**
 * Utilitaires de sécurité admin
 * Ces fonctions doivent être utilisées côté serveur uniquement
 */

// Email admin autorisé - en dur pour éviter toute modification
const ADMIN_EMAIL = "linkpehoundagbegnon@gmail.com";

/**
 * Vérifie si un email est celui de l'admin
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

/**
 * Obtient l'email admin (pour comparaison sécurisée)
 */
export const getAdminEmail = (): string => ADMIN_EMAIL;

/**
 * Sanitize une chaîne HTML pour éviter les attaques XSS
 * Supprime les balises script et les attributs dangereux
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return "";
  
  // Supprimer les balises script
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Supprimer les event handlers inline (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, "");
  
  // Supprimer les liens javascript:
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  
  // Supprimer les balises iframe, object, embed
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*>.*?<\/\1>/gi, "");
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, "");
  
  // Supprimer les balises style avec expressions
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, "");
  
  return sanitized;
};

/**
 * Escape une chaîne pour affichage sécurisé (pas de HTML)
 */
export const escapeHtml = (text: string): string => {
  if (!text) return "";
  
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
};

/**
 * Valide un UUID
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Valide une URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Nettoie une entrée texte (supprime caractères dangereux)
 */
export const sanitizeInput = (input: string, maxLength = 500): string => {
  if (!input) return "";
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Supprimer chevrons basiques
};
