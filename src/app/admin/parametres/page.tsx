"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Setting {
  key: string;
  value: string;
  description: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Country {
  code: string;
  name: string;
  flag_emoji: string;
}

interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const SETTING_TYPES: Record<string, "boolean" | "number" | "text"> = {
  registration_enabled: "boolean",
  registration_requires_email_verification: "boolean",
  auto_publish_profiles: "boolean",
  auto_publish_articles: "boolean",
  min_bio_length: "number",
  require_photo_for_publish: "boolean",
  min_sources_for_verification: "number",
  allow_anonymous_reports: "boolean",
  auto_hide_reported_content: "boolean",
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  registration: { label: "Inscription", icon: "📝" },
  publication: { label: "Publication", icon: "📤" },
  validation: { label: "Validation", icon: "✓" },
  moderation: { label: "Modération", icon: "🛡️" },
};

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("settings");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New item forms
  const [newCountry, setNewCountry] = useState({ code: "", name: "", flag_emoji: "" });
  const [newSector, setNewSector] = useState({ name: "", icon: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingsData } = await (supabase as any).from("platform_settings").select("*");
    if (settingsData) {
      setSettings(settingsData.map((s: { key: string; value: unknown; description: string; category: string }) => ({
        ...s,
        value: typeof s.value === "string" ? s.value : JSON.stringify(s.value),
      })));
    }

    // Countries
    const { data: countriesData } = await supabase.from("countries").select("*").order("name");
    if (countriesData) setCountries(countriesData);

    // Sectors
    const { data: sectorsData } = await supabase.from("sectors").select("*").order("name");
    if (sectorsData) setSectors(sectorsData);

    setLoading(false);
  };

  const handleSettingChange = async (key: string, value: string) => {
    const type = SETTING_TYPES[key];
    let parsedValue: unknown = value;

    if (type === "boolean") {
      parsedValue = value === "true";
    } else if (type === "number") {
      parsedValue = parseInt(value) || 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("platform_settings")
      .update({ value: parsedValue, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setSettings(settings.map((s) => s.key === key ? { ...s, value: String(parsedValue) } : s));
      setMessage({ type: "success", text: "Paramètre mis à jour !" });
    }
  };

  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.code || !newCountry.name) return;

    const { error } = await supabase.from("countries").insert({
      code: newCountry.code.toUpperCase(),
      name: newCountry.name,
      flag_emoji: newCountry.flag_emoji || "🏳️",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Pays ajouté !" });
      setNewCountry({ code: "", name: "", flag_emoji: "" });
      fetchData();
    }
  };

  const handleDeleteCountry = async (code: string) => {
    if (!confirm("Supprimer ce pays ?")) return;

    const { error } = await supabase.from("countries").delete().eq("code", code);
    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setCountries(countries.filter((c) => c.code !== code));
      setMessage({ type: "success", text: "Pays supprimé" });
    }
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSector.name) return;

    const slug = newSector.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const { error } = await supabase.from("sectors").insert({
      name: newSector.name,
      slug,
      icon: newSector.icon || "📊",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Secteur ajouté !" });
      setNewSector({ name: "", icon: "" });
      fetchData();
    }
  };

  const handleDeleteSector = async (id: string) => {
    if (!confirm("Supprimer ce secteur ?")) return;

    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) {
      setMessage({ type: "error", text: `Erreur: ${error.message}` });
    } else {
      setSectors(sectors.filter((s) => s.id !== id));
      setMessage({ type: "success", text: "Secteur supprimé" });
    }
  };

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (loading) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
          ⚙️ Paramètres globaux
        </h1>
        <p style={{ color: "#9ca3af", margin: 0 }}>
          Configuration générale de la plateforme AfriWiki
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #374151", paddingBottom: "1rem" }}>
        {[
          { id: "settings", label: "⚙️ Paramètres" },
          { id: "countries", label: "🌍 Pays" },
          { id: "sectors", label: "📊 Secteurs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1.25rem",
              background: activeTab === tab.id ? "#3b82f6" : "#374151",
              color: activeTab === tab.id ? "white" : "#d1d5db",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {Object.entries(groupedSettings).map(([category, categorySettings]) => {
            const cat = CATEGORY_LABELS[category] || { label: category, icon: "⚙️" };
            return (
              <div
                key={category}
                style={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "1.5rem",
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>
                  {cat.icon} {cat.label}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {categorySettings.map((setting) => {
                    const type = SETTING_TYPES[setting.key];
                    return (
                      <div
                        key={setting.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.75rem",
                          background: "#374151",
                          borderRadius: "4px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 500 }}>{setting.description}</p>
                          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{setting.key}</p>
                        </div>
                        <div style={{ marginLeft: "1rem" }}>
                          {type === "boolean" ? (
                            <button
                              onClick={() => handleSettingChange(setting.key, setting.value === "true" ? "false" : "true")}
                              style={{
                                padding: "0.5rem 1rem",
                                background: setting.value === "true" ? "#22c55e" : "#6b7280",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                minWidth: "80px",
                              }}
                            >
                              {setting.value === "true" ? "Activé" : "Désactivé"}
                            </button>
                          ) : (
                            <input
                              type={type}
                              value={setting.value}
                              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                              style={{
                                padding: "0.5rem",
                                background: "#1f2937",
                                border: "1px solid #4b5563",
                                borderRadius: "4px",
                                color: "#f9fafb",
                                width: "100px",
                                textAlign: "center",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Countries Tab */}
      {activeTab === "countries" && (
        <div>
          {/* Add country form */}
          <form onSubmit={handleAddCountry} style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#9ca3af" }}>Code</label>
              <input
                type="text"
                value={newCountry.code}
                onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value })}
                placeholder="FR"
                maxLength={2}
                style={{ padding: "0.5rem", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#f9fafb", width: "60px", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#9ca3af" }}>Nom</label>
              <input
                type="text"
                value={newCountry.name}
                onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                placeholder="Nom du pays"
                style={{ padding: "0.5rem", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#f9fafb", width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#9ca3af" }}>Emoji</label>
              <input
                type="text"
                value={newCountry.flag_emoji}
                onChange={(e) => setNewCountry({ ...newCountry, flag_emoji: e.target.value })}
                placeholder="🇫🇷"
                style={{ padding: "0.5rem", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#f9fafb", width: "60px", textAlign: "center" }}
              />
            </div>
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#22c55e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              + Ajouter
            </button>
          </form>

          {/* Countries list */}
          <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 60px 80px", padding: "0.75rem 1rem", background: "#2d3748", fontWeight: 600, fontSize: "0.85rem", color: "#9ca3af" }}>
              <span>Code</span>
              <span>Nom</span>
              <span>🏳️</span>
              <span></span>
            </div>
            {countries.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>Aucun pays configuré</div>
            ) : (
              countries.map((country) => (
                <div key={country.code} style={{ display: "grid", gridTemplateColumns: "60px 1fr 60px 80px", padding: "0.75rem 1rem", borderTop: "1px solid #374151", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{country.code}</span>
                  <span>{country.name}</span>
                  <span style={{ fontSize: "1.5rem" }}>{country.flag_emoji}</span>
                  <button
                    onClick={() => handleDeleteCountry(country.code)}
                    style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sectors Tab */}
      {activeTab === "sectors" && (
        <div>
          {/* Add sector form */}
          <form onSubmit={handleAddSector} style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#9ca3af" }}>Nom du secteur</label>
              <input
                type="text"
                value={newSector.name}
                onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                placeholder="Ex: Technologies de l'information"
                style={{ padding: "0.5rem", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#f9fafb", width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#9ca3af" }}>Icône</label>
              <input
                type="text"
                value={newSector.icon}
                onChange={(e) => setNewSector({ ...newSector, icon: e.target.value })}
                placeholder="💻"
                style={{ padding: "0.5rem", background: "#374151", border: "1px solid #4b5563", borderRadius: "4px", color: "#f9fafb", width: "60px", textAlign: "center" }}
              />
            </div>
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#22c55e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              + Ajouter
            </button>
          </form>

          {/* Sectors list */}
          <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 150px 80px", padding: "0.75rem 1rem", background: "#2d3748", fontWeight: 600, fontSize: "0.85rem", color: "#9ca3af" }}>
              <span>Icône</span>
              <span>Nom</span>
              <span>Slug</span>
              <span></span>
            </div>
            {sectors.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>Aucun secteur configuré</div>
            ) : (
              sectors.map((sector) => (
                <div key={sector.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 150px 80px", padding: "0.75rem 1rem", borderTop: "1px solid #374151", alignItems: "center" }}>
                  <span style={{ fontSize: "1.5rem" }}>{sector.icon || "📊"}</span>
                  <span>{sector.name}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>{sector.slug}</span>
                  <button
                    onClick={() => handleDeleteSector(sector.id)}
                    style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
