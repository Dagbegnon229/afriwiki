"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => <div style={{ padding: "1rem", background: "#f3f4f6", border: "1px solid #d1d5db" }}>Chargement de l&apos;éditeur...</div>,
});

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  category: string;
  cover_image_url: string | null;
  status: "draft" | "pending" | "published" | "rejected";
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "entrepreneur", label: "Entrepreneur", icon: "👤" },
  { value: "entreprise", label: "Entreprise", icon: "🏢" },
  { value: "thematique", label: "Thématique", icon: "📚" },
  { value: "pays", label: "Pays", icon: "🌍" },
  { value: "secteur", label: "Secteur", icon: "📊" },
  { value: "actualite", label: "Actualité", icon: "📰" },
];

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    category: "thematique",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .eq("author_id", user.id)
        .single();

      if (error || !data) {
        router.push("/dashboard/articles");
        return;
      }

      const articleData = data as Article;
      setArticle(articleData);
      setFormData({
        title: articleData.title,
        subtitle: articleData.subtitle || "",
        content: articleData.content || "",
        category: articleData.category,
      });
      setLoading(false);
    };

    fetchArticle();
  }, [id, router, supabase]);

  const handleSave = async () => {
    if (!article) return;
    setSaving(true);
    setMessage(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("articles")
      .update({
        title: formData.title,
        subtitle: formData.subtitle || null,
        content: formData.content,
        category: formData.category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", article.id);

    if (error) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } else {
      setMessage({ type: "success", text: "Article sauvegardé !" });
    }

    setSaving(false);
  };

  const handleSubmitForReview = async () => {
    if (!article) return;
    if (!formData.content || formData.content.length < 100) {
      setMessage({ type: "error", text: "L'article doit contenir au moins 100 caractères" });
      return;
    }

    setSaving(true);
    setMessage(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("articles")
      .update({
        title: formData.title,
        subtitle: formData.subtitle || null,
        content: formData.content,
        category: formData.category,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", article.id);

    if (error) {
      setMessage({ type: "error", text: "Erreur lors de la soumission" });
    } else {
      setMessage({ type: "success", text: "Article soumis pour révision ! Vous serez notifié par email." });
      setArticle({ ...article, status: "pending" });
    }

    setSaving(false);
  };

  const getStatusBadge = (status: Article["status"]) => {
    switch (status) {
      case "published":
        return <span style={{ padding: "0.25rem 0.75rem", background: "#d4edda", color: "#155724" }}>✓ Publié</span>;
      case "pending":
        return <span style={{ padding: "0.25rem 0.75rem", background: "#fff3cd", color: "#856404" }}>⏳ En révision</span>;
      case "draft":
        return <span style={{ padding: "0.25rem 0.75rem", background: "#e9ecef", color: "#495057" }}>📝 Brouillon</span>;
      case "rejected":
        return <span style={{ padding: "0.25rem 0.75rem", background: "#f8d7da", color: "#721c24" }}>✗ Refusé</span>;
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[2];
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Chargement...</div>;
  }

  if (!article) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Article non trouvé</div>;
  }

  const cat = getCategoryInfo(article.category);

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <Link href="/dashboard/articles" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            ← Mes contributions
          </Link>
          <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.25rem", fontWeight: "normal", margin: "0.5rem 0 0" }}>
            {cat.icon} Éditer l&apos;article
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {getStatusBadge(article.status)}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          background: message.type === "success" ? "#dcfce7" : "#fee2e2",
          color: message.type === "success" ? "#166534" : "#991b1b",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Editor */}
      <div style={{ background: "var(--background)", border: "1px solid var(--border-light)", marginBottom: "1rem" }}>
        {/* Title */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-light)" }}>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Titre de l&apos;article *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre principal"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid var(--border-color)",
              fontSize: "1.25rem",
              fontFamily: "'Libre Baskerville', Georgia, serif",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Subtitle */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-light)" }}>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Sous-titre (optionnel)
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Description courte ou accroche"
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid var(--border-color)",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-light)" }}>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Catégorie
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{
              padding: "0.6rem",
              border: "1px solid var(--border-color)",
              fontSize: "1rem",
              minWidth: "200px",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Contenu de l&apos;article *
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Rédigez votre article ici. Utilisez les outils de formatage pour structurer votre contenu..."
            minHeight="400px"
          />
        </div>
      </div>

      {/* Guidelines */}
      <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", padding: "1rem", marginBottom: "1.5rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>📋 Conseils de rédaction</h4>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
          <li>Adoptez un <strong>ton encyclopédique neutre</strong> (pas de promotion)</li>
          <li>Structurez avec des titres : ## Section et ### Sous-section</li>
          <li>Citez vos sources quand vous mentionnez des faits</li>
          <li>Minimum 100 caractères requis pour soumettre</li>
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/dashboard/articles" style={{ color: "var(--text-secondary)" }}>
          Annuler
        </Link>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.6rem 1.25rem",
              border: "1px solid var(--border-color)",
              background: "var(--background)",
              cursor: "pointer",
            }}
          >
            {saving ? "..." : "Sauvegarder le brouillon"}
          </button>
          {article.status === "draft" && (
            <button
              onClick={handleSubmitForReview}
              disabled={saving}
              style={{
                padding: "0.6rem 1.25rem",
                background: "#22c55e",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              {saving ? "..." : "Soumettre pour révision →"}
            </button>
          )}
          {article.status === "published" && (
            <Link
              href={`/wiki/${article.slug}`}
              target="_blank"
              style={{
                padding: "0.6rem 1.25rem",
                background: "var(--link-color)",
                color: "white",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Voir l&apos;article publié →
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginTop: "2rem", padding: "1rem", background: "var(--background-secondary)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        Créé le {new Date(article.created_at).toLocaleDateString("fr-FR")} · 
        Dernière modification le {new Date(article.updated_at).toLocaleDateString("fr-FR")} · 
        {formData.content.length} caractères
      </div>
    </div>
  );
}
