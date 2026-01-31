"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ModificationRequest {
  id: string;
  entrepreneur_slug: string;
  user_email: string | null;
  field_name: string;
  current_value: string | null;
  proposed_value: string;
  reason: string | null;
  source_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
}

export default function ModerationPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<ModificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("modification_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Exécutez le script MODERATION-EXECUTE-THIS.sql dans Supabase pour activer cette fonctionnalité.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ModificationRequest) => {
    if (!confirm("Approuver cette modification et l'appliquer ?")) return;

    setProcessing(request.id);
    try {
      // Mettre à jour le statut de la demande
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("modification_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Appliquer la modification à l'entrepreneur
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, string> = {};
      updateData[request.field_name] = request.proposed_value;
      updateData.updated_at = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: entrepreneurError } = await (supabase as any)
        .from("entrepreneurs")
        .update(updateData)
        .eq("slug", request.entrepreneur_slug);

      if (entrepreneurError) throw entrepreneurError;

      // Rafraîchir la liste
      fetchRequests();
    } catch (err) {
      console.error("Error approving:", err);
      alert("Erreur lors de l'approbation");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: ModificationRequest) => {
    const reason = prompt("Raison du rejet (optionnel) :");

    setProcessing(request.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("modification_requests")
        .update({
          status: "rejected",
          admin_notes: reason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting:", err);
      alert("Erreur lors du rejet");
    } finally {
      setProcessing(null);
    }
  };

  const formatFieldName = (field: string) => {
    const names: Record<string, string> = {
      bio: "Biographie",
      headline: "Titre/Fonction",
      first_name: "Prénom",
      last_name: "Nom",
      city: "Ville",
      country: "Pays",
      photo_url: "Photo",
    };
    return names[field] || field;
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🚨 Modération</h1>
        <p style={{ color: "#9ca3af" }}>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🚨 Modération</h1>
        <div style={{
          padding: "1.5rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px"
        }}>
          <p style={{ color: "#fca5a5", marginBottom: "1rem" }}>{error}</p>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Le fichier SQL se trouve dans : <code>supabase/MODERATION-EXECUTE-THIS.sql</code>
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>
          🚨 Modération
          {pendingCount > 0 && (
            <span style={{
              marginLeft: "0.75rem",
              padding: "0.25rem 0.75rem",
              background: "#ef4444",
              borderRadius: "999px",
              fontSize: "0.9rem"
            }}>
              {pendingCount} en attente
            </span>
          )}
        </h1>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.5rem 1rem",
              background: filter === f ? "#3b82f6" : "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              color: "white",
              fontSize: "0.9rem",
            }}
          >
            {f === "pending" && "⏳ En attente"}
            {f === "approved" && "✅ Approuvées"}
            {f === "rejected" && "❌ Refusées"}
            {f === "all" && "📋 Toutes"}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          background: "#1f2937",
          borderRadius: "8px",
          color: "#9ca3af"
        }}>
          <p style={{ fontSize: "1.1rem" }}>Aucune demande {filter !== "all" && `${filter === "pending" ? "en attente" : filter === "approved" ? "approuvée" : "rejetée"}`}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                background: "#1f2937",
                border: `1px solid ${request.status === "pending" ? "#fbbf24" :
                  request.status === "approved" ? "#34d399" : "#f87171"
                  }33`,
                borderRadius: "8px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <div>
                  <Link
                    href={`/e/${request.entrepreneur_slug}`}
                    target="_blank"
                    style={{ color: "#60a5fa", fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    {request.entrepreneur_slug}
                  </Link>
                  <span style={{
                    marginLeft: "0.75rem",
                    padding: "0.2rem 0.5rem",
                    background: "#374151",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    color: "#d1d5db"
                  }}>
                    {formatFieldName(request.field_name)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.8rem",
                    background: request.status === "pending" ? "#fbbf24" :
                      request.status === "approved" ? "#34d399" : "#f87171",
                    color: "#000"
                  }}>
                    {request.status === "pending" ? "En attente" :
                      request.status === "approved" ? "Approuvé" : "Rejeté"}
                  </span>
                </div>
              </div>

              {/* Comparaison */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem"
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>
                    Valeur actuelle
                  </div>
                  <div style={{
                    padding: "0.75rem",
                    background: "#374151",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                    maxHeight: "100px",
                    overflowY: "auto"
                  }}>
                    {request.current_value || <em style={{ color: "#6b7280" }}>Vide</em>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>
                    Modification proposée
                  </div>
                  <div style={{
                    padding: "0.75rem",
                    background: "#1e3a5f",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                    maxHeight: "100px",
                    overflowY: "auto",
                    borderLeft: "3px solid #3b82f6"
                  }}>
                    {request.proposed_value}
                  </div>
                </div>
              </div>

              {/* Métadonnées */}
              <div style={{
                display: "flex",
                gap: "1.5rem",
                fontSize: "0.8rem",
                color: "#9ca3af",
                marginBottom: request.status === "pending" ? "1rem" : 0
              }}>
                <span>📧 {request.user_email || "Anonyme"}</span>
                <span>📅 {new Date(request.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}</span>
                {request.reason && <span>💬 {request.reason}</span>}
                {request.source_url && (
                  <a href={request.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>
                    🔗 Source
                  </a>
                )}
              </div>

              {/* Actions */}
              {request.status === "pending" && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processing === request.id}
                    style={{
                      padding: "0.5rem 1.25rem",
                      background: "#22c55e",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processing === request.id ? "wait" : "pointer",
                      color: "white",
                      fontWeight: 600,
                      opacity: processing === request.id ? 0.5 : 1,
                    }}
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    disabled={processing === request.id}
                    style={{
                      padding: "0.5rem 1.25rem",
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processing === request.id ? "wait" : "pointer",
                      color: "white",
                      fontWeight: 600,
                      opacity: processing === request.id ? 0.5 : 1,
                    }}
                  >
                    ✕ Refuser
                  </button>
                </div>
              )}

              {/* Notes admin si rejeté */}
              {request.status === "rejected" && request.admin_notes && (
                <div style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  background: "#44141466",
                  borderRadius: "4px",
                  fontSize: "0.85rem"
                }}>
                  <strong>Raison du rejet :</strong> {request.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
