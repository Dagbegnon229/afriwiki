"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface FeaturedItem {
  id: string;
  item_type: "entrepreneur" | "article";
  item_id: string;
  position: number;
  starts_at: string;
  ends_at: string | null;
  reason: string | null;
  created_at: string;
  // Données jointes
  item_name?: string;
  item_slug?: string;
}

interface Entrepreneur {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  headline: string | null;
  photo_url: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
}

export default function AdminFeaturedPage() {
  const supabase = createClient();
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    item_type: "entrepreneur" as "entrepreneur" | "article",
    item_id: "",
    position: 1,
    duration: "indefinite", // 'indefinite', '1day', '1week', '1month', 'custom'
    custom_end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Récupérer les éléments à la une
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: featured } = await (supabase as any)
      .from("featured_items")
      .select("*")
      .order("position", { ascending: true });

    if (featured) {
      // Enrichir avec les noms
      const enrichedItems = await Promise.all(
        featured.map(async (item: FeaturedItem) => {
          if (item.item_type === "entrepreneur") {
            const { data } = await supabase
              .from("entrepreneurs")
              .select("first_name, last_name, slug")
              .eq("id", item.item_id)
              .single();
            if (data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const d = data as any;
              return { ...item, item_name: `${d.first_name} ${d.last_name}`, item_slug: d.slug };
            }
          } else {
            const { data } = await supabase
              .from("articles")
              .select("title, slug")
              .eq("id", item.item_id)
              .single();
            if (data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const d = data as any;
              return { ...item, item_name: d.title, item_slug: d.slug };
            }
          }
          return item;
        })
      );
      setFeaturedItems(enrichedItems);
    }

    // Récupérer les entrepreneurs publiés
    const { data: entrepreneursData } = await supabase
      .from("entrepreneurs")
      .select("id, first_name, last_name, slug, headline, photo_url")
      .eq("is_published", true)
      .order("last_name");

    if (entrepreneursData) setEntrepreneurs(entrepreneursData as Entrepreneur[]);

    // Récupérer les articles publiés
    const { data: articlesData } = await supabase
      .from("articles")
      .select("id, title, slug, category")
      .eq("status", "published")
      .order("title");

    if (articlesData) setArticles(articlesData as Article[]);

    setLoading(false);
  };

  const calculateEndDate = (duration: string): string | null => {
    if (duration === "indefinite") return null;
    
    const now = new Date();
    switch (duration) {
      case "1day":
        now.setDate(now.getDate() + 1);
        break;
      case "1week":
        now.setDate(now.getDate() + 7);
        break;
      case "1month":
        now.setMonth(now.getMonth() + 1);
        break;
      case "custom":
        return formData.custom_end_date ? new Date(formData.custom_end_date).toISOString() : null;
    }
    return now.toISOString();
  };

  const handleAddFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id) {
      setMessage({ type: "error", text: "Veuillez sélectionner un élément" });
      return;
    }

    const endDate = calculateEndDate(formData.duration);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("featured_items")
      .insert({
        item_type: formData.item_type,
        item_id: formData.item_id,
        position: formData.position,
        ends_at: endDate,
        reason: formData.reason || null,
      });

    if (error) {
      console.error("Erreur:", error);
      if (error.code === "23505") {
        setMessage({ type: "error", text: "Cet élément est déjà à la une à cette position" });
      } else {
        setMessage({ type: "error", text: `Erreur: ${error.message}` });
      }
    } else {
      setMessage({ type: "success", text: "Élément ajouté à la une !" });
      setShowAddForm(false);
      setFormData({
        item_type: "entrepreneur",
        item_id: "",
        position: 1,
        duration: "indefinite",
        custom_end_date: "",
        reason: "",
      });
      fetchData();
    }
  };

  const handleRemoveFeatured = async (id: string) => {
    if (!confirm("Retirer cet élément de la une ?")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("featured_items")
      .delete()
      .eq("id", id);

    if (!error) {
      setFeaturedItems(featuredItems.filter((f) => f.id !== id));
      setMessage({ type: "success", text: "Élément retiré de la une" });
    }
  };

  const isExpired = (item: FeaturedItem) => {
    if (!item.ends_at) return false;
    return new Date(item.ends_at) < new Date();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Indéfini";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRemainingTime = (endDate: string | null) => {
    if (!endDate) return "∞";
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return "Expiré";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          ⭐ Gestion de la Une
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          Mettre en avant des profils ou articles sur la page d&apos;accueil
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

      {/* Bouton ajouter */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{
          padding: "0.75rem 1.5rem",
          background: showAddForm ? "#374151" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "1.5rem",
          fontWeight: 600,
        }}
      >
        {showAddForm ? "✕ Annuler" : "+ Ajouter à la une"}
      </button>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <form
          onSubmit={handleAddFeatured}
          style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>Nouvel élément à la une</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            {/* Type */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#d1d5db", fontSize: "0.9rem" }}>
                Type d&apos;élément
              </label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as "entrepreneur" | "article", item_id: "" })}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  color: "#f9fafb",
                }}
              >
                <option value="entrepreneur">👤 Entrepreneur</option>
                <option value="article">📝 Article</option>
              </select>
            </div>

            {/* Position */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#d1d5db", fontSize: "0.9rem" }}>
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  color: "#f9fafb",
                }}
              >
                <option value={1}>⭐ Principal (1)</option>
                <option value={2}>Secondaire (2)</option>
                <option value={3}>Tertiaire (3)</option>
                <option value={4}>Position 4</option>
                <option value={5}>Position 5</option>
              </select>
            </div>
          </div>

          {/* Sélection de l'élément */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#d1d5db", fontSize: "0.9rem" }}>
              {formData.item_type === "entrepreneur" ? "Entrepreneur" : "Article"}
            </label>
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              style={{
                width: "100%",
                padding: "0.6rem",
                background: "#374151",
                border: "1px solid #4b5563",
                borderRadius: "4px",
                color: "#f9fafb",
              }}
            >
              <option value="">-- Sélectionner --</option>
              {formData.item_type === "entrepreneur"
                ? entrepreneurs.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} {e.headline ? `— ${e.headline}` : ""}
                    </option>
                  ))
                : articles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.category})
                    </option>
                  ))}
            </select>
          </div>

          {/* Durée */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#d1d5db", fontSize: "0.9rem" }}>
                Durée
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  color: "#f9fafb",
                }}
              >
                <option value="indefinite">♾️ Indéfini</option>
                <option value="1day">24 heures</option>
                <option value="1week">1 semaine</option>
                <option value="1month">1 mois</option>
                <option value="custom">📅 Date personnalisée</option>
              </select>
            </div>

            {formData.duration === "custom" && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#d1d5db", fontSize: "0.9rem" }}>
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.custom_end_date}
                  onChange={(e) => setFormData({ ...formData, custom_end_date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    background: "#374151",
                    border: "1px solid #4b5563",
                    borderRadius: "4px",
                    color: "#f9fafb",
                  }}
                />
              </div>
            )}
          </div>

          {/* Raison */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#d1d5db", fontSize: "0.9rem" }}>
              Raison (optionnel)
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Entrepreneur du mois, Article vedette..."
              style={{
                width: "100%",
                padding: "0.6rem",
                background: "#374151",
                border: "1px solid #4b5563",
                borderRadius: "4px",
                color: "#f9fafb",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ✓ Ajouter à la une
          </button>
        </form>
      )}

      {/* Liste des éléments à la une */}
      <div style={{
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "8px",
      }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #374151" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
            Éléments actuellement à la une
          </h2>
        </div>

        {featuredItems.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
            Aucun élément à la une pour le moment
          </div>
        ) : (
          featuredItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #374151",
                opacity: isExpired(item) ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: item.position === 1 ? "#fbbf24" : "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  color: item.position === 1 ? "#000" : "#d1d5db",
                }}>
                  {item.position === 1 ? "⭐" : item.position}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>
                      {item.item_type === "entrepreneur" ? "👤" : "📝"}
                    </span>
                    <span style={{ fontWeight: 600 }}>{item.item_name || item.item_id}</span>
                    {item.reason && (
                      <span style={{
                        padding: "0.15rem 0.5rem",
                        background: "#3b82f6",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}>
                        {item.reason}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                    {isExpired(item) ? (
                      <span style={{ color: "#f87171" }}>⚠️ Expiré</span>
                    ) : (
                      <>
                        Expire : {formatDate(item.ends_at)}
                        {item.ends_at && (
                          <span style={{ marginLeft: "0.5rem", color: "#fbbf24" }}>
                            ({getRemainingTime(item.ends_at)})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <a
                  href={item.item_type === "entrepreneur" ? `/e/${item.item_slug}` : `/articles/${item.item_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.4rem 0.75rem",
                    background: "#374151",
                    color: "#d1d5db",
                    border: "none",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                  }}
                >
                  Voir
                </a>
                <button
                  onClick={() => handleRemoveFeatured(item.id)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Retirer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
