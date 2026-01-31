"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  status: "draft" | "pending" | "published" | "rejected";
  views_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

const CATEGORIES = [
  { value: "entrepreneur", label: "Entrepreneur", icon: "👤", description: "Biographie d'un entrepreneur africain" },
  { value: "entreprise", label: "Entreprise", icon: "🏢", description: "Présentation d'une entreprise africaine" },
  { value: "thematique", label: "Thématique", icon: "📚", description: "Article sur un sujet (ex: Fintech en Afrique)" },
  { value: "pays", label: "Pays", icon: "🌍", description: "L'entrepreneuriat dans un pays africain" },
  { value: "secteur", label: "Secteur", icon: "📊", description: "Analyse d'un secteur d'activité" },
  { value: "actualite", label: "Actualité", icon: "📰", description: "Actualité de l'entrepreneuriat africain" },
];

export default function ArticlesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", category: "thematique" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) setArticles(data as Article[]);
      setLoading(false);
    };

    fetchArticles();
  }, [router, supabase]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title.trim()) return;

    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = generateSlug(newArticle.title) + "-" + Date.now().toString(36);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("articles")
      .insert({
        author_id: user.id,
        title: newArticle.title,
        slug,
        category: newArticle.category,
        content: "",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création article:", error);
      alert("Erreur lors de la création de l'article");
    } else if (data) {
      router.push(`/dashboard/articles/${data.id}`);
    }

    setCreating(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Supprimer cet article ? Cette action est irréversible.")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("articles").delete().eq("id", id);
    if (!error) {
      setArticles(articles.filter((a) => a.id !== id));
    }
  };

  const getStatusBadge = (status: Article["status"]) => {
    switch (status) {
      case "published":
        return <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#d4edda", color: "#155724" }}>✓ Publié</span>;
      case "pending":
        return <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#fff3cd", color: "#856404" }}>⏳ En révision</span>;
      case "draft":
        return <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#e9ecef", color: "#495057" }}>📝 Brouillon</span>;
      case "rejected":
        return <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#f8d7da", color: "#721c24" }}>✗ Refusé</span>;
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[2];
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.5rem", fontWeight: "normal", margin: "0 0 0.5rem 0" }}>
            Mes contributions
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Écrivez des articles sur des entrepreneurs, entreprises ou thématiques africaines
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          style={{
            background: "var(--link-color)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.25rem",
            cursor: "pointer",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ✏️ Nouvel article
        </button>
      </div>

      {/* Formulaire de création */}
      {showNewForm && (
        <div style={{ background: "var(--background)", border: "1px solid var(--border-light)", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>Créer un nouvel article</h2>
          
          <form onSubmit={handleCreateArticle}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Catégorie
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "1rem",
                      border: newArticle.category === cat.value ? "2px solid var(--link-color)" : "1px solid var(--border-light)",
                      cursor: "pointer",
                      background: newArticle.category === cat.value ? "#e6f2ff" : "var(--background)",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={newArticle.category === cat.value}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                      style={{ display: "none" }}
                    />
                    <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{cat.icon}</span>
                    <span style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{cat.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{cat.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Titre de l&apos;article
              </label>
              <input
                type="text"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                placeholder={
                  newArticle.category === "entrepreneur" ? "Ex: Aliko Dangote" :
                  newArticle.category === "entreprise" ? "Ex: Flutterwave" :
                  newArticle.category === "pays" ? "Ex: L'entrepreneuriat au Sénégal" :
                  newArticle.category === "secteur" ? "Ex: La Fintech en Afrique de l'Ouest" :
                  "Ex: Les défis de l'entrepreneuriat en Afrique"
                }
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-color)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                style={{ padding: "0.6rem 1rem", border: "1px solid var(--border-color)", background: "none", cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating || !newArticle.title.trim()}
                style={{
                  padding: "0.6rem 1.5rem",
                  background: "var(--link-color)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {creating ? "Création..." : "Créer et éditer →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info box */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1rem", marginBottom: "1.5rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>💡 Comment contribuer ?</h4>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
          <li><strong>Entrepreneur</strong> : Rédigez la biographie d&apos;un entrepreneur africain (autre que vous)</li>
          <li><strong>Entreprise</strong> : Présentez une entreprise africaine, son histoire, ses services</li>
          <li><strong>Thématique</strong> : Écrivez sur un sujet lié à l&apos;entrepreneuriat africain</li>
          <li>Vos articles seront relus avant publication pour garantir la qualité encyclopédique</li>
        </ul>
      </div>

      {/* Liste des articles */}
      <div style={{ background: "var(--background)", border: "1px solid var(--border-light)" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-light)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
            Mes articles ({articles.length})
          </h2>
        </div>

        {articles.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "2rem", margin: "0 0 1rem 0" }}>📝</p>
            <p style={{ margin: 0 }}>Vous n&apos;avez pas encore écrit d&apos;article.</p>
            <p style={{ margin: "0.5rem 0 0" }}>Commencez à contribuer à l&apos;encyclopédie africaine !</p>
          </div>
        ) : (
          <div>
            {articles.map((article) => {
              const cat = getCategoryInfo(article.category);
              return (
                <div
                  key={article.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <Link
                        href={`/dashboard/articles/${article.id}`}
                        style={{ fontWeight: 600, color: "var(--link-color)", fontSize: "1rem" }}
                      >
                        {article.title}
                      </Link>
                      {getStatusBadge(article.status)}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {cat.label} · Modifié le {new Date(article.updated_at).toLocaleDateString("fr-FR")}
                      {article.status === "published" && article.views_count > 0 && (
                        <> · {article.views_count} vue{article.views_count > 1 ? "s" : ""}</>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link
                      href={`/dashboard/articles/${article.id}`}
                      style={{
                        padding: "0.4rem 0.75rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--background)",
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                      }}
                    >
                      Éditer
                    </Link>
                    {article.status === "published" && (
                      <Link
                        href={`/wiki/${article.slug}`}
                        target="_blank"
                        style={{
                          padding: "0.4rem 0.75rem",
                          border: "1px solid var(--link-color)",
                          background: "var(--link-color)",
                          color: "white",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                        }}
                      >
                        Voir
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      style={{
                        padding: "0.4rem 0.75rem",
                        border: "1px solid #dc3545",
                        background: "none",
                        color: "#dc3545",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/dashboard" style={{ color: "var(--link-color)" }}>← Retour au tableau de bord</Link>
      </div>
    </div>
  );
}
