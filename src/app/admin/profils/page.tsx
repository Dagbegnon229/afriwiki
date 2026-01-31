"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Entrepreneur {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  country: string | null;
  verification_level: number;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

export default function AdminProfilesPage() {
  const supabase = createClient();
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Entrepreneur | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ first_name: "", last_name: "", headline: "", country: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEntrepreneurs();
  }, []);

  const fetchEntrepreneurs = async () => {
    const { data } = await supabase
      .from("entrepreneurs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setEntrepreneurs(data as Entrepreneur[]);
    setLoading(false);
  };

  const handleSelectProfile = (profile: Entrepreneur) => {
    setSelectedProfile(profile);
    setEditData({
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline || "",
      country: profile.country || "",
    });
    setEditMode(false);
    setRejectionReason("");
  };

  const handleTogglePublish = async (id: string, isPublished: boolean, withReason = false) => {
    let updateData: Record<string, unknown> = { is_published: !isPublished };

    if (!isPublished) {
      // Publishing
      updateData = { ...updateData };
    } else if (withReason && rejectionReason) {
      // Unpublishing with reason - log the action
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("admin_activity_logs")
        .insert({
          action_type: "profile_unpublished",
          action_category: "profile_validation",
          target_type: "entrepreneur",
          target_id: id,
          target_name: `${selectedProfile?.first_name} ${selectedProfile?.last_name}`,
          details: { reason: rejectionReason },
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("entrepreneurs")
      .update(updateData)
      .eq("id", id);

    if (!error) {
      setEntrepreneurs(entrepreneurs.map((e) =>
        e.id === id ? { ...e, is_published: !isPublished } : e
      ));
      if (selectedProfile?.id === id) {
        setSelectedProfile({ ...selectedProfile, is_published: !isPublished });
      }
      setMessage({ type: "success", text: isPublished ? "Profil dépublié" : "Profil publié !" });
      setRejectionReason("");
    } else {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProfile) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("entrepreneurs")
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        headline: editData.headline || null,
        country: editData.country || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedProfile.id);

    if (!error) {
      setEntrepreneurs(entrepreneurs.map((e) =>
        e.id === selectedProfile.id
          ? { ...e, ...editData, headline: editData.headline || null, country: editData.country || null }
          : e
      ));
      setSelectedProfile({
        ...selectedProfile,
        ...editData,
        headline: editData.headline || null,
        country: editData.country || null,
      });
      setEditMode(false);
      setMessage({ type: "success", text: "Profil modifié !" });
    } else {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    }
  };

  const handleUpdateVerification = async (id: string, level: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("entrepreneurs")
      .update({ verification_level: level })
      .eq("id", id);

    if (!error) {
      setEntrepreneurs(entrepreneurs.map((e) =>
        e.id === id ? { ...e, verification_level: level } : e
      ));
      if (selectedProfile?.id === id) {
        setSelectedProfile({ ...selectedProfile, verification_level: level });
      }
      setMessage({ type: "success", text: `Badge ${getVerificationInfo(level).name} attribué` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Supprimer définitivement ce profil et toutes ses données ? Cette action est irréversible.")) return;

    // Delete related data first
    await supabase.from("parcours").delete().eq("entrepreneur_id", id);
    await supabase.from("entreprises").delete().eq("entrepreneur_id", id);
    await supabase.from("recompenses").delete().eq("entrepreneur_id", id);
    await supabase.from("sources").delete().eq("entrepreneur_id", id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("entrepreneurs").delete().eq("id", id);
    if (!error) {
      setEntrepreneurs(entrepreneurs.filter((e) => e.id !== id));
      setSelectedProfile(null);
      setMessage({ type: "success", text: "Profil supprimé" });
    }
  };

  const getVerificationInfo = (level: number) => {
    const info: Record<number, { icon: string; name: string; color: string }> = {
      1: { icon: "🔵", name: "Basique", color: "#60a5fa" },
      2: { icon: "✓", name: "Vérifié", color: "#4ade80" },
      3: { icon: "⭐", name: "Pro", color: "#fbbf24" },
      4: { icon: "👑", name: "Notable", color: "#a78bfa" },
    };
    return info[level] || info[1];
  };

  const pendingCount = entrepreneurs.filter((e) => !e.is_published).length;
  const verifiedCount = entrepreneurs.filter((e) => e.verification_level >= 2).length;

  const filteredEntrepreneurs = entrepreneurs.filter((e) => {
    if (filter === "published" && !e.is_published) return false;
    if (filter === "draft" && e.is_published) return false;
    if (filter === "verified" && e.verification_level < 2) return false;
    if (searchQuery) {
      const name = `${e.first_name} ${e.last_name} ${e.country || ""}`.toLowerCase();
      if (!name.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          ✅ Validation des profils entrepreneurs
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          {entrepreneurs.length} profils • {entrepreneurs.filter((e) => e.is_published).length} publiés • {pendingCount} en attente • {verifiedCount} vérifiés
        </p>
      </div>

      {message && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: `1px solid ${message.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          borderRadius: "4px",
          color: message.type === "success" ? "#4ade80" : "#f87171",
        }}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Rechercher par nom ou pays..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            color: "#f9fafb",
            minWidth: "250px",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { value: "all", label: "Tous" },
            { value: "draft", label: `En attente (${pendingCount})` },
            { value: "published", label: "Publiés" },
            { value: "verified", label: "Vérifiés" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "0.6rem 1rem",
                background: filter === f.value ? "#3b82f6" : "#374151",
                color: filter === f.value ? "white" : "#d1d5db",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        {/* Profiles List */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}>
            {filteredEntrepreneurs.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                Aucun profil trouvé
              </div>
            ) : (
              filteredEntrepreneurs.map((entrepreneur) => {
                const info = getVerificationInfo(entrepreneur.verification_level);
                return (
                  <div
                    key={entrepreneur.id}
                    onClick={() => handleSelectProfile(entrepreneur)}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #374151",
                      cursor: "pointer",
                      background: selectedProfile?.id === entrepreneur.id ? "#374151" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {entrepreneur.photo_url ? (
                        <img
                          src={entrepreneur.photo_url}
                          alt=""
                          style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "50%",
                          background: "#374151",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          👤
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {entrepreneur.first_name} {entrepreneur.last_name}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                          {entrepreneur.headline || "Entrepreneur"}
                          {entrepreneur.country && ` • ${entrepreneur.country}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: info.color }}>{info.icon}</span>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          background: entrepreneur.is_published ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                          color: entrepreneur.is_published ? "#4ade80" : "#fb923c",
                        }}>
                          {entrepreneur.is_published ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Profile Details Panel */}
        {selectedProfile && (
          <div style={{
            width: "420px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "1.5rem",
            position: "sticky",
            top: "1rem",
            maxHeight: "calc(100vh - 6rem)",
            overflowY: "auto",
          }}>
            {editMode ? (
              /* Edit Mode */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>✏️ Modifier le profil</h2>
                  <button
                    onClick={() => setEditMode(false)}
                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "#9ca3af" }}>Prénom</label>
                    <input
                      type="text"
                      value={editData.first_name}
                      onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        background: "#374151",
                        border: "1px solid #4b5563",
                        borderRadius: "4px",
                        color: "#f9fafb",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "#9ca3af" }}>Nom</label>
                    <input
                      type="text"
                      value={editData.last_name}
                      onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        background: "#374151",
                        border: "1px solid #4b5563",
                        borderRadius: "4px",
                        color: "#f9fafb",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "#9ca3af" }}>Titre</label>
                    <input
                      type="text"
                      value={editData.headline}
                      onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                      placeholder="Ex: CEO de TechAfrica"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        background: "#374151",
                        border: "1px solid #4b5563",
                        borderRadius: "4px",
                        color: "#f9fafb",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "#9ca3af" }}>Pays</label>
                    <input
                      type="text"
                      value={editData.country}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                      placeholder="Ex: Nigeria"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        background: "#374151",
                        border: "1px solid #4b5563",
                        borderRadius: "4px",
                        color: "#f9fafb",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "#374151",
                        color: "#d1d5db",
                        border: "1px solid #4b5563",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* View Mode */
              <>
                {/* Profile Header */}
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  {selectedProfile.photo_url ? (
                    <img
                      src={selectedProfile.photo_url}
                      alt=""
                      style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto" }}
                    />
                  ) : (
                    <div style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "#374151",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      fontSize: "2rem",
                    }}>
                      👤
                    </div>
                  )}
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "1rem 0 0.25rem" }}>
                    {selectedProfile.first_name} {selectedProfile.last_name}
                  </h2>
                  <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.9rem" }}>
                    {selectedProfile.headline || "Entrepreneur"}
                  </p>
                  {selectedProfile.country && (
                    <p style={{ color: "#9ca3af", margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                      📍 {selectedProfile.country}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}>
                  <div style={{ background: "#374151", padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Vues</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{selectedProfile.views_count}</div>
                  </div>
                  <div style={{ background: "#374151", padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Créé le</div>
                    <div style={{ fontSize: "0.9rem" }}>{new Date(selectedProfile.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                </div>

                {/* Verification Level */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#9ca3af" }}>
                    Badge de vérification
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4].map((level) => {
                      const info = getVerificationInfo(level);
                      const isActive = selectedProfile.verification_level === level;
                      return (
                        <button
                          key={level}
                          onClick={() => handleUpdateVerification(selectedProfile.id, level)}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            background: isActive ? info.color : "#374151",
                            color: isActive ? "#000" : "#d1d5db",
                            border: `2px solid ${isActive ? info.color : "#4b5563"}`,
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          {info.icon}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#9ca3af", textAlign: "center" }}>
                    Actuel: {getVerificationInfo(selectedProfile.verification_level).name}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: "0.75rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    ✏️ Modifier le profil
                  </button>

                  {!selectedProfile.is_published ? (
                    <button
                      onClick={() => handleTogglePublish(selectedProfile.id, selectedProfile.is_published)}
                      style={{
                        padding: "0.75rem",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Approuver et publier
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Motif de rejet (optionnel)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{
                          padding: "0.6rem",
                          background: "#374151",
                          border: "1px solid #4b5563",
                          borderRadius: "4px",
                          color: "#f9fafb",
                        }}
                      />
                      <button
                        onClick={() => handleTogglePublish(selectedProfile.id, selectedProfile.is_published, true)}
                        style={{
                          padding: "0.75rem",
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        📥 Rejeter / Dépublier
                      </button>
                    </>
                  )}

                  <Link
                    href={`/e/${selectedProfile.slug}`}
                    target="_blank"
                    style={{
                      display: "block",
                      padding: "0.75rem",
                      background: "#374151",
                      color: "#60a5fa",
                      border: "none",
                      borderRadius: "4px",
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    👁️ Voir le profil public
                  </Link>

                  <button
                    onClick={() => handleDelete(selectedProfile.id)}
                    style={{
                      padding: "0.75rem",
                      background: "transparent",
                      color: "#f87171",
                      border: "1px solid #f87171",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Supprimer définitivement
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
