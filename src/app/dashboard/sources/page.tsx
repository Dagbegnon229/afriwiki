"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Source {
  id: string;
  type: "article" | "website" | "social" | "document";
  title: string;
  url: string;
  status: "pending" | "validated" | "rejected";
  submitted_at: string;
  validated_at?: string;
  rejection_reason?: string;
}

interface Entrepreneur {
  id: string;
  verification_level: number;
}

export default function SourcesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({ type: "article", title: "", url: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      // Récupérer l'entrepreneur
      const { data: entrepreneurData } = await supabase
        .from("entrepreneurs")
        .select("id, verification_level")
        .eq("user_id", user.id)
        .single();

      if (!entrepreneurData) {
        router.push("/dashboard/creer");
        return;
      }

      const entData = entrepreneurData as Entrepreneur;
      setEntrepreneur(entData);

      // Récupérer les sources
      const { data: sourcesData } = await supabase
        .from("sources")
        .select("*")
        .eq("entrepreneur_id", entData.id)
        .order("submitted_at", { ascending: false });

      if (sourcesData) {
        setSources(sourcesData as Source[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  const verificationLevels = [
    {
      level: 1,
      name: "Basique",
      icon: "🔵",
      description: "Email vérifié",
      requirements: ["Email confirmé"],
    },
    {
      level: 2,
      name: "Vérifié",
      icon: "✓",
      description: "Identité confirmée",
      requirements: ["Numéro de téléphone vérifié", "Document d'identité validé"],
    },
    {
      level: 3,
      name: "Pro",
      icon: "⭐",
      description: "Entreprise vérifiée",
      requirements: ["Niveau 2 obtenu", "Extrait de registre du commerce"],
    },
    {
      level: 4,
      name: "Notable",
      icon: "👑",
      description: "Notoriété établie",
      requirements: ["Niveau 3 obtenu", "Au moins 5 sources médias validées", "Validation éditoriale"],
    },
  ];

  const sourceTypes = [
    { value: "article", label: "Article de presse", icon: "📰" },
    { value: "website", label: "Site web officiel", icon: "🌐" },
    { value: "social", label: "Profil LinkedIn", icon: "💼" },
    { value: "document", label: "Document officiel", icon: "📄" },
  ];

  const getStatusBadge = (status: Source["status"]) => {
    switch (status) {
      case "validated":
        return <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem", background: "#d4edda", color: "#155724", whiteSpace: "nowrap" }}>✓ Validée</span>;
      case "pending":
        return <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem", background: "#fff3cd", color: "#856404", whiteSpace: "nowrap" }}>⏳ En attente</span>;
      case "rejected":
        return <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem", background: "#f8d7da", color: "#721c24", whiteSpace: "nowrap" }}>✗ Refusée</span>;
    }
  };

  const getLevelStatus = (level: number) => {
    if (!entrepreneur) return "locked";
    if (level <= entrepreneur.verification_level) return "completed";
    if (level === entrepreneur.verification_level + 1) return "available";
    return "locked";
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrepreneur) return;

    setSaving(true);
    setMessage(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("sources").insert({
      entrepreneur_id: entrepreneur.id,
      type: newSource.type,
      title: newSource.title,
      url: newSource.url,
      status: "pending",
    });

    if (error) {
      console.error("Erreur ajout source:", error);
      setMessage({ type: "error", text: "Erreur lors de l'ajout de la source" });
    } else {
      // Recharger les sources
      const { data } = await supabase
        .from("sources")
        .select("*")
        .eq("entrepreneur_id", entrepreneur.id)
        .order("submitted_at", { ascending: false });

      if (data) setSources(data as Source[]);
      
      setMessage({ type: "success", text: "Source soumise ! Elle sera validée sous 24-72h." });
      setShowAddForm(false);
      setNewSource({ type: "article", title: "", url: "" });
    }

    setSaving(false);
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("Supprimer cette source ?")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("sources").delete().eq("id", id);

    if (!error) {
      setSources(sources.filter((s) => s.id !== id));
    }
  };

  const validatedCount = sources.filter((s) => s.status === "validated").length;
  const pendingCount = sources.filter((s) => s.status === "pending").length;

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.5rem", fontWeight: "normal", margin: "0 0 0.5rem 0" }}>
        Sources & Vérification
      </h1>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 2rem 0" }}>
        Ajoutez des sources vérifiables pour augmenter la crédibilité de votre page
        et progresser dans les niveaux de vérification.
      </p>

      {/* Message */}
      {message && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          background: message.type === "success" ? "#dcfce7" : "#fee2e2",
          color: message.type === "success" ? "#166534" : "#991b1b",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Niveaux de vérification */}
      <section style={{ background: "var(--background)", border: "1px solid var(--border-light)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-light)" }}>
          Niveau de vérification actuel
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {verificationLevels.map((level) => {
            const status = getLevelStatus(level.level);
            return (
              <div
                key={level.level}
                style={{
                  padding: "1rem",
                  border: "1px solid var(--border-light)",
                  borderLeft: status === "completed" ? "4px solid #00a550" : status === "available" ? "4px solid var(--link-color)" : "4px solid #d1d5db",
                  background: status === "completed" ? "#f8fff8" : status === "locked" ? "var(--background-secondary)" : "var(--background)",
                  opacity: status === "locked" ? 0.7 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>{level.icon}</span>
                  <span style={{ fontWeight: 600 }}>Niveau {level.level} — {level.name}</span>
                  {status === "completed" && (
                    <span style={{ marginLeft: "auto", background: "#d4edda", color: "#155724", padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}>
                      ✓ Obtenu
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>
                  {level.description}
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
                  {level.requirements.map((req, i) => (
                    <li key={i} style={{ marginBottom: "0.25rem" }}>
                      {status === "completed" ? "✓" : "○"} {req}
                    </li>
                  ))}
                </ul>
                {status === "available" && (
                  <button style={{ marginTop: "1rem", background: "var(--link-color)", color: "white", border: "none", padding: "0.6rem 1rem", cursor: "pointer", fontSize: "0.9rem" }}>
                    Commencer la vérification →
                  </button>
                )}
                {status === "locked" && (
                  <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    🔒 Complétez le niveau {level.level - 1} pour débloquer
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sources */}
      <section style={{ background: "var(--background)", border: "1px solid var(--border-light)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0" }}>Mes sources</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
              <span style={{ color: "#00a550", fontWeight: 600 }}>{validatedCount} validée{validatedCount > 1 ? "s" : ""}</span>
              {pendingCount > 0 && <> · <span style={{ color: "#856404" }}>{pendingCount} en attente</span></>}
              {" "}sur {sources.length} soumise{sources.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ background: "var(--link-color)", color: "white", border: "none", padding: "0.6rem 1rem", cursor: "pointer", fontSize: "0.9rem" }}
          >
            + Ajouter une source
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <form onSubmit={handleAddSource} style={{ background: "#f8f9fa", border: "1px solid var(--border-light)", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Nouvelle source</h3>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Type de source</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {sourceTypes.map((type) => (
                  <label
                    key={type.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      border: newSource.type === type.value ? "2px solid var(--link-color)" : "1px solid var(--border-light)",
                      cursor: "pointer",
                      background: newSource.type === type.value ? "#e6f2ff" : "var(--background)",
                    }}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={newSource.type === type.value}
                      onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                      style={{ display: "none" }}
                    />
                    <span style={{ fontSize: "1.2rem" }}>{type.icon}</span>
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Titre / Description</label>
              <input
                type="text"
                value={newSource.title}
                onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                placeholder="Ex: Article Jeune Afrique - Interview 2025"
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid var(--border-color)", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>URL de la source</label>
              <input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="https://..."
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid var(--border-color)", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{ background: "none", border: "1px solid var(--border-color)", padding: "0.6rem 1rem", cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ background: "var(--link-color)", color: "white", border: "none", padding: "0.6rem 1rem", cursor: "pointer" }}
              >
                {saving ? "..." : "Soumettre la source"}
              </button>
            </div>
          </form>
        )}

        {/* Liste des sources */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sources.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", background: "var(--background-secondary)", color: "var(--text-secondary)" }}>
              <p style={{ margin: "0.5rem 0" }}>Vous n&apos;avez pas encore ajouté de sources.</p>
              <p style={{ margin: "0.5rem 0" }}>Les sources permettent de prouver l&apos;authenticité des informations de votre page.</p>
            </div>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1rem",
                  border: "1px solid var(--border-light)",
                  borderLeft: source.status === "validated" ? "4px solid #00a550" : source.status === "pending" ? "4px solid #ffc107" : "4px solid #dc3545",
                  background: source.status === "rejected" ? "#fff5f5" : "var(--background)",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                  {sourceTypes.find((t) => t.value === source.type)?.icon || "🔗"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>{source.title}</h4>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.85rem", color: "var(--link-color)", wordBreak: "break-all" }}
                  >
                    {source.url}
                  </a>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
                    Soumise le {new Date(source.submitted_at).toLocaleDateString("fr-FR")}
                    {source.validated_at && (
                      <> · Validée le {new Date(source.validated_at).toLocaleDateString("fr-FR")}</>
                    )}
                  </p>
                  {source.rejection_reason && (
                    <p style={{ fontSize: "0.85rem", color: "#dc3545", margin: "0.5rem 0 0" }}>
                      Motif : {source.rejection_reason}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                  {getStatusBadge(source.status)}
                  {source.status === "pending" && (
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      style={{ fontSize: "0.8rem", color: "#dc3545", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Règles de validation */}
      <section style={{ background: "var(--background)", border: "1px solid var(--border-light)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-light)" }}>
          Règles de validation
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "#f0fff4", border: "1px solid #c6f6d5" }}>
            <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>✓ Sources acceptées</h4>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <li>Articles de presse (Forbes, Jeune Afrique, BBC Afrique...)</li>
              <li>Site web officiel de votre entreprise</li>
              <li>Registre du commerce (lien officiel)</li>
              <li>Profil LinkedIn vérifié</li>
              <li>Interviews vidéo sur médias reconnus</li>
            </ul>
          </div>
          <div style={{ padding: "1rem", background: "#fff5f5", border: "1px solid #fed7d7" }}>
            <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>✗ Sources refusées</h4>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <li>Réseaux sociaux personnels (Facebook, Instagram)</li>
              <li>Articles auto-publiés</li>
              <li>Communiqués de presse non relayés</li>
              <li>Sites web sans mentions légales</li>
              <li>Liens brisés ou pages inaccessibles</li>
            </ul>
          </div>
        </div>
        <p style={{ margin: "1rem 0 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          <strong>Délai de validation :</strong> 24-72 heures. Vous recevrez une notification par email.
        </p>
      </section>

      <div style={{ marginTop: "1rem" }}>
        <Link href="/dashboard" style={{ color: "var(--link-color)" }}>← Retour au tableau de bord</Link>
      </div>
    </div>
  );
}
