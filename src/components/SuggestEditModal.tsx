"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SuggestEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    entrepreneurSlug: string;
    entrepreneurName: string;
    currentBio: string | null;
    currentHeadline: string | null;
}

export function SuggestEditModal({
    isOpen,
    onClose,
    entrepreneurSlug,
    entrepreneurName,
    currentBio,
    currentHeadline,
}: SuggestEditModalProps) {
    const supabase = createClient();

    const [fieldName, setFieldName] = useState("bio");
    const [proposedValue, setProposedValue] = useState("");
    const [reason, setReason] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const getCurrentValue = () => {
        switch (fieldName) {
            case "bio": return currentBio || "";
            case "headline": return currentHeadline || "";
            default: return "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: insertError } = await (supabase as any)
                .from("modification_requests")
                .insert({
                    entrepreneur_slug: entrepreneurSlug,
                    field_name: fieldName,
                    current_value: getCurrentValue(),
                    proposed_value: proposedValue,
                    reason: reason || null,
                    source_url: sourceUrl || null,
                    user_email: email || null,
                    status: "pending",
                });

            if (insertError) throw insertError;

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setProposedValue("");
                setReason("");
                setSourceUrl("");
            }, 2000);
        } catch (err) {
            console.error("Error submitting suggestion:", err);
            setError("Une erreur est survenue. La fonctionnalité de modération n'est peut-être pas encore configurée.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "var(--background)",
                    borderRadius: "12px",
                    padding: "2rem",
                    maxWidth: "600px",
                    width: "90%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {success ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                        <h2 style={{ marginBottom: "0.5rem" }}>Merci pour votre contribution !</h2>
                        <p style={{ color: "var(--text-secondary)" }}>
                            Votre suggestion sera examinée par notre équipe.
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.25rem" }}>
                                ✏️ Suggérer une modification
                            </h2>
                            <button
                                onClick={onClose}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "1.5rem",
                                    cursor: "pointer",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                            Proposez une modification pour <strong>{entrepreneurName}</strong>.
                            Un modérateur examinera votre suggestion.
                        </p>

                        <form onSubmit={handleSubmit}>
                            {/* Champ à modifier */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Champ à modifier
                                </label>
                                <select
                                    value={fieldName}
                                    onChange={(e) => setFieldName(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-color)",
                                        background: "var(--background-secondary)",
                                        fontSize: "1rem",
                                    }}
                                >
                                    <option value="bio">Biographie</option>
                                    <option value="headline">Titre / Fonction</option>
                                </select>
                            </div>

                            {/* Valeur actuelle */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Valeur actuelle
                                </label>
                                <div
                                    style={{
                                        padding: "0.75rem",
                                        background: "var(--background-secondary)",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-color)",
                                        maxHeight: "100px",
                                        overflowY: "auto",
                                        fontSize: "0.9rem",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {getCurrentValue() || <em>Aucune valeur actuelle</em>}
                                </div>
                            </div>

                            {/* Nouvelle valeur */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Nouvelle valeur proposée *
                                </label>
                                <textarea
                                    value={proposedValue}
                                    onChange={(e) => setProposedValue(e.target.value)}
                                    required
                                    rows={4}
                                    placeholder="Entrez la nouvelle valeur..."
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-color)",
                                        background: "var(--background-secondary)",
                                        fontSize: "1rem",
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            {/* Raison */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Pourquoi cette modification ?
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Information obsolète, erreur factuelle, etc."
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-color)",
                                        background: "var(--background-secondary)",
                                        fontSize: "1rem",
                                    }}
                                />
                            </div>

                            {/* Source */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Source (URL)
                                </label>
                                <input
                                    type="url"
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    placeholder="https://..."
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-color)",
                                        background: "var(--background-secondary)",
                                        fontSize: "1rem",
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Votre email (optionnel)
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Pour être notifié de la décision"
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-color)",
                                        background: "var(--background-secondary)",
                                        fontSize: "1rem",
                                    }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: "0.75rem",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "6px",
                                    color: "#f87171",
                                    marginBottom: "1rem",
                                    fontSize: "0.9rem"
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: "var(--background-secondary)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "1rem",
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !proposedValue}
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: loading ? "#6b7280" : "#3b82f6",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: loading ? "wait" : "pointer",
                                        color: "white",
                                        fontWeight: 600,
                                        fontSize: "1rem",
                                    }}
                                >
                                    {loading ? "Envoi..." : "Soumettre"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
