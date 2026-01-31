"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PageViewStats {
    totalViews: number;
    uniqueVisitors: number;
    topPages: Array<{ page_path: string; views: number }>;
    topReferrers: Array<{ referrer: string; views: number }>;
    weeklyStats: Array<{ day: string; views: number; unique_visitors: number }>;
}

export default function AnalyticsPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<PageViewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Essayer de récupérer les stats de la table page_views
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const supabaseAny = supabase as any;

                // Total des vues (30 derniers jours)
                const { data: viewsData, count: totalViews } = await supabaseAny
                    .from("page_views")
                    .select("*", { count: "exact", head: true })
                    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

                // Visiteurs uniques
                const { data: visitorsData } = await supabaseAny
                    .from("page_views")
                    .select("visitor_id")
                    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

                const uniqueVisitors = visitorsData
                    ? new Set(visitorsData.map((v: { visitor_id: string }) => v.visitor_id)).size
                    : 0;

                // Top pages
                const { data: topPagesRaw } = await supabaseAny
                    .from("page_views")
                    .select("page_path")
                    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

                const pageCount: Record<string, number> = {};
                (topPagesRaw || []).forEach((p: { page_path: string }) => {
                    pageCount[p.page_path] = (pageCount[p.page_path] || 0) + 1;
                });
                const topPages = Object.entries(pageCount)
                    .map(([page_path, views]) => ({ page_path, views }))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 10);

                // Top referrers
                const { data: referrersRaw } = await supabaseAny
                    .from("page_views")
                    .select("referrer")
                    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

                const refCount: Record<string, number> = {};
                (referrersRaw || []).forEach((r: { referrer: string | null }) => {
                    const ref = r.referrer || "Direct";
                    refCount[ref] = (refCount[ref] || 0) + 1;
                });
                const topReferrers = Object.entries(refCount)
                    .map(([referrer, views]) => ({ referrer, views }))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 10);

                // Stats hebdomadaires
                const { data: weeklyRaw } = await supabaseAny
                    .from("page_views")
                    .select("created_at, visitor_id")
                    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

                const dailyStats: Record<string, { views: number; visitors: Set<string> }> = {};
                (weeklyRaw || []).forEach((v: { created_at: string; visitor_id: string }) => {
                    const day = new Date(v.created_at).toISOString().split("T")[0];
                    if (!dailyStats[day]) {
                        dailyStats[day] = { views: 0, visitors: new Set() };
                    }
                    dailyStats[day].views++;
                    dailyStats[day].visitors.add(v.visitor_id);
                });

                const weeklyStats = Object.entries(dailyStats)
                    .map(([day, data]) => ({
                        day,
                        views: data.views,
                        unique_visitors: data.visitors.size,
                    }))
                    .sort((a, b) => a.day.localeCompare(b.day));

                setStats({
                    totalViews: totalViews || viewsData?.length || 0,
                    uniqueVisitors,
                    topPages,
                    topReferrers,
                    weeklyStats,
                });
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError("La table page_views n'existe pas encore. Exécutez le script ANALYTICS-EXECUTE-THIS.sql dans Supabase.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase]);

    if (loading) {
        return (
            <div style={{ padding: "2rem" }}>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>📊 Statistiques</h1>
                <p style={{ color: "#9ca3af" }}>Chargement des statistiques...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "2rem" }}>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>📊 Statistiques</h1>
                <div style={{
                    padding: "1.5rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px"
                }}>
                    <p style={{ color: "#fca5a5", marginBottom: "1rem" }}>{error}</p>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                        Le fichier SQL se trouve dans : <code>supabase/ANALYTICS-EXECUTE-THIS.sql</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>📊 Statistiques de visites</h1>

            {/* Métriques principales */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem"
            }}>
                <div style={{
                    background: "#1f2937",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #374151"
                }}>
                    <div style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                        Vues (30 jours)
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#60a5fa" }}>
                        {stats?.totalViews.toLocaleString("fr-FR")}
                    </div>
                </div>

                <div style={{
                    background: "#1f2937",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #374151"
                }}>
                    <div style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                        Visiteurs uniques
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#34d399" }}>
                        {stats?.uniqueVisitors.toLocaleString("fr-FR")}
                    </div>
                </div>

                <div style={{
                    background: "#1f2937",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #374151"
                }}>
                    <div style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                        Pages/Visite
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#fbbf24" }}>
                        {stats && stats.uniqueVisitors > 0
                            ? (stats.totalViews / stats.uniqueVisitors).toFixed(1)
                            : "0"}
                    </div>
                </div>
            </div>

            {/* Graphique hebdomadaire simplifié */}
            <div style={{
                background: "#1f2937",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid #374151",
                marginBottom: "2rem"
            }}>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>📈 Vues des 7 derniers jours</h2>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", height: "150px" }}>
                    {stats?.weeklyStats.map((day, i) => {
                        const maxViews = Math.max(...(stats.weeklyStats.map(d => d.views) || [1]));
                        const height = maxViews > 0 ? (day.views / maxViews) * 120 : 0;
                        return (
                            <div key={i} style={{ flex: 1, textAlign: "center" }}>
                                <div
                                    style={{
                                        height: `${height}px`,
                                        background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
                                        borderRadius: "4px 4px 0 0",
                                        minHeight: "4px"
                                    }}
                                    title={`${day.views} vues`}
                                />
                                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.5rem" }}>
                                    {new Date(day.day).toLocaleDateString("fr-FR", { weekday: "short" })}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#d1d5db" }}>
                                    {day.views}
                                </div>
                            </div>
                        );
                    })}
                    {(!stats?.weeklyStats || stats.weeklyStats.length === 0) && (
                        <p style={{ color: "#9ca3af", textAlign: "center", width: "100%" }}>
                            Aucune donnée disponible
                        </p>
                    )}
                </div>
            </div>

            {/* Top pages et referrers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {/* Top pages */}
                <div style={{
                    background: "#1f2937",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #374151"
                }}>
                    <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>📄 Pages les plus visitées</h2>
                    {stats?.topPages && stats.topPages.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {stats.topPages.map((page, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{
                                        color: "#d1d5db",
                                        fontSize: "0.9rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "70%"
                                    }}>
                                        {page.page_path === "/" ? "Accueil" : page.page_path}
                                    </span>
                                    <span style={{
                                        background: "#374151",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        fontSize: "0.8rem",
                                        color: "#60a5fa"
                                    }}>
                                        {page.views}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "#9ca3af" }}>Aucune donnée</p>
                    )}
                </div>

                {/* Top referrers */}
                <div style={{
                    background: "#1f2937",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #374151"
                }}>
                    <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>🔗 Sources de trafic</h2>
                    {stats?.topReferrers && stats.topReferrers.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {stats.topReferrers.map((ref, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{
                                        color: "#d1d5db",
                                        fontSize: "0.9rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "70%"
                                    }}>
                                        {ref.referrer === "Direct" ? "🏠 Accès direct" :
                                            ref.referrer.includes("google") ? "🔍 Google" :
                                                ref.referrer.includes("facebook") ? "📘 Facebook" :
                                                    ref.referrer.includes("twitter") ? "🐦 Twitter" :
                                                        ref.referrer.includes("linkedin") ? "💼 LinkedIn" :
                                                            ref.referrer}
                                    </span>
                                    <span style={{
                                        background: "#374151",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        fontSize: "0.8rem",
                                        color: "#34d399"
                                    }}>
                                        {ref.views}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "#9ca3af" }}>Aucune donnée</p>
                    )}
                </div>
            </div>
        </div>
    );
}
