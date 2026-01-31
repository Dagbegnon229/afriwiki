"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface KYCRequest {
  id: string;
  entrepreneur_id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: string | null;
  country: string | null;
  verification_level: number;
  kyc_status: "none" | "pending" | "approved" | "rejected";
  kyc_document_url: string | null;
  kyc_document_type: string | null;
  kyc_submitted_at: string | null;
  admin_note: string | null;
  created_at: string;
}

interface KYCHistoryEntry {
  id: string;
  action: string;
  old_level: number;
  new_level: number;
  admin_note: string | null;
  created_at: string;
}

export default function AdminKYCPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [kycHistory, setKycHistory] = useState<KYCHistoryEntry[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchKYCRequests();
  }, []);

  const fetchKYCRequests = async () => {
    setLoading(true);
    
    // Récupérer les entrepreneurs
    const { data } = await supabase
      .from("entrepreneurs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kycData: KYCRequest[] = (data as any[]).map((e) => ({
        id: e.id,
        entrepreneur_id: e.id,
        slug: e.slug,
        first_name: e.first_name,
        last_name: e.last_name,
        headline: e.headline,
        photo_url: e.photo_url,
        country: e.country,
        verification_level: e.verification_level,
        kyc_status: e.verification_level >= 2 ? "approved" : e.verification_level === 1 ? "pending" : "none",
        kyc_document_url: null, // Would come from a kyc_documents table in real implementation
        kyc_document_type: null,
        kyc_submitted_at: e.updated_at,
        admin_note: null,
        created_at: e.created_at,
      }));
      setRequests(kycData);
    }
    setLoading(false);
  };

  const fetchKYCHistory = async (entrepreneurId: string) => {
    // In a real implementation, this would fetch from a kyc_history table
    // For now, we simulate with admin_activity_logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("admin_activity_logs")
      .select("*")
      .eq("target_id", entrepreneurId)
      .eq("action_category", "kyc_validation")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setKycHistory(data.map((log: { id: string; details: { old_level?: number; new_level?: number; note?: string }; created_at: string; action_type: string }) => ({
        id: log.id,
        action: log.action_type,
        old_level: log.details?.old_level || 1,
        new_level: log.details?.new_level || 1,
        admin_note: log.details?.note || null,
        created_at: log.created_at,
      })));
    } else {
      setKycHistory([]);
    }
  };

  const handleSelectRequest = async (request: KYCRequest) => {
    setSelectedRequest(request);
    setAdminNote("");
    await fetchKYCHistory(request.id);
  };

  const handleApprove = async (id: string, newLevel: number) => {
    const oldLevel = selectedRequest?.verification_level || 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("entrepreneurs")
      .update({ verification_level: newLevel })
      .eq("id", id);

    if (!error) {
      // Log the action
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("admin_activity_logs")
        .insert({
          action_type: `kyc_level_${oldLevel}_to_${newLevel}`,
          action_category: "kyc_validation",
          target_type: "entrepreneur",
          target_id: id,
          target_name: `${selectedRequest?.first_name} ${selectedRequest?.last_name}`,
          details: {
            old_level: oldLevel,
            new_level: newLevel,
            note: adminNote || null,
          },
        });

      setRequests(requests.map((r) =>
        r.id === id ? { ...r, verification_level: newLevel, kyc_status: "approved" as const } : r
      ));
      setMessage({ type: "success", text: `Niveau de vérification mis à jour: ${getVerificationInfo(newLevel).name}` });
      setAdminNote("");
      fetchKYCHistory(id);
    } else {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    }
  };

  const handleReject = async (id: string) => {
    if (!adminNote.trim()) {
      setMessage({ type: "error", text: "Veuillez indiquer un motif de rejet" });
      return;
    }

    const oldLevel = selectedRequest?.verification_level || 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("entrepreneurs")
      .update({ verification_level: 1 })
      .eq("id", id);

    if (!error) {
      // Log the action
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("admin_activity_logs")
        .insert({
          action_type: "kyc_rejected",
          action_category: "kyc_validation",
          target_type: "entrepreneur",
          target_id: id,
          target_name: `${selectedRequest?.first_name} ${selectedRequest?.last_name}`,
          details: {
            old_level: oldLevel,
            new_level: 1,
            note: adminNote,
            reason: "rejected",
          },
        });

      setRequests(requests.map((r) =>
        r.id === id ? { ...r, verification_level: 1, kyc_status: "rejected" as const } : r
      ));
      setMessage({ type: "success", text: "KYC rejeté et niveau réinitialisé" });
      setAdminNote("");
      fetchKYCHistory(id);
    } else {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    }
  };

  const getVerificationInfo = (level: number) => {
    const info: Record<number, { icon: string; name: string; color: string; description: string }> = {
      1: {
        icon: "🔵",
        name: "Basique",
        color: "#60a5fa",
        description: "Compte créé, aucune vérification",
      },
      2: {
        icon: "✓",
        name: "Vérifié",
        color: "#4ade80",
        description: "Identité vérifiée par email/téléphone",
      },
      3: {
        icon: "⭐",
        name: "Pro",
        color: "#fbbf24",
        description: "Documents d'identité validés",
      },
      4: {
        icon: "👑",
        name: "Notable",
        color: "#a78bfa",
        description: "Figure publique reconnue",
      },
    };
    return info[level] || info[1];
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "pending") return r.verification_level === 1;
    if (filter === "approved") return r.verification_level >= 2;
    if (filter === "rejected") return r.kyc_status === "rejected";
    return true;
  });

  const pendingCount = requests.filter((r) => r.verification_level === 1).length;

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          🔐 Validation KYC
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          {requests.length} profils • {pendingCount} en attente de vérification • {requests.filter(r => r.verification_level >= 2).length} vérifiés
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

      {/* Explanation Box */}
      <div style={{
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem 0" }}>
          📋 Niveaux de vérification
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[1, 2, 3, 4].map((level) => {
            const info = getVerificationInfo(level);
            return (
              <div key={level} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{info.icon}</div>
                <div style={{ fontWeight: 600, color: info.color, marginBottom: "0.25rem" }}>{info.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{info.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { value: "pending", label: `En attente (${pendingCount})` },
          { value: "approved", label: "Vérifiés" },
          { value: "rejected", label: "Rejetés" },
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
        {/* Requests List */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}>
            {filteredRequests.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                Aucune demande dans cette catégorie
              </div>
            ) : (
              filteredRequests.map((request) => {
                const info = getVerificationInfo(request.verification_level);
                return (
                  <div
                    key={request.id}
                    onClick={() => handleSelectRequest(request)}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid #374151",
                      cursor: "pointer",
                      background: selectedRequest?.id === request.id ? "#374151" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {request.photo_url ? (
                        <img
                          src={request.photo_url}
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
                          {request.first_name} {request.last_name}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                          {request.headline || "Entrepreneur"} {request.country && `• ${request.country}`}
                        </div>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: info.color,
                      }}>
                        <span>{info.icon}</span>
                        <span style={{ fontSize: "0.85rem" }}>{info.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Request Details */}
        {selectedRequest && (
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
            {/* Profile Header */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              {selectedRequest.photo_url ? (
                <img
                  src={selectedRequest.photo_url}
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
                {selectedRequest.first_name} {selectedRequest.last_name}
              </h2>
              <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.9rem" }}>
                {selectedRequest.headline || "Entrepreneur"}
              </p>
              <Link
                href={`/e/${selectedRequest.slug}`}
                target="_blank"
                style={{ color: "#60a5fa", fontSize: "0.85rem", textDecoration: "none" }}
              >
                Voir le profil →
              </Link>
            </div>

            {/* Current Level */}
            <div style={{
              background: "#374151",
              padding: "1rem",
              borderRadius: "4px",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>
                Niveau actuel
              </label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{getVerificationInfo(selectedRequest.verification_level).icon}</span>
                <span style={{
                  color: getVerificationInfo(selectedRequest.verification_level).color,
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}>
                  {getVerificationInfo(selectedRequest.verification_level).name}
                </span>
              </div>
            </div>

            {/* Documents (placeholder) */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.9rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>
                📄 Documents KYC
              </label>
              {selectedRequest.kyc_document_url ? (
                <a
                  href={selectedRequest.kyc_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: "0.75rem",
                    background: "#374151",
                    borderRadius: "4px",
                    color: "#60a5fa",
                    textDecoration: "none",
                  }}
                >
                  📎 Voir le document ({selectedRequest.kyc_document_type || "Document"})
                </a>
              ) : (
                <div style={{
                  padding: "0.75rem",
                  background: "#374151",
                  borderRadius: "4px",
                  color: "#9ca3af",
                  fontStyle: "italic",
                  textAlign: "center",
                }}>
                  Aucun document soumis
                </div>
              )}
            </div>

            {/* Admin Note */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.9rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>
                📝 Note interne (admin)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ajouter une note sur cette vérification..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
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

            {/* Level Buttons */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.9rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>
                Attribuer un niveau
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                {[2, 3, 4].map((level) => {
                  const info = getVerificationInfo(level);
                  const isActive = selectedRequest.verification_level === level;
                  return (
                    <button
                      key={level}
                      onClick={() => handleApprove(selectedRequest.id, level)}
                      disabled={isActive}
                      style={{
                        padding: "0.75rem",
                        background: isActive ? info.color : "#374151",
                        color: isActive ? "#000" : "#d1d5db",
                        border: `2px solid ${isActive ? info.color : "#4b5563"}`,
                        borderRadius: "4px",
                        cursor: isActive ? "default" : "pointer",
                        fontSize: "0.9rem",
                        opacity: isActive ? 0.7 : 1,
                      }}
                    >
                      {info.icon} {info.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reject Button */}
            <button
              onClick={() => handleReject(selectedRequest.id)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "transparent",
                color: "#f87171",
                border: "1px solid #f87171",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "1.5rem",
              }}
            >
              ✕ Réinitialiser au niveau basique
            </button>

            {/* KYC History */}
            {kycHistory.length > 0 && (
              <div>
                <label style={{ fontSize: "0.9rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>
                  📜 Historique des modifications
                </label>
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {kycHistory.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: "0.5rem",
                        background: "#374151",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span>
                          {getVerificationInfo(entry.old_level).icon} → {getVerificationInfo(entry.new_level).icon}
                        </span>
                        <span style={{ color: "#9ca3af" }}>
                          {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {entry.admin_note && (
                        <div style={{ color: "#9ca3af", fontStyle: "italic" }}>
                          {entry.admin_note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
