import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";

export const metadata = {
  title: "Centre d'aide - AfriWiki",
  description: "Trouvez des réponses à vos questions sur l'utilisation d'AfriWiki.",
};

const faqItems = [
  {
    question: "Comment créer ma page entrepreneur ?",
    answer: `Pour créer votre page, connectez-vous à votre compte puis accédez à votre tableau de bord. 
    Cliquez sur "Créer ma page entrepreneur" et remplissez les informations demandées. 
    Votre page sera d'abord en mode brouillon avant publication.`,
  },
  {
    question: "Comment fonctionne la vérification ?",
    answer: `AfriWiki propose plusieurs niveaux de vérification :
    - Basique (email vérifié)
    - Vérifié (identité confirmée + 3 sources)
    - Pro (KYC complet + entreprise vérifiée)
    - Notable (notoriété établie + couverture média)`,
  },
  {
    question: "Puis-je modifier ma page après publication ?",
    answer: `Oui, vous pouvez modifier votre page à tout moment depuis votre tableau de bord. 
    Les modifications sont enregistrées immédiatement.`,
  },
  {
    question: "Comment ajouter des sources ?",
    answer: `Depuis votre tableau de bord, accédez à la section "Sources". 
    Ajoutez des liens vers des articles de presse, interviews ou autres publications 
    qui mentionnent votre activité. Nos modérateurs valideront les sources.`,
  },
  {
    question: "Ma page n'apparaît pas dans la recherche",
    answer: `Vérifiez que votre page est bien publiée (et non en mode brouillon). 
    Les nouvelles pages peuvent mettre quelques minutes à apparaître dans les résultats de recherche.`,
  },
  {
    question: "Comment signaler un contenu inapproprié ?",
    answer: `Sur chaque page, un bouton "Signaler" permet de nous alerter. 
    Décrivez le problème et notre équipe de modération interviendra rapidement.`,
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: `Contactez-nous à privacy@afriwiki.org pour demander la suppression de votre compte. 
    Notez que le contenu encyclopédique (articles) peut être conservé conformément à notre mission.`,
  },
  {
    question: "Les informations sont-elles publiques ?",
    answer: `Une fois publiée, votre page est visible par tous les visiteurs d'AfriWiki. 
    En mode brouillon, seul vous pouvez la voir. Vos informations de connexion (email) restent privées.`,
  },
];

export default function AidePage() {
  return (
    <>
      <Header />

      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">Accueil</Link>
          <span className="tab active">Aide</span>
        </div>
      </nav>

      <div className="main-container">
        <main className="content-wrapper">
          <h1 style={{ 
            fontSize: "1.75rem", 
            fontFamily: "'Libre Baskerville', Georgia, serif",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "0.5rem",
            marginBottom: "1.5rem"
          }}>
            Centre d&apos;aide
          </h1>

          {/* Quick links */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem",
            marginBottom: "2rem"
          }}>
            {[
              { icon: "📝", title: "Créer ma page", link: "/dashboard/creer" },
              { icon: "✏️", title: "Modifier mon profil", link: "/dashboard/editer" },
              { icon: "🔗", title: "Ajouter des sources", link: "/dashboard/sources" },
              { icon: "📰", title: "Écrire un article", link: "/dashboard/articles" },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.link}
                className="content-box"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1rem",
                  textDecoration: "none",
                  color: "var(--text-primary)",
                  transition: "background 0.2s",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.title}</span>
              </Link>
            ))}
          </div>

          <h2 style={{ 
            fontSize: "1.25rem", 
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "0.5rem",
            marginBottom: "1rem"
          }}>
            Questions fréquentes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="content-box"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <summary style={{
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  backgroundColor: "var(--background-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <span style={{ color: "var(--link-color)" }}>❓</span>
                  {item.question}
                </summary>
                <div style={{
                  padding: "1rem 1.25rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}>
                  {item.answer}
                </div>
              </details>
            ))}
          </div>

          {/* Contact section */}
          <div className="content-box" style={{ marginTop: "2rem" }}>
            <div className="content-box-header">
              <h2>Besoin d&apos;aide supplémentaire ?</h2>
            </div>
            <div className="content-box-body">
              <p>
                Si vous n&apos;avez pas trouvé la réponse à votre question, 
                n&apos;hésitez pas à nous contacter :
              </p>
              <ul style={{ marginTop: "1rem" }}>
                <li>
                  <strong>Support technique :</strong>{" "}
                  <a href="mailto:support@afriwiki.org">support@afriwiki.org</a>
                </li>
                <li>
                  <strong>Questions générales :</strong>{" "}
                  <a href="mailto:contact@afriwiki.org">contact@afriwiki.org</a>
                </li>
                <li>
                  <strong>Signaler un problème :</strong>{" "}
                  <a href="mailto:moderation@afriwiki.org">moderation@afriwiki.org</a>
                </li>
              </ul>
              <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Nous nous efforçons de répondre sous 24-48 heures.
              </p>
            </div>
          </div>

          {/* Guides */}
          <div className="content-box" style={{ marginTop: "1.5rem" }}>
            <div className="content-box-header">
              <h2>Guides et tutoriels</h2>
            </div>
            <div className="content-box-body">
              <div className="categories-list">
                <div className="category-item">
                  <span className="category-icon">📖</span>
                  <Link href="#">Guide de démarrage</Link>
                </div>
                <div className="category-item">
                  <span className="category-icon">✍️</span>
                  <Link href="#">Comment rédiger sa biographie</Link>
                </div>
                <div className="category-item">
                  <span className="category-icon">📸</span>
                  <Link href="#">Optimiser sa photo de profil</Link>
                </div>
                <div className="category-item">
                  <span className="category-icon">🔍</span>
                  <Link href="#">Améliorer sa visibilité</Link>
                </div>
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
