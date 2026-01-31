"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
  created_at: string;
  status: "active" | "suspended" | "banned";
  entrepreneur?: {
    id: string;
    slug: string;
    first_name: string;
    last_name: string;
    is_published: boolean;
    verification_level: number;
    country: string | null;
    views_count: number;
  };
}

interface ActivityLog {
  id: string;
  action_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPublished, setFilterPublished] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

    // Récupérer les entrepreneurs avec toutes leurs infos
    const { data } = await supabase
      .from("entrepreneurs")
      .select("id, user_id, slug, first_name, last_name, is_published, verification_level, country, views_count, created_at")
      .order("created_at", { ascending: false });

    // Récupérer les utilisateurs bannis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bannedUsers } = await (supabase as any)
      .from("banned_users")
      .select("user_id, banned_until");

    const bannedMap = new Map<string, string | null>();
    if (bannedUsers) {
      bannedUsers.forEach((b: { user_id: string; banned_until: string | null }) => {
        bannedMap.set(b.user_id, b.banned_until);
      });
    }

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usersData = (data as any[]).map((e) => {
        const bannedUntil = bannedMap.get(e.user_id);
        let status: "active" | "suspended" | "banned" = "active";
        
        if (bannedUntil === null) {
          status = "banned"; // Permanent ban
        } else if (bannedUntil && new Date(bannedUntil) > new Date()) {
          status = "suspended"; // Temporary ban
        }

        return {
          id: e.user_id,
          email: "",
          created_at: e.created_at,
          status,
          entrepreneur: {
            id: e.id,
            slug: e.slug,
            first_name: e.first_name,
            last_name: e.last_name,
            is_published: e.is_published,
            verification_level: e.verification_level,
            country: e.country,
            views_count: e.views_count || 0,
          },
        };
      });
      setUsers(usersData);
    }

    setLoading(false);
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingActivity(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("user_activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setUserActivity(data);
    }
    setLoadingActivity(false);
  };

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    await fetchUserActivity(user.id);
  };

  const handleSuspendUser = async (userId: string, duration: string) => {
    let bannedUntil: string | null = null;
    
    if (duration === "1day") {
      bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === "1week") {
      bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === "1month") {
      bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === "permanent") {
      bannedUntil = null; // Null = permanent ban
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("banned_users")
      .upsert({
        user_id: userId,
        banned_until: bannedUntil,
        reason: "Suspension par l'administrateur",
      });

    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setMessage({ type: "success", text: duration === "permanent" ? "Utilisateur banni définitivement" : "Utilisateur suspendu" });
      fetchUsers();
      setSelectedUser(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("banned_users")
      .delete()
      .eq("user_id", userId);

    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Utilisateur débanni" });
      fetchUsers();
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async (userId: string, entrepreneurId?: string) => {
    if (!confirm("⚠️ ATTENTION: Cette action est IRRÉVERSIBLE.\n\nSupprimer définitivement cet utilisateur et toutes ses données ?")) return;
    if (!confirm("Dernière confirmation: Êtes-vous absolument certain ?")) return;

    // Supprimer le profil entrepreneur
    if (entrepreneurId) {
      // Supprimer les données liées
      await supabase.from("parcours").delete().eq("entrepreneur_id", entrepreneurId);
      await supabase.from("entreprises").delete().eq("entrepreneur_id", entrepreneurId);
      await supabase.from("recompenses").delete().eq("entrepreneur_id", entrepreneurId);
      await supabase.from("sources").delete().eq("entrepreneur_id", entrepreneurId);
      await supabase.from("entrepreneurs").delete().eq("id", entrepreneurId);
    }

    // Supprimer des banned_users si présent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("banned_users").delete().eq("user_id", userId);

    // Note: La suppression du compte auth nécessite des droits admin Supabase
    // Pour une vraie suppression, utiliser supabase.auth.admin.deleteUser()

    setMessage({ type: "success", text: "Utilisateur et données supprimés" });
    fetchUsers();
    setSelectedUser(null);
  };

  const handleForceLogout = async (userId: string) => {
    // Invalider toutes les sessions de l'utilisateur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("user_sessions")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Sessions invalidées - l'utilisateur devra se reconnecter" });
    }
  };

  // Filters
  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchQuery || 
      `${u.entrepreneur?.first_name} ${u.entrepreneur?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.entrepreneur?.country?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || u.status === filterStatus;
    
    const matchesPublished = filterPublished === "all" ||
      (filterPublished === "published" && u.entrepreneur?.is_published) ||
      (filterPublished === "draft" && !u.entrepreneur?.is_published);

    return matchesSearch && matchesStatus && matchesPublished;
  });

  const getStatusBadge = (status: User["status"]) => {
    const styles = {
      active: { bg: "rgba(34, 197, 94, 0.2)", color: "#4ade80", text: "Actif" },
      suspended: { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", text: "Suspendu" },
      banned: { bg: "rgba(239, 68, 68, 0.2)", color: "#f87171", text: "Banni" },
    };
    const s = styles[status];
    return (
      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", background: s.bg, color: s.color }}>
        {s.text}
      </span>
    );
  };

  const getActivityIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      login: "🔐",
      logout: "🚪",
      profile_created: "👤",
      profile_updated: "✏️",
      article_created: "📝",
      article_updated: "📝",
      source_added: "🔗",
      report_submitted: "🚨",
    };
    return icons[actionType] || "📋";
  };

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          👥 Gestion des utilisateurs
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          {users.length} utilisateur{users.length > 1 ? "s" : ""} • 
          {users.filter(u => u.status === "active").length} actifs • 
          {users.filter(u => u.status === "suspended").length} suspendus • 
          {users.filter(u => u.status === "banned").length} bannis
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
            flex: 1,
            minWidth: "200px",
            padding: "0.75rem 1rem",
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            color: "#f9fafb",
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            color: "#f9fafb",
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
          <option value="banned">Bannis</option>
        </select>
        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            color: "#f9fafb",
          }}
        >
          <option value="all">Tous les profils</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        {/* Users Table */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#374151" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Utilisateur</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Pays</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Statut</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Vues</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderTop: "1px solid #374151",
                      background: selectedUser?.id === user.id ? "#374151" : "transparent",
                    }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#374151",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          👤
                        </div>
                        <div>
                          <Link
                            href={`/e/${user.entrepreneur?.slug}`}
                            target="_blank"
                            style={{ fontWeight: 600, color: "#60a5fa", textDecoration: "none" }}
                          >
                            {user.entrepreneur?.first_name} {user.entrepreneur?.last_name}
                          </Link>
                          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                            {new Date(user.created_at).toLocaleDateString("fr-FR")}
                            {user.entrepreneur?.verification_level && user.entrepreneur.verification_level >= 2 && (
                              <span style={{ marginLeft: "0.5rem" }}>✓ Vérifié</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", color: "#9ca3af" }}>
                      {user.entrepreneur?.country || "-"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {getStatusBadge(user.status)}
                    </td>
                    <td style={{ padding: "1rem", color: "#9ca3af" }}>
                      {user.entrepreneur?.views_count || 0}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleViewUser(user)}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        </div>

        {/* User Details Panel */}
        {selectedUser && (
          <div style={{
            width: "400px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "1.5rem",
            position: "sticky",
            top: "1rem",
            maxHeight: "calc(100vh - 6rem)",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
                {selectedUser.entrepreneur?.first_name} {selectedUser.entrepreneur?.last_name}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.25rem" }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              {getStatusBadge(selectedUser.status)}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>ID:</strong> {selectedUser.id.slice(0, 12)}...
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Pays:</strong> {selectedUser.entrepreneur?.country || "Non renseigné"}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Inscription:</strong> {new Date(selectedUser.created_at).toLocaleString("fr-FR")}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Profil:</strong> {selectedUser.entrepreneur?.is_published ? "Publié" : "Brouillon"}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Vérification:</strong> Niveau {selectedUser.entrepreneur?.verification_level || 1}
              </p>
            </div>

            {/* Actions */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.75rem 0", color: "#9ca3af" }}>Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={() => handleForceLogout(selectedUser.id)}
                  style={{
                    padding: "0.6rem",
                    background: "#374151",
                    color: "#f9fafb",
                    border: "1px solid #4b5563",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  🔐 Forcer la déconnexion
                </button>

                {selectedUser.status === "active" && (
                  <>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSuspendUser(selectedUser.id, e.target.value);
                        }
                      }}
                      defaultValue=""
                      style={{
                        padding: "0.6rem",
                        background: "#374151",
                        color: "#fbbf24",
                        border: "1px solid #fbbf24",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>⏳ Suspendre temporairement...</option>
                      <option value="1day">1 jour</option>
                      <option value="1week">1 semaine</option>
                      <option value="1month">1 mois</option>
                    </select>
                    <button
                      onClick={() => handleSuspendUser(selectedUser.id, "permanent")}
                      style={{
                        padding: "0.6rem",
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      🚫 Bannir définitivement
                    </button>
                  </>
                )}

                {(selectedUser.status === "suspended" || selectedUser.status === "banned") && (
                  <button
                    onClick={() => handleUnbanUser(selectedUser.id)}
                    style={{
                      padding: "0.6rem",
                      background: "rgba(34, 197, 94, 0.2)",
                      color: "#4ade80",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    ✓ Débannir / Réactiver
                  </button>
                )}

                <button
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.entrepreneur?.id)}
                  style={{
                    padding: "0.6rem",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                    marginTop: "0.5rem",
                  }}
                >
                  🗑️ Supprimer définitivement
                </button>
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.75rem 0", color: "#9ca3af" }}>
                Historique d&apos;activité
              </h3>
              {loadingActivity ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Chargement...</p>
              ) : userActivity.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Aucune activité enregistrée</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {userActivity.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "0.5rem",
                        background: "#374151",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{getActivityIcon(log.action_type)}</span>
                        <span>{log.action_type.replace("_", " ")}</span>
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        {new Date(log.created_at).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
