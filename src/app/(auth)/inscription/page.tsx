"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { signUp, signInWithOAuth } from "@/lib/supabase/auth";

export default function InscriptionPage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [success, setSuccess] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms =
        "Vous devez accepter les conditions d'utilisation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const fullName = `${formData.firstName} ${formData.lastName}`;
    const result = await signUp(formData.email, formData.password, fullName);

    if (result.error) {
      setErrors({ form: result.error.message });
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: "google" | "linkedin_oidc") => {
    setErrors({});
    const result = await signInWithOAuth(provider);
    if (result.error) {
      setErrors({ form: result.error.message });
    }
  };

  if (success) {
    return (
      <>
        <Header />

        <nav className="tabs-nav">
          <div className="tabs-left">
            <Link href="/connexion" className="tab">
              Se connecter
            </Link>
            <Link href="/inscription" className="tab active">
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
              <div className="auth-box" style={{ textAlign: "center" }}>
                <div
                  className="globe-logo"
                  style={{
                    width: "80px",
                    height: "80px",
                    margin: "0 auto 1rem",
                    fontSize: "2.5rem",
                  }}
                >
                  ✉️
                </div>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                  Vérifiez votre email
                </h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  Nous avons envoyé un lien de confirmation à{" "}
                  <strong>{formData.email}</strong>.
                </p>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Cliquez sur le lien dans l&apos;email pour activer votre
                  compte, puis vous pourrez vous connecter.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <Link href="/connexion" className="wiki-btn wiki-btn-primary">
                    Aller à la connexion
                  </Link>
                </div>
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

      {/* Tabs navigation */}
      <nav className="tabs-nav">
        <div className="tabs-left">
          <Link href="/connexion" className="tab">
            Se connecter
          </Link>
          <Link href="/inscription" className="tab active">
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
                <div className="globe-logo">🌍</div>
                <h1>Créer un compte</h1>
                <p>Rejoignez la communauté AfriWiki</p>
              </div>

              {errors.form && (
                <div
                  className="notice-box"
                  style={{
                    background: "#fee2e2",
                    borderColor: "#f87171",
                    marginBottom: "1rem",
                  }}
                >
                  <strong style={{ color: "#dc2626" }}>Erreur :</strong>{" "}
                  {errors.form}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="firstName">Prénom</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Votre prénom"
                      autoComplete="given-name"
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <span className="form-error">{errors.firstName}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Nom</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      autoComplete="family-name"
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <span className="form-error">{errors.lastName}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Adresse email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <span className="form-error">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Mot de passe</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 caractères"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <span className="form-error">{errors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Répétez votre mot de passe"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <span className="form-error">{errors.confirmPassword}</span>
                  )}
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <label htmlFor="acceptTerms">
                    J&apos;accepte les{" "}
                    <Link href="/conditions">conditions d&apos;utilisation</Link>{" "}
                    et la{" "}
                    <Link href="/confidentialite">
                      politique de confidentialité
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <span className="form-error">{errors.acceptTerms}</span>
                )}

                <button
                  type="submit"
                  className="wiki-btn wiki-btn-primary"
                  style={{ width: "100%", padding: "0.75rem" }}
                  disabled={isLoading}
                >
                  {isLoading ? "Création en cours..." : "Créer mon compte"}
                </button>
              </form>

              <div className="auth-divider">ou s&apos;inscrire avec</div>

              <div className="oauth-buttons">
                <button
                  type="button"
                  className="oauth-btn"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="oauth-btn"
                  onClick={() => handleOAuthSignIn("linkedin_oidc")}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>
              </div>

              <div className="auth-footer">
                <p>
                  Déjà un compte ? <Link href="/connexion">Se connecter</Link>
                </p>
              </div>
            </div>

            <div className="notice-box" style={{ marginTop: "1rem" }}>
              <strong>Pourquoi créer un compte ?</strong> Un compte vous permet
              de créer votre page entrepreneur, de contribuer à
              l&apos;encyclopédie et de faire partie de la communauté AfriWiki.
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
