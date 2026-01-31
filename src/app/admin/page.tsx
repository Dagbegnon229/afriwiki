"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalUsers: number;
  totalEntrepreneurs: number;
  publishedEntrepreneurs: number;
  pendingEntrepreneurs: number;
  verifiedEntrepreneurs: number;
  totalArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  pendingSources: number;
  pendingReports: number;
}

interface TopItem {
  id: string;
  name: string;
  slug: string;
  views: number;
  type: "entrepreneur" | "article";
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEntrepreneurs: 0,
    publishedEntrepreneurs: 0,
    pendingEntrepreneurs: 0,
    verifiedEntrepreneurs: 0,
    totalArticles: 0,
    publishedArticles: 0,
    pendingArticles: 0,
    pendingSources: 0,
    pendingReports: 0,
  });
  const [topEntrepreneurs, setTopEntrepreneurs] = useState<TopItem[]>([]);
  const [topArticles, setTopArticles] = useState<TopItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Entrepreneurs stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entrepreneurs } = await supabase.from("entrepreneurs").select("id, is_published, verification_level, views_count, first_name, last_name, slug") as { data: any[] | null };
    
    // Articles stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: articles } = await supabase.from("articles").select("id, status, views_count, title, slug") as { data: any[] | null };
    
    // Sources stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sources } = await supabase.from("sources").select("id, status") as { data: any[] | null };
    
    // Reports stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reports } = await (supabase as any).from("reports").select("id, status") as { data: any[] | null };

    // Calculate stats
    if (entrepreneurs) {
      setStats((prev) => ({
        ...prev,
        totalEntrepreneurs: entrepreneurs.length,
        publishedEntrepreneurs: entrepreneurs.filter((e) => e.is_published).length,
        pendingEntrepreneurs: entrepreneurs.filter((e) => !e.is_published).length,
        verifiedEntrepreneurs: entrepreneurs.filter((e) => e.verification_level >= 2).length,
      }));

      // Top entrepreneurs by views
      const sortedEntrepreneurs = [...entrepreneurs]
        .filter((e) => e.is_published)
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 5)
        .map((e) => ({
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          slug: e.slug,
          views: e.views_count || 0,
          type: "entrepreneur" as const,
        }));
      setTopEntrepreneurs(sortedEntrepreneurs);
    }

    if (articles) {
      setStats((prev) => ({
        ...prev,
        totalArticles: articles.length,
        publishedArticles: articles.filter((a) => a.status === "published").length,
        pendingArticles: articles.filter((a) => a.status === "pending").length,
      }));

      // Top articles by views
      const sortedArticles = [...articles]
        .filter((a) => a.status === "published")
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          name: a.title,
          slug: a.slug,
          views: a.views_count || 0,
          type: "article" as const,
        }));
      setTopArticles(sortedArticles);
    }

    if (sources) {
      setStats((prev) => ({
        ...prev,
        pendingSources: sources.filter((s) => s.status === "pending").length,
      }));
    }

    if (reports) {
      setStats((prev) => ({
        ...prev,
        pendingReports: reports.filter((r: { status: string }) => r.status === "pending").length,
      }));
    }

    // Recent activity (simulate from different sources)
    const activities: RecentActivity[] = [];

    // Get recent entrepreneurs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentEntrepreneurs } = await supabase
      .from("entrepreneurs")
      .select("id, first_name, last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(3) as { data: any[] | null };

    if (recentEntrepreneurs) {
      recentEntrepreneurs.forEach((e: { id: string; first_name: string; last_name: string; created_at: string }) => {
        activities.push({
          id: e.id,
          type: "profile",
          description: `Nouveau profil : ${e.first_name} ${e.last_name}`,
          timestamp: e.created_at,
          icon: "👤",
        });
      });
    }

    // Get recent articles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentArticles } = await supabase
      .from("articles")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(3) as { data: any[] | null };

    if (recentArticles) {
      recentArticles.forEach((a: { id: string; title: string; created_at: string }) => {
        activities.push({
          id: a.id,
          type: "article",
          description: `Nouvel article : ${a.title}`,
          timestamp: a.created_at,
          icon: "📝",
        });
      });
    }

    // Sort by timestamp and take top 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivity(activities.slice(0, 10));

    setLoading(false);
  };

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement du dashboard...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          📊 Dashboard Admin
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          Vue d&apos;ensemble de la plateforme AfriWiki
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard icon="👥" label="Entrepreneurs" value={stats.totalEntrepreneurs} color="#3b82f6" />
        <StatCard icon="✓" label="Publiés" value={stats.publishedEntrepreneurs} color="#22c55e" />
        <StatCard icon="⏳" label="En attente" value={stats.pendingEntrepreneurs} color="#f59e0b" />
        <StatCard icon="✅" label="Vérifiés" value={stats.verifiedEntrepreneurs} color="#8b5cf6" />
        <StatCard icon="📝" label="Articles" value={stats.totalArticles} color="#06b6d4" />
        <StatCard icon="📤" label="Articles publiés" value={stats.publishedArticles} color="#22c55e" />
      </div>

      {/* Alerts / Pending Items */}
      {(stats.pendingArticles > 0 || stats.pendingSources > 0 || stats.pendingReports > 0) && (
        <div style={{
          background: "rgba(251, 191, 36, 0.1)",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
        }}>
          <h3 style={{ margin: "0 0 0.75rem", color: "#fbbf24", fontSize: "1rem" }}>⚠️ Actions requises</h3>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {stats.pendingArticles > 0 && (
              <Link href="/admin/articles" style={{ color: "#fbbf24", textDecoration: "none" }}>
                📝 {stats.pendingArticles} article(s) à valider
              </Link>
            )}
            {stats.pendingSources > 0 && (
              <Link href="/admin/sources" style={{ color: "#fbbf24", textDecoration: "none" }}>
                🔗 {stats.pendingSources} source(s) à vérifier
              </Link>
            )}
            {stats.pendingReports > 0 && (
              <Link href="/admin/moderation" style={{ color: "#ef4444", textDecoration: "none" }}>
                🚨 {stats.pendingReports} signalement(s) à traiter
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Top Entrepreneurs */}
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
            🏆 Profils les plus consultés
          </h2>
          {topEntrepreneurs.length === 0 ? (
            <p style={{ color: "#9ca3af", margin: 0 }}>Pas encore de données</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topEntrepreneurs.map((item, index) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{
                    width: "24px",
                    height: "24px",
                    background: index < 3 ? "#fbbf24" : "#4b5563",
                    color: index < 3 ? "#1f2937" : "#e2e8f0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}>
                    {index + 1}
                  </span>
                  <Link href={`/e/${item.slug}`} style={{ flex: 1, color: "#60a5fa", textDecoration: "none" }}>
                    {item.name}
                  </Link>
                  <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                    {item.views} vues
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Articles */}
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
            📰 Articles les plus consultés
          </h2>
          {topArticles.length === 0 ? (
            <p style={{ color: "#9ca3af", margin: 0 }}>Pas encore de données</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topArticles.map((item, index) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{
                    width: "24px",
                    height: "24px",
                    background: index < 3 ? "#fbbf24" : "#4b5563",
                    color: index < 3 ? "#1f2937" : "#e2e8f0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}>
                    {index + 1}
                  </span>
                  <Link href={`/articles/${item.slug}`} style={{ flex: 1, color: "#60a5fa", textDecoration: "none" }}>
                    {item.name}
                  </Link>
                  <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                    {item.views} vues
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "1.25rem", gridColumn: "span 2" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
            🕒 Activité récente
          </h2>
          {recentActivity.length === 0 ? (
            <p style={{ color: "#9ca3af", margin: 0 }}>Pas encore d&apos;activité</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentActivity.map((activity) => (
                <div key={activity.id + activity.timestamp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", background: "#374151", borderRadius: "4px" }}>
                  <span style={{ fontSize: "1.25rem" }}>{activity.icon}</span>
                  <span style={{ flex: 1 }}>{activity.description}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "1.25rem", gridColumn: "span 2" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
            ⚡ Actions rapides
          </h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <QuickActionButton href="/admin/profils" icon="👤" label="Valider profils" count={stats.pendingEntrepreneurs} />
            <QuickActionButton href="/admin/articles" icon="📝" label="Modérer articles" count={stats.pendingArticles} />
            <QuickActionButton href="/admin/sources" icon="🔗" label="Vérifier sources" count={stats.pendingSources} />
            <QuickActionButton href="/admin/moderation" icon="🚨" label="Signalements" count={stats.pendingReports} />
            <QuickActionButton href="/admin/une" icon="⭐" label="À la une" />
            <QuickActionButton href="/admin/parametres" icon="⚙️" label="Paramètres" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "#1f2937",
      border: "1px solid #374151",
      borderRadius: "8px",
      padding: "1rem",
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.25rem" }}>{icon}</span>
        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>{label}</span>
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function QuickActionButton({ href, icon, label, count }: { href: string; icon: string; label: string; count?: number }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        background: "#374151",
        border: "1px solid #4b5563",
        borderRadius: "6px",
        color: "#e2e8f0",
        textDecoration: "none",
        transition: "background 0.2s",
      }}
    >
      <span style={{ fontSize: "1.25rem" }}>{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          background: "#ef4444",
          color: "white",
          padding: "0.1rem 0.5rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}>
          {count}
        </span>
      )}
    </Link>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}
