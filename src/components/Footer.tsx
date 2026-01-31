import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <Link href="/a-propos">À propos</Link>
        <Link href="/aide">Aide</Link>
        <Link href="/conditions">Conditions d&apos;utilisation</Link>
        <Link href="/confidentialite">Confidentialité</Link>
        <Link href="/recherche">Recherche</Link>
        <Link href="/dashboard">Tableau de bord</Link>
      </div>
      <p>
        Le contenu est disponible sous licence{" "}
        <Link href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr">
          CC BY-SA 4.0
        </Link>{" "}
        sauf mention contraire.
      </p>
      <p style={{ marginTop: "0.5rem" }}>AfriWiki® est une marque déposée.</p>
    </footer>
  );
};
