"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ContribuerPage() {
    return (
        <>
            <Header />
            <main style={{
                minHeight: "calc(100vh - 200px)",
                padding: "2rem",
                maxWidth: "900px",
                margin: "0 auto"
            }}>
                <h1 style={{
                    fontSize: "2rem",
                    marginBottom: "1.5rem",
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "0.5rem"
                }}>
                    Contribuer à AfriWiki
                </h1>

                <div style={{
                    background: "var(--background-secondary)",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    marginBottom: "2rem",
                    border: "1px solid var(--border-light)"
                }}>
                    <p style={{ marginBottom: "1rem", lineHeight: 1.7 }}>
                        <strong>AfriWiki</strong> est une encyclopédie collaborative dédiée aux entrepreneurs africains.
                        Chaque contribution aide à documenter et célébrer le dynamisme entrepreneurial du continent.
                    </p>
                </div>

                <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Comment contribuer ?</h2>

                <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                    <div style={{
                        background: "var(--background)",
                        padding: "1.25rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)"
                    }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <span>📝</span> Créer votre page entrepreneur
                        </h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                            Vous êtes entrepreneur ou fondateur d'une startup africaine ?
                            Créez votre page pour être référencé dans l'encyclopédie.
                        </p>
                        <Link
                            href="/inscription"
                            style={{
                                display: "inline-block",
                                padding: "0.5rem 1rem",
                                background: "var(--link-color)",
                                color: "white",
                                borderRadius: "4px",
                                textDecoration: "none"
                            }}
                        >
                            S'inscrire et créer ma page →
                        </Link>
                    </div>

                    <div style={{
                        background: "var(--background)",
                        padding: "1.25rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)"
                    }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <span>✏️</span> Améliorer un article existant
                        </h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                            Vous connaissez un entrepreneur listé ? Proposez des corrections,
                            des informations complémentaires ou des sources fiables.
                        </p>
                        <Link
                            href="/recherche"
                            style={{
                                display: "inline-block",
                                padding: "0.5rem 1rem",
                                background: "var(--background-secondary)",
                                color: "var(--link-color)",
                                borderRadius: "4px",
                                textDecoration: "none",
                                border: "1px solid var(--border-color)"
                            }}
                        >
                            Rechercher un entrepreneur →
                        </Link>
                    </div>

                    <div style={{
                        background: "var(--background)",
                        padding: "1.25rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)"
                    }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <span>📎</span> Ajouter des sources
                        </h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                            Les sources fiables sont essentielles pour la crédibilité de l'encyclopédie.
                            Partagez des articles de presse, interviews, ou documents officiels.
                        </p>
                        <Link
                            href="/inscription"
                            style={{
                                display: "inline-block",
                                padding: "0.5rem 1rem",
                                background: "var(--background-secondary)",
                                color: "var(--link-color)",
                                borderRadius: "4px",
                                textDecoration: "none",
                                border: "1px solid var(--border-color)"
                            }}
                        >
                            Commencer à contribuer →
                        </Link>
                    </div>
                </div>

                <div style={{
                    background: "#dbeafe",
                    padding: "1rem 1.25rem",
                    borderRadius: "6px",
                    borderLeft: "4px solid #3b82f6"
                }}>
                    <p style={{ margin: 0, color: "#1e40af" }}>
                        <strong>💡 Besoin d'aide ?</strong> Consultez notre{" "}
                        <Link href="/aide" style={{ color: "#1e40af" }}>page d'aide</Link>{" "}
                        pour plus d'informations sur le processus de contribution.
                    </p>
                </div>
            </main>
            <Footer />
        </>
    );
}
