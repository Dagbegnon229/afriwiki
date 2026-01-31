"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, SECTORS } from "@/data/demo";

export default function CreerPageEntrepreneur() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    headline: "",
    bio: "",
    country: "",
    city: "",
    sector: "",
  });

  // Vérifier si l'utilisateur a déjà une page
  useEffect(() => {
    const checkExistingPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      // Pré-remplir avec le nom de l'utilisateur
      const fullName = user.user_metadata?.full_name || "";
      const [firstName, ...lastNameParts] = fullName.split(" ");
      setFormData((prev) => ({
        ...prev,
        first_name: firstName || "",
        last_name: lastNameParts.join(" ") || "",
      }));

      const { data } = await supabase
        .from("entrepreneurs")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        // Déjà une page, rediriger vers l'éditeur
        router.push("/dashboard/editer");
        return;
      }

      setChecking(false);
    };

    checkExistingPage();
  }, [router, supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Vous devez être connecté pour créer une page.");
        setLoading(false);
        return;
      }

      // Créer le slug à partir du nom
      const slug = `${formData.first_name}-${formData.last_name}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Insérer l'entrepreneur dans la base de données
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("entrepreneurs")
        .insert({
          user_id: user.id,
          slug,
          first_name: formData.first_name,
          last_name: formData.last_name,
          headline: formData.headline || null,
          bio: formData.bio || null,
          country: formData.country || null,
          city: formData.city || null,
          verification_level: 1,
          is_published: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erreur insertion:", insertError);
        if (insertError.code === "23505") {
          setError("Vous avez déjà créé une page entrepreneur.");
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      // Rediriger vers l'éditeur
      router.push("/dashboard/editer?success=true");
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const canProceedStep1 = formData.first_name && formData.last_name;
  const canProceedStep2 = true; // Localisation optionnelle

  if (checking) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Vérification en cours...</p>
      </div>
    );
  }

  return (
    <div className="create-container">
      <div className="create-header">
        <h1>Créer ma page Afriwiki</h1>
        <p>
          Rejoignez l&apos;encyclopédie des entrepreneurs africains en quelques étapes.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="create-progress">
        <div className={`create-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
          <span className="create-step-number">1</span>
          <span className="create-step-label">Identité</span>
        </div>
        <div className="create-step-line" />
        <div className={`create-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
          <span className="create-step-number">2</span>
          <span className="create-step-label">Localisation</span>
        </div>
        <div className="create-step-line" />
        <div className={`create-step ${step >= 3 ? "active" : ""}`}>
          <span className="create-step-number">3</span>
          <span className="create-step-label">Biographie</span>
        </div>
      </div>

      {error && (
        <div className="create-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Étape 1: Identité */}
        {step === 1 && (
          <div className="create-section">
            <h2>👤 Votre identité</h2>
            <p className="create-section-desc">
              Ces informations apparaîtront sur votre page publique Afriwiki.
            </p>

            <div className="create-form-row">
              <div className="create-form-group">
                <label htmlFor="first_name">Prénom *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                  required
                />
              </div>
              <div className="create-form-group">
                <label htmlFor="last_name">Nom *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Votre nom de famille"
                  required
                />
              </div>
            </div>

            <div className="create-form-group">
              <label htmlFor="headline">Titre / Fonction</label>
              <input
                type="text"
                id="headline"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Ex: Fondateur de TechCorp, CEO, Investisseur..."
              />
              <span className="create-help">
                Ce titre apparaît sous votre nom sur votre page.
              </span>
            </div>

            <div className="create-preview">
              <span className="create-preview-label">Aperçu :</span>
              <div className="create-preview-card">
                <strong>{formData.first_name || "Prénom"} {formData.last_name || "Nom"}</strong>
                {formData.headline && <p>{formData.headline}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Localisation */}
        {step === 2 && (
          <div className="create-section">
            <h2>📍 Localisation</h2>
            <p className="create-section-desc">
              Indiquez votre pays et ville pour être trouvé plus facilement.
            </p>

            <div className="create-form-row">
              <div className="create-form-group">
                <label htmlFor="country">Pays</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                >
                  <option value="">Sélectionnez un pays</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag_emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="create-form-group">
                <label htmlFor="city">Ville</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Votre ville de résidence"
                />
              </div>
            </div>

            <div className="create-form-group">
              <label htmlFor="sector">Secteur d&apos;activité</label>
              <select
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
              >
                <option value="">Sélectionnez un secteur</option>
                {SECTORS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Étape 3: Biographie */}
        {step === 3 && (
          <div className="create-section">
            <h2>📝 Biographie</h2>
            <p className="create-section-desc">
              Décrivez votre parcours en quelques lignes. Vous pourrez compléter plus tard.
            </p>

            <div className="create-bio-tips">
              <h4>💡 Conseils</h4>
              <ul>
                <li>Écrivez à la troisième personne : &quot;[Votre nom] est...&quot;</li>
                <li>Restez factuel et professionnel</li>
                <li>Mentionnez vos principales réalisations</li>
              </ul>
            </div>

            <div className="create-form-group">
              <label htmlFor="bio">
                Votre biographie
                <span className="create-optional">(optionnel)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={6}
                placeholder={`${formData.first_name} ${formData.last_name} est un entrepreneur...`}
              />
              <span className="create-help">
                {formData.bio.length} caractères. Vous pourrez la compléter depuis l&apos;éditeur.
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="create-actions">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="create-btn-secondary">
              ← Retour
            </button>
          )}
          {step === 1 && (
            <Link href="/dashboard" className="create-btn-secondary">
              Annuler
            </Link>
          )}
          
          {step < 3 ? (
            <button 
              type="button" 
              onClick={nextStep}
              disabled={step === 1 && !canProceedStep1}
              className="create-btn-primary"
            >
              Continuer →
            </button>
          ) : (
            <button 
              type="submit"
              disabled={loading}
              className="create-btn-primary create-btn-submit"
            >
              {loading ? "Création..." : "Créer ma page →"}
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .create-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .create-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .create-header h1 {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 1.6rem;
          font-weight: normal;
          margin: 0 0 0.5rem 0;
        }

        .create-header p {
          color: var(--text-secondary);
          margin: 0;
        }

        .create-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 2rem;
        }

        .create-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .create-step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--background-secondary);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .create-step.active .create-step-number {
          background: var(--link-color);
          border-color: var(--link-color);
          color: white;
        }

        .create-step.completed .create-step-number {
          background: #00a550;
          border-color: #00a550;
          color: white;
        }

        .create-step.completed .create-step-number::after {
          content: "✓";
        }

        .create-step-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .create-step.active .create-step-label {
          color: var(--link-color);
          font-weight: 500;
        }

        .create-step-line {
          width: 60px;
          height: 2px;
          background: var(--border-light);
          margin: 0 0.5rem;
          margin-bottom: 1.5rem;
        }

        .create-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .create-section {
          background: var(--background);
          border: 1px solid var(--border-light);
          padding: 1.5rem;
        }

        .create-section h2 {
          font-size: 1.2rem;
          margin: 0 0 0.5rem 0;
        }

        .create-section-desc {
          color: var(--text-secondary);
          margin: 0 0 1.5rem 0;
          font-size: 0.95rem;
        }

        .create-form-row {
          display: flex;
          gap: 1rem;
        }

        .create-form-row .create-form-group {
          flex: 1;
        }

        .create-form-group {
          margin-bottom: 1.25rem;
        }

        .create-form-group label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .create-optional {
          font-weight: normal;
          color: var(--text-secondary);
        }

        .create-form-group input,
        .create-form-group select,
        .create-form-group textarea {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--border-color);
          background: var(--background);
          font-size: 1rem;
          font-family: inherit;
          box-sizing: border-box;
        }

        .create-form-group textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .create-form-group input:focus,
        .create-form-group select:focus,
        .create-form-group textarea:focus {
          outline: none;
          border-color: var(--link-color);
          box-shadow: 0 0 0 2px rgba(51, 102, 204, 0.1);
        }

        .create-help {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .create-preview {
          background: var(--background-secondary);
          padding: 1rem;
          margin-top: 1rem;
        }

        .create-preview-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .create-preview-card {
          margin-top: 0.5rem;
        }

        .create-preview-card strong {
          font-size: 1.1rem;
        }

        .create-preview-card p {
          margin: 0.25rem 0 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .create-bio-tips {
          background: #e7f3ff;
          border: 1px solid #b6d4fe;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .create-bio-tips h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.95rem;
        }

        .create-bio-tips ul {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.9rem;
        }

        .create-bio-tips li {
          margin-bottom: 0.25rem;
        }

        .create-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
          gap: 1rem;
        }

        .create-btn-primary {
          background: var(--link-color);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          margin-left: auto;
        }

        .create-btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .create-btn-submit {
          background: #00a550;
        }

        .create-btn-secondary {
          background: var(--background);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          text-decoration: none;
          color: var(--text-primary);
          display: inline-block;
        }

        @media (max-width: 500px) {
          .create-form-row {
            flex-direction: column;
          }

          .create-progress {
            flex-wrap: wrap;
          }

          .create-step-line {
            width: 30px;
          }
        }
      `}</style>
    </div>
  );
}
