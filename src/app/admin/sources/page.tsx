"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Source {
  id: string;
  entrepreneur_id: string;
  type: string;
  title: string;
  url: string;
  status: "pending" | "validated" | "rejected";
  submitted_at: string;
  rejection_reason: string | null;
  entrepreneur?: {
    first_name: string;
    last_name: string;
  };
}

export default function AdminSourcesPage() {
  const supabase = createClient();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const { data } = await supabase
      .from("sources")
      .select(`
        *,
        entrepreneur:entrepreneurs(first_name, last_name)
      `)
      .order("submitted_at", { ascending: false });

    if (data) setSources(data as Source[]);
    setLoading(false);
  };

  const handleValidate = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("sources")
      .update({
        status: "validated",
        validated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      setSources(sources.map((s) => s.id === id ? { ...s, status: "validated" as const } : s));
      setSelectedSource(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Veuillez indiquer un motif de rejet");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("sources")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", id);

    if (!error) {
      setSources(sources.map((s) => s.id === id ? { ...s, status: "rejected" as const, rejection_reason: rejectionReason } : s));
      setSelectedSource(null);
      setRejectionReason("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette source ?")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("sources").delete().eq("id", id);
    if (!error) {
      setSources(sources.filter((s) => s.id !== id));
      setSelectedSource(null);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      article: "📰",
      website: "🌐",
      social: "💼",
      document: "📄",
    };
    return icons[type] || "🔗";
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      validated: { bg: "rgba(34, 197, 94, 0.2)", color: "#4ade80" },
      pending: { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" },
      rejected: { bg: "rgba(239, 68, 68, 0.2)", color: "#f87171" },
    };
    return styles[status] || styles.pending;
  };

  const filteredSources = sources.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const pendingCount = sources.filter((s) => s.status === "pending").length;

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          📎 Validation des sources
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          {pendingCount} source(s) en attente de validation
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { value: "pending", label: `En attente (${pendingCount})` },
          { value: "validated", label: "Validées" },
          { value: "rejected", label: "Rejetées" },
          { value: "all", label: "Toutes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "0.5rem 1rem",
              background: filter === f.value ? "#3b82f6" : "#374151",
              color: filter === f.value ? "white" : "#d1d5db",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        {/* Sources List */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}>
            {filteredSources.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                Aucune source dans cette catégorie
              </div>
            ) : (
              filteredSources.map((source) => {
                const statusStyle = getStatusStyle(source.status);
                return (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSource(source)}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #374151",
                      cursor: "pointer",
                      background: selectedSource?.id === source.id ? "#374151" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>{getTypeIcon(source.type)}</span>
                      <span style={{ fontWeight: 600, flex: 1 }}>{source.title}</span>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        {source.status === "validated" ? "✓ Validée" : source.status === "rejected" ? "✗ Rejetée" : "⏳ En attente"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                      Par {source.entrepreneur?.first_name} {source.entrepreneur?.last_name} · {new Date(source.submitted_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Source Details */}
        {selectedSource && (
          <div style={{
            width: "400px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "1.5rem",
            position: "sticky",
            top: "1rem",
          }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
              {getTypeIcon(selectedSource.type)} {selectedSource.title}
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>URL :</label>
              <a
                href={selectedSource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  color: "#60a5fa",
                  wordBreak: "break-all",
                  fontSize: "0.9rem",
                  marginTop: "0.25rem",
                }}
              >
                {selectedSource.url}
              </a>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Entrepreneur :</label>
              <p style={{ margin: "0.25rem 0 0" }}>
                {selectedSource.entrepreneur?.first_name} {selectedSource.entrepreneur?.last_name}
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Soumise le :</label>
              <p style={{ margin: "0.25rem 0 0" }}>
                {new Date(selectedSource.submitted_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {selectedSource.status === "pending" && (
              <>
                <button
                  onClick={() => handleValidate(selectedSource.id)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  ✓ Valider la source
                </button>

                <div style={{ marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Motif de rejet (obligatoire)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
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

                <button
                  onClick={() => handleReject(selectedSource.id)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  ✗ Rejeter la source
                </button>
              </>
            )}

            {selectedSource.rejection_reason && (
              <div style={{
                padding: "0.75rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "4px",
                marginBottom: "0.5rem",
              }}>
                <span style={{ fontSize: "0.85rem", color: "#f87171" }}>
                  Motif : {selectedSource.rejection_reason}
                </span>
              </div>
            )}

            <button
              onClick={() => handleDelete(selectedSource.id)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "transparent",
                color: "#f87171",
                border: "1px solid #f87171",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
