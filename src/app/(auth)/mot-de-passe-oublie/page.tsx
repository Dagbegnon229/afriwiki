"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { resetPassword } from "@/lib/supabase/auth";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <>
      <Header />

      {/* Tabs navigation */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/connexion" className="tab">
            Se connecter
          </Link>
          <Link href="/inscription" className="tab">
            Créer un compte
          </Link>
        </div>
        <div className="tabs-right">
          <Link href="#">Aide</Link>
        </div>
      </nav>

      <div className="main-container">
        <main className="content-wrapper">
          <div className="auth-container">
            <div className="auth-box">
              <div className="auth-header">
                <div className="globe-logo">🔐</div>
                <h1>Mot de passe oublié</h1>
                <p>
                  {success
                    ? "Vérifiez votre boîte mail"
                    : "Entrez votre email pour réinitialiser votre mot de passe"}
                </p>
              </div>

              {error && (
                <div
                  className="notice-box"
                  style={{
                    background: "#fee2e2",
                    borderColor: "#f87171",
                    marginBottom: "1rem",
                  }}
                >
                  <strong style={{ color: "#dc2626" }}>Erreur :</strong> {error}
                </div>
              )}

              {success ? (
                <div
                  className="notice-box"
                  style={{
                    background: "#dcfce7",
                    borderColor: "#4ade80",
                    marginBottom: "1rem",
                  }}
                >
                  <strong style={{ color: "#166534" }}>Email envoyé !</strong>
                  <p style={{ margin: "0.5rem 0 0", color: "#166534" }}>
                    Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                    Vérifiez votre boîte mail (et vos spams) et cliquez sur le lien pour
                    définir un nouveau mot de passe.
                  </p>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Adresse email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="wiki-btn wiki-btn-primary"
                    style={{ width: "100%", padding: "0.75rem" }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                  </button>
                </form>
              )}

              <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
                <p>
                  <Link href="/connexion">← Retour à la connexion</Link>
                </p>
              </div>
            </div>

            <div className="notice-box" style={{ marginTop: "1rem" }}>
              <strong>Note :</strong> Si vous n&apos;avez pas reçu l&apos;email après
              quelques minutes, vérifiez votre dossier spam ou{" "}
              <Link href="#">contactez le support</Link>.
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
