"use client";

import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="auth-container">
      <div className="auth-box" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
        
        <h1>Erreur d&apos;authentification</h1>
        
        <p style={{ marginBottom: "1.5rem" }}>
          Le lien de confirmation a expiré ou est invalide.
          <br />
          Si vous avez déjà confirmé votre email, vous pouvez vous connecter.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link
            href="/connexion"
            style={{
              display: "block",
              background: "var(--link-color)",
              color: "white",
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Se connecter
          </Link>
          
          <Link
            href="/inscription"
            style={{
              display: "block",
              border: "1px solid var(--border-color)",
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              textAlign: "center",
              color: "var(--text-primary)",
            }}
          >
            Créer un nouveau compte
          </Link>
        </div>
      </div>
    </div>
  );
}
