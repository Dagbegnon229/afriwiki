"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SafeHtml } from "@/components/SafeHtml";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "draft" | "pending" | "published" | "rejected";
  content: string;
  views_count: number;
  created_at: string;
  published_at: string | null;
  author_id: string;
}

interface DeletedArticle {
  id: string;
  original_data: Article;
  deletion_reason: string | null;
  deleted_at: string;
}

export default function AdminArticlesPage() {
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [deletedArticles, setDeletedArticles] = useState<DeletedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchDeletedArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setArticles(data as Article[]);
    setLoading(false);
  };

  const fetchDeletedArticles = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("deleted_articles")
      .select("*")
      .order("deleted_at", { ascending: false });

    if (data) setDeletedArticles(data);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const updateData: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === "published") {
      updateData.published_at = new Date().toISOString();
    } else if (newStatus === "rejected" && rejectionReason) {
      // Stocker le motif de rejet (dans un champ ou table séparé)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("articles")
      .update(updateData)
      .eq("id", id);

    if (!error) {
      setArticles(articles.map((a) => a.id === id ? { ...a, status: newStatus as Article["status"] } : a));
      setSelectedArticle(null);
      setRejectionReason("");
      setMessage({ type: "success", text: newStatus === "published" ? "Article publié !" : "Statut mis à jour" });
    } else {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    }
  };

  const handleEditArticle = async () => {
    if (!selectedArticle) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("articles")
      .update({
        title: editTitle,
        content: editContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedArticle.id);

    if (!error) {
      setArticles(articles.map((a) => 
        a.id === selectedArticle.id ? { ...a, title: editTitle, content: editContent } : a
      ));
      setSelectedArticle({ ...selectedArticle, title: editTitle, content: editContent });
      setEditMode(false);
      setMessage({ type: "success", text: "Article modifié !" });
    } else {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    }
  };

  const handleDelete = async (id: string) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    const reason = prompt("Motif de suppression (optionnel):");
    if (reason === null) return; // User cancelled

    // Archiver l'article avant suppression
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("deleted_articles")
      .insert({
        id: article.id,
        original_data: article,
        deletion_reason: reason || null,
      });

    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (!error) {
      setArticles(articles.filter((a) => a.id !== id));
      setSelectedArticle(null);
      setMessage({ type: "success", text: "Article supprimé (archivé pour restauration)" });
      fetchDeletedArticles();
    }
  };

  const handleRestoreArticle = async (deletedArticle: DeletedArticle) => {
    // Restaurer l'article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from("articles")
      .insert({
        ...deletedArticle.original_data,
        status: "draft", // Restaurer en brouillon
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      setMessage({ type: "error", text: `Erreur: ${insertError.message}` });
      return;
    }

    // Supprimer de deleted_articles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("deleted_articles")
      .delete()
      .eq("id", deletedArticle.id);

    setMessage({ type: "success", text: "Article restauré en brouillon !" });
    fetchArticles();
    fetchDeletedArticles();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("⚠️ Cette action est IRRÉVERSIBLE. Supprimer définitivement ?")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("deleted_articles")
      .delete()
      .eq("id", id);

    setDeletedArticles(deletedArticles.filter((a) => a.id !== id));
    setMessage({ type: "success", text: "Article supprimé définitivement" });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; text: string }> = {
      published: { bg: "rgba(34, 197, 94, 0.2)", color: "#4ade80", text: "Publié" },
      pending: { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", text: "En attente" },
      draft: { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af", text: "Brouillon" },
      rejected: { bg: "rgba(239, 68, 68, 0.2)", color: "#f87171", text: "Rejeté" },
    };
    const s = styles[status] || styles.draft;
    return (
      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", background: s.bg, color: s.color }}>
        {s.text}
      </span>
    );
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      entrepreneur: "👤",
      entreprise: "🏢",
      thematique: "📚",
      pays: "🌍",
      secteur: "📊",
      actualite: "📰",
    };
    return icons[cat] || "📝";
  };

  const filteredArticles = articles.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const pendingCount = articles.filter((a) => a.status === "pending").length;

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          📝 Gestion des articles
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          {articles.length} article(s) • {pendingCount} en attente • {deletedArticles.length} supprimé(s)
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

      {/* Tabs: Articles / Deleted */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setShowDeleted(false)}
          style={{
            padding: "0.75rem 1.25rem",
            background: !showDeleted ? "#3b82f6" : "#374151",
            color: !showDeleted ? "white" : "#d1d5db",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: !showDeleted ? 600 : 400,
          }}
        >
          📝 Articles ({articles.length})
        </button>
        <button
          onClick={() => setShowDeleted(true)}
          style={{
            padding: "0.75rem 1.25rem",
            background: showDeleted ? "#3b82f6" : "#374151",
            color: showDeleted ? "white" : "#d1d5db",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: showDeleted ? 600 : 400,
          }}
        >
          🗑️ Corbeille ({deletedArticles.length})
        </button>
      </div>

      {!showDeleted ? (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {[
              { value: "all", label: "Tous" },
              { value: "pending", label: `En attente (${pendingCount})` },
              { value: "published", label: "Publiés" },
              { value: "rejected", label: "Rejetés" },
              { value: "draft", label: "Brouillons" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: "0.5rem 1rem",
                  background: filter === f.value ? "#4b5563" : "#374151",
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
            {/* Articles List */}
            <div style={{ flex: 1 }}>
              <div style={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}>
                {filteredArticles.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                    Aucun article dans cette catégorie
                  </div>
                ) : (
                  filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => {
                        setSelectedArticle(article);
                        setEditTitle(article.title);
                        setEditContent(article.content);
                        setEditMode(false);
                      }}
                      style={{
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid #374151",
                        cursor: "pointer",
                        background: selectedArticle?.id === article.id ? "#374151" : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>{getCategoryIcon(article.category)}</span>
                        <span style={{ fontWeight: 600, flex: 1 }}>{article.title}</span>
                        {getStatusBadge(article.status)}
                      </div>
                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "#9ca3af" }}>
                        <span>Créé le {new Date(article.created_at).toLocaleDateString("fr-FR")}</span>
                        <span>•</span>
                        <span>{article.views_count || 0} vues</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Article Preview / Edit */}
            {selectedArticle && (
              <div style={{
                width: "450px",
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "1.5rem",
                position: "sticky",
                top: "1rem",
                maxHeight: "calc(100vh - 6rem)",
                overflowY: "auto",
              }}>
                {editMode ? (
                  /* Edit Mode */
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>✏️ Modifier l&apos;article</h2>
                      <button
                        onClick={() => setEditMode(false)}
                        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#9ca3af" }}>Titre</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          background: "#374151",
                          border: "1px solid #4b5563",
                          borderRadius: "4px",
                          color: "#f9fafb",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#9ca3af" }}>Contenu</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          background: "#374151",
                          border: "1px solid #4b5563",
                          borderRadius: "4px",
                          color: "#f9fafb",
                          minHeight: "300px",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={handleEditArticle}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        💾 Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        style={{
                          padding: "0.75rem 1rem",
                          background: "#374151",
                          color: "#d1d5db",
                          border: "1px solid #4b5563",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  /* Preview Mode */
                  <>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
                      {selectedArticle.title}
                    </h2>
                    
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      {getStatusBadge(selectedArticle.status)}
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", background: "#374151", color: "#9ca3af" }}>
                        {getCategoryIcon(selectedArticle.category)} {selectedArticle.category}
                      </span>
                    </div>

                    <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#9ca3af" }}>
                      <p style={{ margin: "0.25rem 0" }}>📅 Créé: {new Date(selectedArticle.created_at).toLocaleString("fr-FR")}</p>
                      {selectedArticle.published_at && (
                        <p style={{ margin: "0.25rem 0" }}>📤 Publié: {new Date(selectedArticle.published_at).toLocaleString("fr-FR")}</p>
                      )}
                      <p style={{ margin: "0.25rem 0" }}>👁️ Vues: {selectedArticle.views_count || 0}</p>
                    </div>

                    <div style={{
                      background: "#374151",
                      padding: "1rem",
                      borderRadius: "4px",
                      marginBottom: "1.5rem",
                      maxHeight: "200px",
                      overflowY: "auto",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                    }}>
                      {selectedArticle.content ? (
                        <SafeHtml html={selectedArticle.content} maxLength={800} />
                      ) : (
                        <p style={{ color: "#9ca3af", fontStyle: "italic" }}>Aucun contenu</p>
                      )}
                    </div>

                    {/* Quick Links */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <Link
                        href={`/articles/${selectedArticle.slug}`}
                        target="_blank"
                        style={{ color: "#60a5fa", fontSize: "0.9rem", textDecoration: "none" }}
                      >
                        👁️ Voir l&apos;article →
                      </Link>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <button
                        onClick={() => setEditMode(true)}
                        style={{
                          padding: "0.75rem",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        ✏️ Modifier l&apos;article
                      </button>

                      {selectedArticle.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(selectedArticle.id, "published")}
                            style={{
                              padding: "0.75rem",
                              background: "#22c55e",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            ✓ Approuver et publier
                          </button>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                              type="text"
                              placeholder="Motif de rejet..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              style={{
                                flex: 1,
                                padding: "0.6rem",
                                background: "#374151",
                                border: "1px solid #4b5563",
                                borderRadius: "4px",
                                color: "#f9fafb",
                                fontSize: "0.9rem",
                              }}
                            />
                            <button
                              onClick={() => handleUpdateStatus(selectedArticle.id, "rejected")}
                              style={{
                                padding: "0.6rem 1rem",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              ✗ Rejeter
                            </button>
                          </div>
                        </>
                      )}

                      {selectedArticle.status === "published" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedArticle.id, "draft")}
                          style={{
                            padding: "0.75rem",
                            background: "#f59e0b",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          📥 Dépublier
                        </button>
                      )}

                      {selectedArticle.status === "rejected" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedArticle.id, "draft")}
                          style={{
                            padding: "0.75rem",
                            background: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ↩️ Remettre en brouillon
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(selectedArticle.id)}
                        style={{
                          padding: "0.75rem",
                          background: "transparent",
                          color: "#f87171",
                          border: "1px solid #f87171",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Supprimer (vers corbeille)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Deleted Articles (Trash) */
        <div style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "8px",
        }}>
          {deletedArticles.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
              🎉 La corbeille est vide
            </div>
          ) : (
            deletedArticles.map((deleted) => (
              <div
                key={deleted.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid #374151",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0", fontWeight: 600 }}>
                    {deleted.original_data.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
                    Supprimé le {new Date(deleted.deleted_at).toLocaleString("fr-FR")}
                    {deleted.deletion_reason && ` • Motif: ${deleted.deletion_reason}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleRestoreArticle(deleted)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    ↩️ Restaurer
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(deleted.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
