import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";

export const metadata = {
  title: "À propos - AfriWiki",
  description: "Découvrez AfriWiki, l'encyclopédie collaborative des entrepreneurs africains. Notre mission, notre équipe et nos valeurs.",
};

export default function AProposPage() {
  return (
    <>
      <Header />

      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">Accueil</Link>
          <span className="tab active">À propos</span>
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
            À propos d&apos;AfriWiki
          </h1>

          <div className="wiki-content">
            <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
              AfriWiki est une encyclopédie collaborative dédiée aux entrepreneurs africains, 
              fonctionnant sur le principe du wiki.
            </p>

            <h2>Notre mission</h2>
            <p>
              AfriWiki a pour mission de documenter et valoriser les parcours des entrepreneurs 
              qui façonnent l&apos;économie africaine. Nous croyons que chaque entrepreneur mérite 
              d&apos;être reconnu et que leur histoire peut inspirer les générations futures.
            </p>

            <h2>Nos valeurs</h2>
            <ul>
              <li><strong>Neutralité</strong> — Les informations sont présentées de manière factuelle et objective</li>
              <li><strong>Vérifiabilité</strong> — Chaque information doit être sourcée et vérifiable</li>
              <li><strong>Accessibilité</strong> — Le contenu est libre et accessible à tous</li>
              <li><strong>Collaboration</strong> — La communauté contribue à enrichir le contenu</li>
            </ul>

            <h2>Comment ça fonctionne ?</h2>
            <p>
              AfriWiki repose sur un système de contribution collaborative :
            </p>
            <ol>
              <li><strong>Création de profil</strong> — Les entrepreneurs créent leur page avec leurs informations</li>
              <li><strong>Vérification</strong> — Notre équipe vérifie l&apos;authenticité des informations</li>
              <li><strong>Publication</strong> — Une fois validé, le profil est publié et accessible</li>
              <li><strong>Amélioration continue</strong> — La communauté peut suggérer des améliorations</li>
            </ol>

            <h2>Niveaux de vérification</h2>
            <div className="content-box" style={{ marginBottom: "1.5rem" }}>
              <div className="content-box-body">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Niveau</th>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Badge</th>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Critères</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem" }}>Basique</td>
                      <td style={{ padding: "0.5rem" }}>🔵</td>
                      <td style={{ padding: "0.5rem" }}>Email vérifié</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem" }}>Vérifié</td>
                      <td style={{ padding: "0.5rem" }}>✓</td>
                      <td style={{ padding: "0.5rem" }}>Identité confirmée + 3 sources</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem" }}>Pro</td>
                      <td style={{ padding: "0.5rem" }}>⭐</td>
                      <td style={{ padding: "0.5rem" }}>KYC complet + entreprise vérifiée</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0.5rem" }}>Notable</td>
                      <td style={{ padding: "0.5rem" }}>👑</td>
                      <td style={{ padding: "0.5rem" }}>Notoriété établie + couverture média</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2>L&apos;équipe</h2>
            <p>
              AfriWiki est développé par une équipe passionnée d&apos;entrepreneurs et de 
              développeurs africains, avec le soutien de la communauté.
            </p>

            <h2>Contact</h2>
            <p>
              Pour toute question, suggestion ou partenariat :
            </p>
            <ul>
              <li>Email : <a href="mailto:contact@afriwiki.org">contact@afriwiki.org</a></li>
              <li>Twitter : <a href="https://twitter.com/afriwiki" target="_blank" rel="noopener noreferrer">@afriwiki</a></li>
            </ul>

            <div className="notice-box" style={{ marginTop: "2rem" }}>
              <strong>Rejoignez-nous !</strong> AfriWiki est un projet communautaire. 
              <Link href="/dashboard/creer"> Créez votre page</Link> ou 
              <Link href="#"> contribuez</Link> à enrichir l&apos;encyclopédie.
            </div>
          </div>
        </main>

        <Sidebar />
      </div>

      <Footer />
    </>
  );
}
