/**
 * Système d'auto-linking intelligent pour AfriWiki
 * Détecte les mots-clés et crée des liens vers les pages existantes
 */

interface LinkableEntity {
  name: string;
  slug: string;
  type: "entrepreneur" | "country" | "sector" | "term";
}

// Cache des entités pour éviter des requêtes répétées
let entitiesCache: LinkableEntity[] | null = null;

/**
 * Récupère toutes les entités linkables depuis Supabase
 */
export const fetchLinkableEntities = async (supabase: any): Promise<LinkableEntity[]> => {
  if (entitiesCache) return entitiesCache;

  const entities: LinkableEntity[] = [];

  // Récupérer les entrepreneurs publiés
  const { data: entrepreneurs } = await supabase
    .from("entrepreneurs")
    .select("first_name, last_name, slug")
    .eq("is_published", true);

  if (entrepreneurs) {
    entrepreneurs.forEach((e: any) => {
      // Ajouter le nom complet
      entities.push({
        name: `${e.first_name} ${e.last_name}`,
        slug: `/e/${e.slug}`,
        type: "entrepreneur",
      });
      // Ajouter aussi le nom seul si unique
      entities.push({
        name: e.last_name,
        slug: `/e/${e.slug}`,
        type: "entrepreneur",
      });
    });
  }

  // Ajouter les pays africains
  const countries = [
    { name: "Bénin", slug: "/pays/bj" },
    { name: "béninois", slug: "/pays/bj" },
    { name: "béninoise", slug: "/pays/bj" },
    { name: "Sénégal", slug: "/pays/sn" },
    { name: "sénégalais", slug: "/pays/sn" },
    { name: "Nigeria", slug: "/pays/ng" },
    { name: "nigérian", slug: "/pays/ng" },
    { name: "Côte d'Ivoire", slug: "/pays/ci" },
    { name: "ivoirien", slug: "/pays/ci" },
    { name: "Kenya", slug: "/pays/ke" },
    { name: "kenyan", slug: "/pays/ke" },
    { name: "Ghana", slug: "/pays/gh" },
    { name: "ghanéen", slug: "/pays/gh" },
    { name: "Rwanda", slug: "/pays/rw" },
    { name: "rwandais", slug: "/pays/rw" },
    { name: "Afrique du Sud", slug: "/pays/za" },
    { name: "sud-africain", slug: "/pays/za" },
    { name: "Maroc", slug: "/pays/ma" },
    { name: "marocain", slug: "/pays/ma" },
    { name: "Égypte", slug: "/pays/eg" },
    { name: "égyptien", slug: "/pays/eg" },
    { name: "Togo", slug: "/pays/tg" },
    { name: "togolais", slug: "/pays/tg" },
    { name: "Cameroun", slug: "/pays/cm" },
    { name: "camerounais", slug: "/pays/cm" },
  ];

  countries.forEach((c) => {
    entities.push({ ...c, type: "country" });
  });

  // Ajouter les secteurs
  const sectors = [
    { name: "fintech", slug: "/secteur/fintech" },
    { name: "Fintech", slug: "/secteur/fintech" },
    { name: "e-commerce", slug: "/secteur/ecommerce" },
    { name: "agritech", slug: "/secteur/agritech" },
    { name: "Agritech", slug: "/secteur/agritech" },
    { name: "healthtech", slug: "/secteur/healthtech" },
    { name: "edtech", slug: "/secteur/edtech" },
    { name: "Edtech", slug: "/secteur/edtech" },
    { name: "logistique", slug: "/secteur/logistique" },
    { name: "énergie", slug: "/secteur/energie" },
    { name: "intelligence artificielle", slug: "/secteur/ia" },
    { name: "IA", slug: "/secteur/ia" },
  ];

  sectors.forEach((s) => {
    entities.push({ ...s, type: "sector" });
  });

  // Ajouter les termes généraux
  const terms = [
    { name: "entrepreneur", slug: "/glossaire/entrepreneur" },
    { name: "startup", slug: "/glossaire/startup" },
    { name: "levée de fonds", slug: "/glossaire/levee-de-fonds" },
    { name: "incubateur", slug: "/glossaire/incubateur" },
    { name: "accélérateur", slug: "/glossaire/accelerateur" },
    { name: "capital-risque", slug: "/glossaire/capital-risque" },
    { name: "business angel", slug: "/glossaire/business-angel" },
    { name: "licorne", slug: "/glossaire/licorne" },
  ];

  terms.forEach((t) => {
    entities.push({ ...t, type: "term" });
  });

  // Trier par longueur décroissante pour matcher les termes les plus longs d'abord
  entities.sort((a, b) => b.name.length - a.name.length);

  entitiesCache = entities;
  return entities;
};

