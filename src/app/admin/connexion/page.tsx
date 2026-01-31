"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "linkpehoundagbegnon@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Vérifier que c'est l'email admin
    if (email !== ADMIN_EMAIL) {
      setError("Accès non autorisé. Seul l'administrateur peut se connecter ici.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "2rem",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛡️</div>
          <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", margin: "0 0 0.5rem 0", fontWeight: 600 }}>
            Administration AfriWiki
          </h1>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.9rem" }}>
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "4px",
            color: "#fca5a5",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              Email administrateur
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@afriwiki.com"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "#374151",
                border: "1px solid #4b5563",
                borderRadius: "4px",
                color: "#f9fafb",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "#374151",
                border: "1px solid #4b5563",
                borderRadius: "4px",
                color: "#f9fafb",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <a href="/" style={{ color: "#60a5fa", fontSize: "0.9rem", textDecoration: "none" }}>
            ← Retour au site
          </a>
        </div>
      </div>
    </div>
  );
}
