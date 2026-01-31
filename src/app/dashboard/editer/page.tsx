"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, SECTORS } from "@/data/demo";
import { ImageUpload } from "@/components/ImageUpload";

// Import dynamique de l'éditeur riche (évite les erreurs SSR)
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => <div style={{ padding: "1rem", background: "#f3f4f6", border: "1px solid #d1d5db" }}>Chargement de l&apos;éditeur...</div>,
});

type TabType = "identite" | "biographie" | "parcours" | "entreprises" | "recompenses";

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

interface ParcoursItem {
  id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface EntrepriseItem {
  id?: string;
  name: string;
  role: string;
  description: string;
  website: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface RecompenseItem {
  id?: string;
  title: string;
  organization: string;
  year: string;
  description: string;
  source_url: string;
}

export default function EditerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("identite");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    headline: "",
    bio: "",
    country: "",
    city: "",
    sector: "",
  });

  // Parcours, Entreprises, Récompenses
  const [parcoursList, setParcoursList] = useState<ParcoursItem[]>([]);
  const [entreprisesList, setEntreprisesList] = useState<EntrepriseItem[]>([]);
  const [recompensesList, setRecompensesList] = useState<RecompenseItem[]>([]);

  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      const { data, error } = await supabase
        .from("entrepreneurs")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        router.push("/dashboard/creer");
        return;
      }

      const entrepreneurData = data as Entrepreneur;
      setEntrepreneur(entrepreneurData);
      setFormData({
        first_name: entrepreneurData.first_name,
        last_name: entrepreneurData.last_name,
        headline: entrepreneurData.headline || "",
        bio: entrepreneurData.bio || "",
        country: entrepreneurData.country || "",
        city: entrepreneurData.city || "",
        sector: "",
      });

      // Fetch related data
      const [parcoursRes, entreprisesRes, recompensesRes] = await Promise.all([
        supabase.from("parcours").select("*").eq("entrepreneur_id", entrepreneurData.id).order("order_index"),
        supabase.from("entreprises").select("*").eq("entrepreneur_id", entrepreneurData.id).order("order_index"),
        supabase.from("recompenses").select("*").eq("entrepreneur_id", entrepreneurData.id).order("year", { ascending: false }),
      ]);

      if (parcoursRes.data) setParcoursList(parcoursRes.data as ParcoursItem[]);
      if (entreprisesRes.data) setEntreprisesList(entreprisesRes.data as EntrepriseItem[]);
      if (recompensesRes.data) setRecompensesList(recompensesRes.data as RecompenseItem[]);

      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  // Generate AI suggestions
  useEffect(() => {
    const suggestions: string[] = [];
    if (formData.bio && formData.bio.includes("je ")) {
      suggestions.push("Votre biographie utilise « je ». Préférez la troisième personne.");
    }
    if (formData.bio && formData.bio.length < 200) {
      suggestions.push("Votre biographie est courte. Ajoutez plus de détails.");
    }
    if (!formData.headline) {
      suggestions.push("Ajoutez un titre ou une fonction.");
    }
    setAiSuggestions(suggestions);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Photo upload callback
  const handlePhotoUploaded = async (url: string) => {
    if (!entrepreneur) return;
    
    // Mettre à jour la BDD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("entrepreneurs")
      .update({ photo_url: url || null })
      .eq("id", entrepreneur.id);

    if (!error) {
      setEntrepreneur((prev) => prev ? { ...prev, photo_url: url || null } : null);
      setMessage({ type: "success", text: url ? "Photo mise à jour !" : "Photo supprimée" });
    } else {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour" });
    }
  };

  // Save main data
  const handleSave = useCallback(async () => {
    if (!entrepreneur) return;
    setSaving(true);
    setMessage(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("entrepreneurs")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          headline: formData.headline || null,
          bio: formData.bio || null,
          country: formData.country || null,
          city: formData.city || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entrepreneur.id);

      if (error) throw error;
      setLastSaved(new Date());
      setMessage({ type: "success", text: "Modifications enregistrées" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  }, [entrepreneur, formData, supabase]);

  // Publish/Unpublish
  const handlePublish = async () => {
    if (!entrepreneur) return;
    setSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("entrepreneurs")
        .update({ is_published: !entrepreneur.is_published })
        .eq("id", entrepreneur.id);

      if (!error) {
        setEntrepreneur((prev) => prev ? { ...prev, is_published: !prev.is_published } : null);
        setMessage({
          type: "success",
          text: entrepreneur.is_published ? "Page dépubliée" : "Page publiée avec succès !",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Parcours CRUD
  const addParcours = () => {
    setParcoursList([...parcoursList, { title: "", description: "", start_date: "", end_date: "", is_current: false }]);
  };

  const updateParcours = (index: number, field: keyof ParcoursItem, value: string | boolean) => {
    const updated = [...parcoursList];
    updated[index] = { ...updated[index], [field]: value };
    setParcoursList(updated);
  };

  const removeParcours = async (index: number) => {
    const item = parcoursList[index];
    if (item.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("parcours").delete().eq("id", item.id);
    }
    setParcoursList(parcoursList.filter((_, i) => i !== index));
  };

  const saveParcours = async () => {
    if (!entrepreneur) return;
    setSaving(true);

    try {
      const updatedList = [...parcoursList];
      
      for (let i = 0; i < parcoursList.length; i++) {
        const item = parcoursList[i];
        
        // Préparer les données sans l'id pour l'insertion
        const insertData = {
          title: item.title,
          description: item.description || null,
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          is_current: item.is_current || false,
          entrepreneur_id: entrepreneur.id,
          order_index: i,
        };

        if (item.id) {
          // Update existant
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from("parcours")
            .update(insertData)
            .eq("id", item.id);
          
          if (error) {
            console.error("Erreur update parcours:", error);
            setMessage({ type: "error", text: `Erreur: ${error.message}` });
            return;
          }
        } else {
          // Nouvelle insertion
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newItem, error } = await (supabase as any)
            .from("parcours")
            .insert(insertData)
            .select()
            .single();
          
          if (error) {
            console.error("Erreur insert parcours:", error);
            setMessage({ type: "error", text: `Erreur: ${error.message}` });
            return;
          }
          
          if (newItem) {
            updatedList[i] = { ...item, id: newItem.id };
          }
        }
      }
      
      setParcoursList(updatedList);
      setMessage({ type: "success", text: "Parcours enregistré !" });
    } catch (err) {
      console.error("Erreur saveParcours:", err);
      setMessage({ type: "error", text: "Erreur inattendue" });
    } finally {
      setSaving(false);
    }
  };

  // Entreprises CRUD
  const addEntreprise = () => {
    setEntreprisesList([...entreprisesList, { name: "", role: "", description: "", website: "", start_date: "", end_date: "", is_current: false }]);
  };

  const updateEntreprise = (index: number, field: keyof EntrepriseItem, value: string | boolean) => {
    const updated = [...entreprisesList];
    updated[index] = { ...updated[index], [field]: value };
    setEntreprisesList(updated);
  };

  const removeEntreprise = async (index: number) => {
    const item = entreprisesList[index];
    if (item.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("entreprises").delete().eq("id", item.id);
    }
    setEntreprisesList(entreprisesList.filter((_, i) => i !== index));
  };

  const saveEntreprises = async () => {
    if (!entrepreneur) return;
    setSaving(true);

    try {
      for (let i = 0; i < entreprisesList.length; i++) {
        const item = entreprisesList[i];
        const data = { ...item, entrepreneur_id: entrepreneur.id, order_index: i };

        if (item.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("entreprises").update(data).eq("id", item.id);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newItem } = await (supabase as any).from("entreprises").insert(data).select().single();
          if (newItem) {
            const updated = [...entreprisesList];
            updated[i] = newItem;
            setEntreprisesList(updated);
          }
        }
      }
      setMessage({ type: "success", text: "Entreprises enregistrées !" });
    } catch {
      setMessage({ type: "error", text: "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  // Récompenses CRUD
  const addRecompense = () => {
    setRecompensesList([...recompensesList, { title: "", organization: "", year: "", description: "", source_url: "" }]);
  };

  const updateRecompense = (index: number, field: keyof RecompenseItem, value: string) => {
    const updated = [...recompensesList];
    updated[index] = { ...updated[index], [field]: value };
    setRecompensesList(updated);
  };

  const removeRecompense = async (index: number) => {
    const item = recompensesList[index];
    if (item.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("recompenses").delete().eq("id", item.id);
    }
    setRecompensesList(recompensesList.filter((_, i) => i !== index));
  };

  const saveRecompenses = async () => {
    if (!entrepreneur) return;
    setSaving(true);

    try {
      for (const item of recompensesList) {
        const data = { ...item, entrepreneur_id: entrepreneur.id, year: item.year ? parseInt(item.year) : null };

        if (item.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("recompenses").update(data).eq("id", item.id);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newItem } = await (supabase as any).from("recompenses").insert(data).select().single();
          if (newItem) {
            setRecompensesList((prev) => prev.map((p) => (p === item ? newItem : p)));
          }
        }
      }
      setMessage({ type: "success", text: "Récompenses enregistrées !" });
    } catch {
      setMessage({ type: "error", text: "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "identite" as TabType, label: "Identité", icon: "👤" },
    { id: "biographie" as TabType, label: "Biographie", icon: "📝" },
    { id: "parcours" as TabType, label: "Parcours", icon: "📅" },
    { id: "entreprises" as TabType, label: "Entreprises", icon: "🏢" },
    { id: "recompenses" as TabType, label: "Récompenses", icon: "🏆" },
  ];

  if (loading) {
    return <p style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Chargement...</p>;
  }

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: "normal", margin: 0 }}>
            Éditer ma page
          </h1>
          {lastSaved && (
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Enregistré à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handlePublish} disabled={saving} style={{ padding: "0.6rem 1.2rem", background: entrepreneur?.is_published ? "#fbbf24" : "#22c55e", color: entrepreneur?.is_published ? "#000" : "#fff", border: "none", cursor: "pointer" }}>
            {entrepreneur?.is_published ? "Dépublier" : "Publier"}
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "0.6rem 1.2rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {message.text}
        </div>
      )}

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "#fff", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.9rem", padding: "0.25rem 0.75rem", background: entrepreneur?.is_published ? "#dcfce7" : "#fef9c3", color: entrepreneur?.is_published ? "#166534" : "#854d0e" }}>
          {entrepreneur?.is_published ? "● Publiée" : "○ Brouillon"}
        </span>
        {entrepreneur?.is_published && (
          <Link href={`/e/${entrepreneur.slug}`} target="_blank" style={{ color: "#2563eb", fontSize: "0.9rem" }}>
            Voir la page publique →
          </Link>
        )}
      </div>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        {/* Main editor */}
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem 1.25rem", background: "none", border: "none", borderBottom: activeTab === tab.id ? "3px solid #2563eb" : "3px solid transparent", cursor: "pointer", fontSize: "0.95rem", color: activeTab === tab.id ? "#2563eb" : "#6b7280", fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap" }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "1.5rem" }}>
            {/* Identité */}
            {activeTab === "identite" && (
              <div style={{ maxWidth: "500px" }}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Prénom *</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required style={{ width: "100%", padding: "0.6rem", border: "1px solid #d1d5db", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Nom *</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required style={{ width: "100%", padding: "0.6rem", border: "1px solid #d1d5db", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Titre / Fonction</label>
                  <input type="text" name="headline" value={formData.headline} onChange={handleChange} placeholder="Ex: Fondateur de TechCorp" style={{ width: "100%", padding: "0.6rem", border: "1px solid #d1d5db", boxSizing: "border-box" }} />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Pays</label>
                    <select name="country" value={formData.country} onChange={handleChange} style={{ width: "100%", padding: "0.6rem", border: "1px solid #d1d5db" }}>
                      <option value="">Sélectionner</option>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Ville</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} style={{ width: "100%", padding: "0.6rem", border: "1px solid #d1d5db", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Secteur</label>
                  <select name="sector" value={formData.sector} onChange={handleChange} style={{ width: "100%", padding: "0.6rem", border: "1px solid #d1d5db" }}>
                    <option value="">Sélectionner</option>
                    {SECTORS.map((s) => <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>)}
                  </select>
                </div>

                {/* Photo upload */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.4rem" }}>Photo de profil</label>
                  <ImageUpload
                    currentImageUrl={entrepreneur?.photo_url}
                    onImageUploaded={handlePhotoUploaded}
                    folder="photos"
                    maxSizeMB={2}
                    aspectRatio="square"
                  />
                </div>
              </div>
            )}

            {/* Biographie */}
            {activeTab === "biographie" && (
              <div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1rem", marginBottom: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>💡 Conseils d&apos;écriture</h4>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    <li>Écrivez à la <strong>troisième personne</strong> (« Il est... », pas « Je suis... »)</li>
                    <li>Restez <strong>factuel et neutre</strong>, évitez le langage promotionnel</li>
                    <li>Utilisez les <strong>titres H2/H3</strong> pour structurer votre texte</li>
                    <li>Créez des <strong>liens internes</strong> vers d&apos;autres pages AfriWiki</li>
                  </ul>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Biographie</label>
                  </div>
                  <RichTextEditor
                    content={formData.bio}
                    onChange={(content) => setFormData((prev) => ({ ...prev, bio: content }))}
                    placeholder={`${formData.first_name} ${formData.last_name} est un entrepreneur béninois spécialisé dans...`}
                    minHeight="300px"
                  />
                </div>
              </div>
            )}

            {/* Parcours */}
            {activeTab === "parcours" && (
              <div>
                <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Ajoutez les étapes clés de votre parcours professionnel.</p>

                {parcoursList.map((item, index) => (
                  <div key={index} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontWeight: 600 }}>Étape {index + 1}</span>
                      <button onClick={() => removeParcours(index)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>Supprimer</button>
                    </div>
                    <input type="text" placeholder="Titre (ex: Fondation de TechCorp)" value={item.title} onChange={(e) => updateParcours(index, "title", e.target.value)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", marginBottom: "0.5rem", boxSizing: "border-box" }} />
                    <textarea placeholder="Description" value={item.description} onChange={(e) => updateParcours(index, "description", e.target.value)} rows={2} style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", marginBottom: "0.5rem", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input type="date" value={item.start_date} onChange={(e) => updateParcours(index, "start_date", e.target.value)} style={{ padding: "0.5rem", border: "1px solid #d1d5db" }} />
                      <span>→</span>
                      <input type="date" value={item.end_date} onChange={(e) => updateParcours(index, "end_date", e.target.value)} disabled={item.is_current} style={{ padding: "0.5rem", border: "1px solid #d1d5db" }} />
                      <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}>
                        <input type="checkbox" checked={item.is_current} onChange={(e) => updateParcours(index, "is_current", e.target.checked)} />
                        En cours
                      </label>
                    </div>
                  </div>
                ))}

                <button onClick={addParcours} style={{ padding: "0.5rem 1rem", border: "1px dashed #d1d5db", background: "#fff", cursor: "pointer", marginBottom: "1rem" }}>+ Ajouter une étape</button>

                {parcoursList.length > 0 && (
                  <button onClick={saveParcours} disabled={saving} style={{ padding: "0.6rem 1.2rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                    {saving ? "..." : "Enregistrer le parcours"}
                  </button>
                )}
              </div>
            )}

            {/* Entreprises */}
            {activeTab === "entreprises" && (
              <div>
                <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Listez les entreprises que vous avez fondées ou dirigées.</p>

                {entreprisesList.map((item, index) => (
                  <div key={index} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontWeight: 600 }}>Entreprise {index + 1}</span>
                      <button onClick={() => removeEntreprise(index)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>Supprimer</button>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input type="text" placeholder="Nom de l'entreprise" value={item.name} onChange={(e) => updateEntreprise(index, "name", e.target.value)} style={{ flex: 1, padding: "0.5rem", border: "1px solid #d1d5db" }} />
                      <input type="text" placeholder="Votre rôle" value={item.role} onChange={(e) => updateEntreprise(index, "role", e.target.value)} style={{ flex: 1, padding: "0.5rem", border: "1px solid #d1d5db" }} />
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <RichTextEditor
                        content={item.description}
                        onChange={(content) => updateEntreprise(index, "description", content)}
                        placeholder="Décrivez l'activité de l'entreprise, sa mission, ses réalisations..."
                        minHeight="150px"
                      />
                    </div>
                    <input type="url" placeholder="Site web (https://...)" value={item.website} onChange={(e) => updateEntreprise(index, "website", e.target.value)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", marginBottom: "0.5rem", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input type="date" value={item.start_date} onChange={(e) => updateEntreprise(index, "start_date", e.target.value)} style={{ padding: "0.5rem", border: "1px solid #d1d5db" }} />
                      <span>→</span>
                      <input type="date" value={item.end_date} onChange={(e) => updateEntreprise(index, "end_date", e.target.value)} disabled={item.is_current} style={{ padding: "0.5rem", border: "1px solid #d1d5db" }} />
                      <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}>
                        <input type="checkbox" checked={item.is_current} onChange={(e) => updateEntreprise(index, "is_current", e.target.checked)} />
                        En cours
                      </label>
                    </div>
                  </div>
                ))}

                <button onClick={addEntreprise} style={{ padding: "0.5rem 1rem", border: "1px dashed #d1d5db", background: "#fff", cursor: "pointer", marginBottom: "1rem" }}>+ Ajouter une entreprise</button>

                {entreprisesList.length > 0 && (
                  <button onClick={saveEntreprises} disabled={saving} style={{ padding: "0.6rem 1.2rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                    {saving ? "..." : "Enregistrer les entreprises"}
                  </button>
                )}
              </div>
            )}

            {/* Récompenses */}
            {activeTab === "recompenses" && (
              <div>
                <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Ajoutez vos prix, distinctions et reconnaissances.</p>

                {recompensesList.map((item, index) => (
                  <div key={index} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontWeight: 600 }}>Récompense {index + 1}</span>
                      <button onClick={() => removeRecompense(index)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>Supprimer</button>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input type="text" placeholder="Titre du prix" value={item.title} onChange={(e) => updateRecompense(index, "title", e.target.value)} style={{ flex: 2, padding: "0.5rem", border: "1px solid #d1d5db" }} />
                      <input type="number" placeholder="Année" value={item.year} onChange={(e) => updateRecompense(index, "year", e.target.value)} style={{ flex: 1, padding: "0.5rem", border: "1px solid #d1d5db" }} />
                    </div>
                    <input type="text" placeholder="Organisation (ex: Forbes Africa)" value={item.organization} onChange={(e) => updateRecompense(index, "organization", e.target.value)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", marginBottom: "0.5rem", boxSizing: "border-box" }} />
                    <textarea placeholder="Description (optionnel)" value={item.description} onChange={(e) => updateRecompense(index, "description", e.target.value)} rows={2} style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", marginBottom: "0.5rem", boxSizing: "border-box" }} />
                    <input type="url" placeholder="Lien source (https://...)" value={item.source_url} onChange={(e) => updateRecompense(index, "source_url", e.target.value)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", boxSizing: "border-box" }} />
                  </div>
                ))}

                <button onClick={addRecompense} style={{ padding: "0.5rem 1rem", border: "1px dashed #d1d5db", background: "#fff", cursor: "pointer", marginBottom: "1rem" }}>+ Ajouter une récompense</button>

                {recompensesList.length > 0 && (
                  <button onClick={saveRecompenses} disabled={saving} style={{ padding: "0.6rem 1.2rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                    {saving ? "..." : "Enregistrer les récompenses"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: "280px", flexShrink: 0 }}>
          {/* AI Suggestions */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: "3px solid #fbbf24", padding: "1rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>💡 Suggestions IA</h3>
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((s, i) => (
                <div key={i} style={{ background: "#fefce8", padding: "0.75rem", marginBottom: "0.5rem", fontSize: "0.9rem" }}>{s}</div>
              ))
            ) : (
              <p style={{ background: "#dcfce7", padding: "0.75rem", color: "#166534", fontSize: "0.9rem", margin: 0 }}>✓ Votre page semble bien structurée !</p>
            )}
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.75rem 0 0", textAlign: "center", fontStyle: "italic" }}>L&apos;IA suggère, vous décidez.</p>
          </div>

          {/* Help */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>❓ Aide</h3>
            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <li><strong>Brouillon</strong> : Votre page n&apos;est visible que par vous.</li>
              <li><strong>Publiée</strong> : Votre page est visible par tous.</li>
              <li>Les modifications sont enregistrées automatiquement.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
