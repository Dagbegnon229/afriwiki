"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UserData {
  email: string;
  full_name: string;
  created_at: string;
}

export default function ParametresPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/connexion");
        return;
      }

      setUser({
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || "",
        created_at: authUser.created_at,
      });
      
      setFormData((prev) => ({
        ...prev,
        full_name: authUser.user_metadata?.full_name || "",
      }));
      
      setLoading(false);
    };

    getUser();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.full_name },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
        setUser((prev) => prev ? { ...prev, full_name: formData.full_name } : null);
      }
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (formData.new_password !== formData.confirm_password) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      setSaving(false);
      return;
    }

    if (formData.new_password.length < 8) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.new_password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Mot de passe mis à jour avec succès !" });
        setFormData((prev) => ({
          ...prev,
          new_password: "",
          confirm_password: "",
        }));
      }
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
    );

    if (!confirmed) return;

    alert("La suppression de compte sera disponible prochainement. Contactez-nous pour toute demande.");
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h1>Paramètres du compte</h1>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Informations personnelles */}
      <section className="settings-section">
        <h2>Informations personnelles</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="settings-form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              value={user?.email || ""}
              disabled
              className="settings-input-disabled"
            />
            <span className="settings-help">
              L&apos;adresse email ne peut pas être modifiée.
            </span>
          </div>

          <div className="settings-form-group">
            <label htmlFor="full_name">Nom complet</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Votre nom complet"
            />
          </div>

          <button type="submit" disabled={saving} className="settings-btn-primary">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </section>

      {/* Sécurité */}
      <section className="settings-section">
        <h2>Sécurité</h2>
        <form onSubmit={handleUpdatePassword}>
          <div className="settings-form-group">
            <label htmlFor="new_password">Nouveau mot de passe</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              placeholder="Minimum 8 caractères"
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="confirm_password">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Retapez le mot de passe"
            />
          </div>

          <button 
            type="submit" 
            disabled={saving || !formData.new_password}
            className="settings-btn-primary"
          >
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </section>

      {/* Informations du compte */}
      <section className="settings-section">
        <h2>Informations du compte</h2>
        <div className="settings-info-table">
          <div className="settings-info-row">
            <span className="settings-info-label">Membre depuis</span>
            <span className="settings-info-value">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Statut du compte</span>
            <span className="settings-info-value">
              <span className="settings-badge-active">Actif</span>
            </span>
          </div>
        </div>
      </section>

      {/* Zone de danger */}
      <section className="settings-section settings-danger">
        <h2>Zone de danger</h2>
        <p>
          La suppression de votre compte est définitive. Toutes vos données,
          y compris votre page entrepreneur, seront supprimées.
        </p>
        <button onClick={handleDeleteAccount} className="settings-btn-danger">
          Supprimer mon compte
        </button>
      </section>

      <style jsx>{`
        .settings-container {
          max-width: 600px;
        }

        .settings-container h1 {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 1.5rem;
          font-weight: normal;
          margin: 0 0 1.5rem 0;
        }

        .settings-message {
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .settings-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .settings-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .settings-section {
          background: var(--background);
          border: 1px solid var(--border-light);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .settings-section h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-light);
        }

        .settings-form-group {
          margin-bottom: 1.25rem;
        }

        .settings-form-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .settings-form-group input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--border-color);
          background: var(--background);
          font-size: 1rem;
          box-sizing: border-box;
        }

        .settings-form-group input:focus {
          outline: none;
          border-color: var(--link-color);
          box-shadow: 0 0 0 2px rgba(51, 102, 204, 0.1);
        }

        .settings-input-disabled {
          background: var(--background-secondary) !important;
          cursor: not-allowed;
          color: var(--text-secondary);
        }

        .settings-help {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .settings-btn-primary {
          background: var(--link-color);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          cursor: pointer;
          font-size: 0.95rem;
        }

        .settings-btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .settings-info-table {
          border: 1px solid var(--border-light);
        }

        .settings-info-row {
          display: flex;
          border-bottom: 1px solid var(--border-light);
        }

        .settings-info-row:last-child {
          border-bottom: none;
        }

        .settings-info-label {
          flex: 0 0 150px;
          padding: 0.75rem 1rem;
          background: var(--background-secondary);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .settings-info-value {
          flex: 1;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }

        .settings-badge-active {
          display: inline-block;
          background: #d4edda;
          color: #155724;
          padding: 0.2rem 0.5rem;
          font-size: 0.85rem;
        }

        .settings-danger {
          background: #fff5f5;
          border-color: #feb2b2;
        }

        .settings-danger h2 {
          color: #c53030;
        }

        .settings-danger p {
          color: #742a2a;
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
        }

        .settings-btn-danger {
          background: #c53030;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          cursor: pointer;
          font-size: 0.95rem;
        }

        .settings-btn-danger:hover {
          background: #9b2c2c;
        }

        @media (max-width: 500px) {
          .settings-info-row {
            flex-direction: column;
          }

          .settings-info-label {
            flex: auto;
          }
        }
      `}</style>
    </div>
  );
}
