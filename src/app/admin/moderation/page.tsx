"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Report {
  id: string;
  content_type: "entrepreneur" | "article" | "source" | "comment";
  content_id: string;
  reason: string;
  description: string | null;
  reporter_email: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  resolution: string | null;
  resolution_note: string | null;
  created_at: string;
  // Données enrichies
  content_name?: string;
  content_slug?: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: "🚫 Spam",
  inappropriate: "⚠️ Contenu inapproprié",
  false_information: "❌ Fausses informations",
  copyright: "©️ Violation de droits d'auteur",
  harassment: "🛑 Harcèlement",
  other: "📝 Autre",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.2)" },
  reviewing: { label: "En cours", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.2)" },
  resolved: { label: "Résolu", color: "#4ade80", bg: "rgba(74, 222, 128, 0.2)" },
  dismissed: { label: "Rejeté", color: "#9ca3af", bg: "rgba(156, 163, 175, 0.2)" },
};

export default function ModerationPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Enrichir les données
      const enriched = await Promise.all(
        data.map(async (report: Report) => {
          if (report.content_type === "entrepreneur") {
            const { data: ent } = await supabase
              .from("entrepreneurs")
              .select("first_name, last_name, slug")
              .eq("id", report.content_id)
              .single();
            if (ent) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const e = ent as any;
              return { ...report, content_name: `${e.first_name} ${e.last_name}`, content_slug: e.slug };
            }
          } else if (report.content_type === "article") {
            const { data: art } = await supabase
              .from("articles")
              .select("title, slug")
              .eq("id", report.content_id)
              .single();
            if (art) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const a = art as any;
              return { ...report, content_name: a.title, content_slug: a.slug };
            }
          }
          return report;
        })
      );
      setReports(enriched);
    }

    setLoading(false);
  };

  const handleResolve = async (reportId: string, resolution: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("reports")
      .update({
        status: "resolved",
        resolution,
        resolution_note: resolutionNote || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (!error) {
      setReports(reports.map((r) => r.id === reportId ? { ...r, status: "resolved" as const, resolution } : r));
      setSelectedReport(null);
      setResolutionNote("");
      setMessage({ type: "success", text: "Signalement traité !" });

      // Si on supprime le contenu, le faire
      if (resolution === "content_removed" && selectedReport) {
        if (selectedReport.content_type === "entrepreneur") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("entrepreneurs").update({ is_published: false }).eq("id", selectedReport.content_id);
        } else if (selectedReport.content_type === "article") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("articles").update({ status: "rejected" }).eq("id", selectedReport.content_id);
        }
      }
    } else {
      setMessage({ type: "error", text: "Erreur lors du traitement" });
    }
  };

  const handleDismiss = async (reportId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("reports")
      .update({
        status: "dismissed",
        resolution: "no_action",
        resolution_note: resolutionNote || "Signalement non justifié",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (!error) {
      setReports(reports.map((r) => r.id === reportId ? { ...r, status: "dismissed" as const } : r));
      setSelectedReport(null);
      setResolutionNote("");
      setMessage({ type: "success", text: "Signalement rejeté" });
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          🚨 Modération & Signalements
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          {pendingCount} signalement(s) en attente de traitement
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
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { value: "pending", label: `En attente (${pendingCount})` },
          { value: "reviewing", label: "En cours" },
          { value: "resolved", label: "Résolus" },
          { value: "dismissed", label: "Rejetés" },
          { value: "all", label: "Tous" },
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
        {/* Reports List */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}>
            {filteredReports.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                {filter === "pending" ? "🎉 Aucun signalement en attente !" : "Aucun signalement dans cette catégorie"}
              </div>
            ) : (
              filteredReports.map((report) => {
                const status = STATUS_LABELS[report.status];
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #374151",
                      cursor: "pointer",
                      background: selectedReport?.id === report.id ? "#374151" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>
                          {report.content_type === "entrepreneur" ? "👤" : "📝"}
                        </span>
                        <span style={{ fontWeight: 600 }}>{report.content_name || report.content_id.slice(0, 8)}</span>
                      </div>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        background: status.bg,
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.85rem", color: "#9ca3af" }}>
                      <span>{REASON_LABELS[report.reason]}</span>
                      <span>•</span>
                      <span>{new Date(report.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Report Details */}
        {selectedReport && (
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
              Détails du signalement
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Contenu signalé :</label>
              <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
                {selectedReport.content_type === "entrepreneur" ? "👤 Profil : " : "📝 Article : "}
                {selectedReport.content_name || selectedReport.content_id}
              </p>
              {selectedReport.content_slug && (
                <a
                  href={selectedReport.content_type === "entrepreneur" ? `/e/${selectedReport.content_slug}` : `/articles/${selectedReport.content_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", fontSize: "0.85rem" }}
                >
                  Voir le contenu →
                </a>
              )}
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Raison :</label>
              <p style={{ margin: "0.25rem 0 0" }}>{REASON_LABELS[selectedReport.reason]}</p>
            </div>

            {selectedReport.description && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Description :</label>
                <p style={{ margin: "0.25rem 0 0", background: "#374151", padding: "0.75rem", borderRadius: "4px", fontSize: "0.9rem" }}>
                  {selectedReport.description}
                </p>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Signalé par :</label>
              <p style={{ margin: "0.25rem 0 0" }}>
                {selectedReport.reporter_email || "Anonyme"}
              </p>
            </div>

            {selectedReport.status === "pending" && (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                    Note de résolution (optionnel) :
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Commentaire sur la décision..."
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      background: "#374151",
                      border: "1px solid #4b5563",
                      borderRadius: "4px",
                      color: "#f9fafb",
                      minHeight: "80px",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleResolve(selectedReport.id, "content_removed")}
                    style={{
                      padding: "0.75rem",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    🗑️ Supprimer le contenu
                  </button>
                  <button
                    onClick={() => handleResolve(selectedReport.id, "content_edited")}
                    style={{
                      padding: "0.75rem",
                      background: "#f59e0b",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    ✏️ Contenu modifié
                  </button>
                  <button
                    onClick={() => handleResolve(selectedReport.id, "user_warned")}
                    style={{
                      padding: "0.75rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    ⚠️ Avertir l&apos;auteur
                  </button>
                  <button
                    onClick={() => handleDismiss(selectedReport.id)}
                    style={{
                      padding: "0.75rem",
                      background: "transparent",
                      color: "#9ca3af",
                      border: "1px solid #4b5563",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Rejeter le signalement
                  </button>
                </div>
              </>
            )}

            {selectedReport.status !== "pending" && (
              <div style={{
                padding: "1rem",
                background: "#374151",
                borderRadius: "4px",
              }}>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  <strong>Résolution :</strong> {selectedReport.resolution?.replace("_", " ")}
                </p>
                {selectedReport.resolution_note && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#9ca3af" }}>
                    {selectedReport.resolution_note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