/**
 * Applique l'auto-linking à un texte HTML
 * Évite de créer des liens dans les liens existants
 */
export const applyAutoLinks = (html: string, entities: LinkableEntity[]): string => {
  if (!html) return html;

  let result = html;

  // Créer une map pour tracker les liens déjà créés (éviter les doublons)
  const linkedTerms = new Set<string>();

  for (const entity of entities) {
    // Éviter de créer un lien si le terme a déjà été linké
    if (linkedTerms.has(entity.name.toLowerCase())) continue;

    // Regex pour trouver le terme mais pas s'il est déjà dans un lien
    // On évite les matches dans les balises HTML et dans les href
    const regex = new RegExp(
      `(?<!<[^>]*|href=["'][^"']*|>)\\b(${escapeRegex(entity.name)})\\b(?![^<]*>|[^"']*["'])`,
      "gi"
    );

    // Vérifier si le terme existe dans le texte
    if (regex.test(result)) {
      // Réinitialiser le regex
      regex.lastIndex = 0;

      // Remplacer seulement la première occurrence
      let replaced = false;
      result = result.replace(regex, (match) => {
        if (replaced) return match; // Garder les occurrences suivantes sans lien
        replaced = true;
        linkedTerms.add(entity.name.toLowerCase());
        return `<a href="${entity.slug}" class="wiki-autolink" title="Voir la page ${entity.name}">${match}</a>`;
      });
    }
  }

  return result;
};

/**
 * Échappe les caractères spéciaux regex
 */
const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Version simplifiée pour le rendu côté client (sans Supabase)
 * Utilise une liste statique d'entités
 */
export const applyStaticAutoLinks = (html: string): string => {
  const staticEntities: LinkableEntity[] = [
    // Pays
    { name: "Bénin", slug: "/pays/bj", type: "country" },
    { name: "béninois", slug: "/pays/bj", type: "country" },
    { name: "béninoise", slug: "/pays/bj", type: "country" },
    { name: "Sénégal", slug: "/pays/sn", type: "country" },
    { name: "Nigeria", slug: "/pays/ng", type: "country" },
    { name: "Côte d'Ivoire", slug: "/pays/ci", type: "country" },
    { name: "Kenya", slug: "/pays/ke", type: "country" },
    { name: "Ghana", slug: "/pays/gh", type: "country" },
    { name: "Rwanda", slug: "/pays/rw", type: "country" },
    { name: "Afrique", slug: "/glossaire/afrique", type: "term" },
    { name: "africain", slug: "/glossaire/afrique", type: "term" },
    { name: "africaine", slug: "/glossaire/afrique", type: "term" },
    { name: "africains", slug: "/glossaire/afrique", type: "term" },
    // Secteurs
    { name: "intelligence artificielle", slug: "/secteur/ia", type: "sector" },
    { name: "fintech", slug: "/secteur/fintech", type: "sector" },
    { name: "Fintech", slug: "/secteur/fintech", type: "sector" },
    { name: "agritech", slug: "/secteur/agritech", type: "sector" },
    { name: "e-commerce", slug: "/secteur/ecommerce", type: "sector" },
    { name: "digitalisation", slug: "/secteur/digital", type: "sector" },
    // Termes
    { name: "entrepreneur", slug: "/glossaire/entrepreneur", type: "term" },
    { name: "entrepreneurs", slug: "/glossaire/entrepreneur", type: "term" },
    { name: "startup", slug: "/glossaire/startup", type: "term" },
    { name: "startups", slug: "/glossaire/startup", type: "term" },
  ];

  // Trier par longueur décroissante
  staticEntities.sort((a, b) => b.name.length - a.name.length);

  return applyAutoLinks(html, staticEntities);
};
