"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />

      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/" className="tab">
            Accueil
          </Link>
        </div>
        <div className="tabs-right">
          <Link href="#">Aide</Link>
        </div>
      </nav>

      <div className="main-container">
        <main className="content-wrapper" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          {/* Globe with question mark */}
          <div className="welcome-globe" style={{ width: "120px", height: "120px", margin: "0 auto 1.5rem", fontSize: "3rem" }}>
            🤔
          </div>

          <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem", border: "none" }}>
            Page non trouvée
          </h1>

          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
            Peut-être cherchiez-vous un entrepreneur qui n&apos;a pas encore de page ?
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <Link href="/" className="wiki-btn wiki-btn-primary">
              Retour à l&apos;accueil
            </Link>
          </div>

          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            ou{" "}
            <Link href="/recherche">effectuez une recherche</Link>
          </p>

          {/* Suggestions */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-light)" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Liens utiles :
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", fontSize: "0.9rem" }}>
              <Link href="/pays">Explorer par pays</Link>
              <Link href="/secteurs">Secteurs d&apos;activité</Link>
              <Link href="/inscription">Créer une page</Link>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
