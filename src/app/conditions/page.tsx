import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";

export const metadata = {
  title: "Conditions d'utilisation - AfriWiki",
  description: "Conditions générales d'utilisation de la plateforme AfriWiki.",
};

export default function ConditionsPage() {
  return (
    <>
      <Header />

      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">Accueil</Link>
          <span className="tab active">Conditions d&apos;utilisation</span>
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
            Conditions générales d&apos;utilisation
          </h1>

          <div className="wiki-content">
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              <em>Dernière mise à jour : Janvier 2026</em>
            </p>

            <h2>1. Acceptation des conditions</h2>
            <p>
              En accédant et en utilisant AfriWiki, vous acceptez d&apos;être lié par les présentes 
              conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez 
              ne pas utiliser notre service.
            </p>

            <h2>2. Description du service</h2>
            <p>
              AfriWiki est une plateforme encyclopédique collaborative permettant de documenter 
              les parcours des entrepreneurs africains. Le service comprend :
            </p>
            <ul>
              <li>La création et la gestion de profils d&apos;entrepreneurs</li>
              <li>La rédaction d&apos;articles sur l&apos;écosystème entrepreneurial africain</li>
              <li>La vérification et la validation des informations</li>
              <li>La recherche et la consultation des profils</li>
            </ul>

            <h2>3. Inscription et compte</h2>
            <p>
              Pour contribuer à AfriWiki, vous devez créer un compte. Vous êtes responsable de :
            </p>
            <ul>
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de votre mot de passe</li>
              <li>Toute activité effectuée depuis votre compte</li>
            </ul>

            <h2>4. Règles de contribution</h2>
            <p>
              En contribuant à AfriWiki, vous vous engagez à :
            </p>
            <ul>
              <li><strong>Véracité</strong> — Publier uniquement des informations vraies et vérifiables</li>
              <li><strong>Neutralité</strong> — Adopter un ton encyclopédique et objectif</li>
              <li><strong>Respect</strong> — Ne pas publier de contenu diffamatoire, offensant ou illégal</li>
              <li><strong>Originalité</strong> — Ne pas copier de contenu protégé par le droit d&apos;auteur</li>
              <li><strong>Sources</strong> — Citer vos sources lorsque nécessaire</li>
            </ul>

            <h2>5. Propriété intellectuelle</h2>
            <p>
              Le contenu que vous publiez sur AfriWiki reste votre propriété. Cependant, 
              vous accordez à AfriWiki une licence non exclusive, mondiale et gratuite 
              pour utiliser, reproduire et afficher ce contenu dans le cadre du service.
            </p>
            <p>
              Le contenu encyclopédique est publié sous licence Creative Commons BY-SA 4.0, 
              permettant sa réutilisation avec attribution.
            </p>

            <h2>6. Modération</h2>
            <p>
              AfriWiki se réserve le droit de :
            </p>
            <ul>
              <li>Modifier ou supprimer tout contenu ne respectant pas ces conditions</li>
              <li>Suspendre ou supprimer les comptes en infraction</li>
              <li>Refuser la publication de profils non conformes</li>
            </ul>

            <h2>7. Confidentialité</h2>
            <p>
              Nous nous engageons à protéger vos données personnelles conformément à notre 
              <Link href="/confidentialite"> politique de confidentialité</Link>. 
              Les informations publiées sur les profils publics sont accessibles à tous.
            </p>

            <h2>8. Limitation de responsabilité</h2>
            <p>
              AfriWiki fournit une plateforme de publication mais n&apos;est pas responsable :
            </p>
            <ul>
              <li>De l&apos;exactitude des informations publiées par les utilisateurs</li>
              <li>Des dommages résultant de l&apos;utilisation du service</li>
              <li>Des interruptions temporaires du service</li>
            </ul>

            <h2>9. Modifications</h2>
            <p>
              AfriWiki peut modifier ces conditions à tout moment. Les utilisateurs seront 
              informés des modifications importantes. L&apos;utilisation continue du service 
              après modification vaut acceptation des nouvelles conditions.
            </p>

            <h2>10. Contact</h2>
            <p>
              Pour toute question concernant ces conditions :
              <br />
              Email : <a href="mailto:legal@afriwiki.org">legal@afriwiki.org</a>
            </p>

            <div className="notice-box" style={{ marginTop: "2rem" }}>
              <strong>Note :</strong> Ces conditions sont régies par le droit applicable 
              dans la juridiction d&apos;AfriWiki. Tout litige sera soumis aux tribunaux compétents.
            </div>
          </div>
        </main>

        <Sidebar />
      </div>

      <Footer />
    </>
  );
}
