import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";

export const metadata = {
  title: "Politique de confidentialité - AfriWiki",
  description: "Comment AfriWiki collecte, utilise et protège vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <>
      <Header />

      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">Accueil</Link>
          <span className="tab active">Confidentialité</span>
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
            Politique de confidentialité
          </h1>

          <div className="wiki-content">
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              <em>Dernière mise à jour : Janvier 2026</em>
            </p>

            <p>
              Chez AfriWiki, nous prenons la protection de vos données personnelles très au sérieux. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
            </p>

            <h2>1. Données collectées</h2>
            <h3>Données de compte</h3>
            <ul>
              <li>Adresse email (obligatoire)</li>
              <li>Nom complet</li>
              <li>Mot de passe (chiffré)</li>
            </ul>

            <h3>Données de profil (optionnelles)</h3>
            <ul>
              <li>Photo de profil</li>
              <li>Biographie</li>
              <li>Parcours professionnel</li>
              <li>Entreprises fondées/dirigées</li>
              <li>Récompenses et distinctions</li>
              <li>Liens vers des sources</li>
            </ul>

            <h3>Données techniques</h3>
            <ul>
              <li>Adresse IP</li>
              <li>Type de navigateur</li>
              <li>Pages consultées</li>
              <li>Horodatage des visites</li>
            </ul>

            <h2>2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul>
              <li>Gérer votre compte et authentifier vos connexions</li>
              <li>Afficher votre profil public (si publié)</li>
              <li>Vous envoyer des notifications liées à votre compte</li>
              <li>Améliorer notre service et corriger les bugs</li>
              <li>Générer des statistiques anonymisées</li>
            </ul>

            <h2>3. Partage des données</h2>
            <p>
              <strong>Nous ne vendons jamais vos données personnelles.</strong>
            </p>
            <p>Vos données peuvent être partagées avec :</p>
            <ul>
              <li>
                <strong>Nos prestataires techniques</strong> — hébergement (Vercel, Supabase), 
                authentification, stockage
              </li>
              <li>
                <strong>Les autorités</strong> — si la loi l&apos;exige
              </li>
            </ul>

            <h2>4. Données publiques vs privées</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Donnée</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Visibilité</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.5rem" }}>Email</td>
                  <td style={{ padding: "0.5rem" }}>🔒 Privé</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.5rem" }}>Mot de passe</td>
                  <td style={{ padding: "0.5rem" }}>🔒 Privé (chiffré)</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.5rem" }}>Profil en brouillon</td>
                  <td style={{ padding: "0.5rem" }}>🔒 Privé (vous seul)</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.5rem" }}>Profil publié</td>
                  <td style={{ padding: "0.5rem" }}>🌍 Public</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.5rem" }}>Articles publiés</td>
                  <td style={{ padding: "0.5rem" }}>🌍 Public</td>
                </tr>
              </tbody>
            </table>

            <h2>5. Sécurité</h2>
            <p>Nous protégeons vos données par :</p>
            <ul>
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Hachage sécurisé des mots de passe (bcrypt)</li>
              <li>Authentification à deux facteurs (optionnelle)</li>
              <li>Accès restreint aux données sensibles</li>
              <li>Sauvegardes régulières et chiffrées</li>
            </ul>

            <h2>6. Vos droits</h2>
            <p>Conformément au RGPD et aux lois applicables, vous avez le droit de :</p>
            <ul>
              <li><strong>Accéder</strong> à vos données personnelles</li>
              <li><strong>Rectifier</strong> les informations inexactes</li>
              <li><strong>Supprimer</strong> votre compte et vos données</li>
              <li><strong>Exporter</strong> vos données dans un format portable</li>
              <li><strong>Vous opposer</strong> à certains traitements</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:privacy@afriwiki.org">privacy@afriwiki.org</a>.
            </p>

            <h2>7. Cookies</h2>
            <p>AfriWiki utilise des cookies pour :</p>
            <ul>
              <li><strong>Essentiels</strong> — Maintenir votre session de connexion</li>
              <li><strong>Préférences</strong> — Mémoriser vos choix (thème, langue)</li>
              <li><strong>Analytiques</strong> — Comprendre l&apos;utilisation du site (anonymisé)</li>
            </ul>
            <p>
              Vous pouvez gérer les cookies dans les paramètres de votre navigateur.
            </p>

            <h2>8. Conservation</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. 
              Après suppression du compte, les données sont effacées sous 30 jours, 
              sauf obligation légale de conservation.
            </p>

            <h2>9. Modifications</h2>
            <p>
              Cette politique peut être mise à jour. Les modifications significatives 
              vous seront notifiées par email.
            </p>

            <h2>10. Contact</h2>
            <p>
              Pour toute question sur cette politique :
              <br />
              <strong>Email :</strong>{" "}
              <a href="mailto:privacy@afriwiki.org">privacy@afriwiki.org</a>
            </p>

            <div className="notice-box" style={{ marginTop: "2rem" }}>
              <strong>Délégué à la protection des données :</strong>{" "}
              Pour les questions RGPD, contactez notre DPO à{" "}
              <a href="mailto:dpo@afriwiki.org">dpo@afriwiki.org</a>.
            </div>
          </div>
        </main>

        <Sidebar />
      </div>

      <Footer />
    </>
  );
}
