"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/data/demo";

interface Entrepreneur {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  country: string | null;
  city: string | null;
  verification_level: number;
  is_published: boolean;
  views_count: number;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email || "");

      const { data } = await supabase
        .from("entrepreneurs")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) setEntrepreneur(data);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const calculateCompleteness = (e: Entrepreneur | null) => {
    if (!e) return { percentage: 0, missing: ["Créer votre page"] };

    const fields = [
      { label: "Prénom", value: e.first_name },
      { label: "Nom", value: e.last_name },
      { label: "Titre", value: e.headline },
      { label: "Biographie", value: e.bio && e.bio.length > 100 },
      { label: "Photo", value: e.photo_url },
      { label: "Pays", value: e.country },
      { label: "Ville", value: e.city },
    ];

    const completed = fields.filter((f) => f.value);
    const missing = fields.filter((f) => !f.value).map((f) => f.label);
    return { percentage: Math.round((completed.length / fields.length) * 100), missing };
  };

  const completeness = calculateCompleteness(entrepreneur);
  const country = entrepreneur?.country ? COUNTRIES.find((c) => c.code === entrepreneur.country) : null;

  const verificationLabels: Record<number, { icon: string; label: string }> = {
    0: { icon: "⚪", label: "Non vérifié" },
    1: { icon: "🔵", label: "Basique" },
    2: { icon: "✓", label: "Vérifié" },
    3: { icon: "⭐", label: "Pro" },
    4: { icon: "👑", label: "Notable" },
  };

  const verification = verificationLabels[entrepreneur?.verification_level || 0];

  if (loading) {
    return <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>Chargement...</p>;
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "normal", fontFamily: "'Libre Baskerville', Georgia, serif", marginBottom: "0.25rem", color: "#111827" }}>
          Bonjour, {userName.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "#6b7280", margin: 0 }}>Gérez votre page encyclopédique Afriwiki</p>
      </div>

      {/* Main card */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderLeft: "4px solid #2563eb", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0, color: "#111827" }}>Votre page Afriwiki</h2>
          {entrepreneur?.is_published && (
            <Link href={`/e/${entrepreneur.slug}`} target="_blank" style={{ color: "#2563eb", fontSize: "0.9rem" }}>
              Voir ma page →
            </Link>
          )}
        </div>

        {!entrepreneur ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>📄</div>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem 0" }}>Vous n&apos;avez pas encore de page</h3>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
              Créez votre page encyclopédique pour apparaître sur Afriwiki et gagner en visibilité.
            </p>
            <Link href="/dashboard/creer" style={{ display: "inline-block", backgroundColor: "#2563eb", color: "#fff", padding: "0.75rem 1.5rem", textDecoration: "none", fontWeight: 500 }}>
              Créer ma page entrepreneur →
            </Link>
          </div>
        ) : (
          <>
            {/* Profile preview */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#f3f4f6", border: "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>
                  {entrepreneur.first_name.charAt(0)}{entrepreneur.last_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.25rem 0", color: "#111827" }}>
                    {entrepreneur.first_name} {entrepreneur.last_name}
                  </h3>
                  {entrepreneur.headline && <p style={{ color: "#6b7280", margin: "0 0 0.25rem 0", fontSize: "0.9rem" }}>{entrepreneur.headline}</p>}
                  <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
                    {country && `${country.flag_emoji} ${country.name}`}
                    {entrepreneur.city && country && " · "}
                    {entrepreneur.city}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem", backgroundColor: entrepreneur.is_published ? "#dcfce7" : "#fef9c3", color: entrepreneur.is_published ? "#166534" : "#854d0e" }}>
                  {entrepreneur.is_published ? "● Publiée" : "○ Brouillon"}
                </span>
                <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem", backgroundColor: "#f3f4f6", color: "#374151" }}>
                  {verification.icon} {verification.label}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "#4b5563" }}>Complétude de la page</span>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>{completeness.percentage}%</span>
              </div>
              <div style={{ height: "8px", backgroundColor: "#f3f4f6", borderRadius: "4px", overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #2563eb, #22c55e)", width: `${completeness.percentage}%`, transition: "width 0.3s" }} />
              </div>
              {completeness.missing.length > 0 && (
                <div style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: 500, color: "#854d0e" }}>⚠ Manquant :</span>
                  <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.25rem", color: "#a16207" }}>
                    {completeness.missing.slice(0, 3).map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              )}
              <Link href="/dashboard/editer" style={{ display: "inline-block", border: "1px solid #2563eb", color: "#2563eb", padding: "0.5rem 1rem", textDecoration: "none", fontSize: "0.9rem" }}>
                Compléter ma page →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {entrepreneur && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { icon: "👁️", value: entrepreneur.views_count.toLocaleString("fr-FR"), label: "consultations" },
            { icon: "🔗", value: "0", label: "sources validées" },
            { icon: verification.icon, value: `Niveau ${entrepreneur.verification_level}`, label: "vérification" },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>{stat.value}</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Todo list */}
      {entrepreneur && (
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0", paddingBottom: "0.75rem", borderBottom: "1px solid #f3f4f6", color: "#111827" }}>À faire</h2>
          <div>
            {[
              { show: !entrepreneur.photo_url, text: "Ajouter une photo de profil", link: "/dashboard/editer", action: "Ajouter" },
              { show: !entrepreneur.bio || entrepreneur.bio.length < 100, text: "Compléter la biographie", link: "/dashboard/editer", action: "Éditer" },
              { show: entrepreneur.verification_level < 2, text: "Passer au niveau 2", link: "/dashboard/sources", action: "Vérifier" },
              { show: true, text: "Ajouter des sources vérifiables", link: "/dashboard/sources", action: "Ajouter" },
            ].filter((t) => t.show).map((todo) => (
              <div key={todo.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ color: "#9ca3af" }}>□</span>
                <span style={{ flex: 1 }}>{todo.text}</span>
                <Link href={todo.link} style={{ fontSize: "0.85rem", color: "#2563eb" }}>{todo.action} →</Link>
              </div>
            ))}
            {!entrepreneur.is_published && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.5rem", backgroundColor: "#fefce8", margin: "0 -1.5rem -1.5rem", marginTop: "0.5rem" }}>
                <span style={{ color: "#ca8a04" }}>□</span>
                <span style={{ flex: 1, fontWeight: 500 }}>Publier votre page</span>
                <Link href="/dashboard/editer" style={{ fontSize: "0.85rem", color: "#2563eb" }}>Publier →</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
