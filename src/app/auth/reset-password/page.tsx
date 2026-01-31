"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePassword } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier que l'utilisateur a bien un token de réinitialisation
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    const result = await updatePassword(password);

    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);

    // Rediriger vers le dashboard après 3 secondes
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  };

  // Affichage pendant la vérification
  if (isValidSession === null) {
    return (
      <>
        <Header />
        <div className="main-container">
          <main className="content-wrapper">
            <div className="auth-container">
              <div className="auth-box" style={{ textAlign: "center", padding: "3rem" }}>
                <p>Vérification en cours...</p>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // Lien invalide ou expiré
  if (!isValidSession) {
    return (
      <>
        <Header />
        <div className="main-container">
          <main className="content-wrapper">
            <div className="auth-container">
              <div className="auth-box">
                <div className="auth-header">
                  <div className="globe-logo">⚠️</div>
                  <h1>Lien invalide ou expiré</h1>
                </div>
                <div
                  className="notice-box"
                  style={{
                    background: "#fef3c7",
                    borderColor: "#f59e0b",
                    marginBottom: "1rem",
                  }}
                >
                  <p style={{ margin: 0, color: "#92400e" }}>
                    Ce lien de réinitialisation n&apos;est plus valide. Les liens expirent
                    après 24 heures pour des raisons de sécurité.
                  </p>
                </div>
                <Link
                  href="/mot-de-passe-oublie"
                  className="wiki-btn wiki-btn-primary"
                  style={{ display: "block", textAlign: "center", padding: "0.75rem" }}
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <nav className="tabs-nav">
        <div className="tabs-left">
          <span className="tab active">Nouveau mot de passe</span>
        </div>
      </nav>

      <div className="main-container">
        <main className="content-wrapper">
          <div className="auth-container">
            <div className="auth-box">
              <div className="auth-header">
                <div className="globe-logo">🔑</div>
                <h1>Nouveau mot de passe</h1>
                <p>
                  {success
                    ? "Mot de passe mis à jour avec succès"
                    : "Choisissez un nouveau mot de passe sécurisé"}
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
                  <strong style={{ color: "#166534" }}>✓ Mot de passe modifié !</strong>
                  <p style={{ margin: "0.5rem 0 0", color: "#166534" }}>
                    Votre mot de passe a été mis à jour. Vous allez être redirigé vers
                    votre tableau de bord...
                  </p>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="password">Nouveau mot de passe</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="wiki-btn wiki-btn-primary"
                    style={{ width: "100%", padding: "0.75rem" }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Mise à jour..." : "Définir le nouveau mot de passe"}
                  </button>
                </form>
              )}

              <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
                <p>
                  <Link href="/connexion">← Retour à la connexion</Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
