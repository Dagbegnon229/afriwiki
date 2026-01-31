-- =============================================
-- Table des sources pour la vérification
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- Créer la table sources
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrepreneur_id UUID NOT NULL REFERENCES public.entrepreneurs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'article',
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_type CHECK (type IN ('article', 'website', 'social', 'document')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'validated', 'rejected'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_sources_entrepreneur ON public.sources(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_sources_status ON public.sources(status);

-- RLS (Row Level Security)
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
DROP POLICY IF EXISTS "sources_select" ON public.sources;
CREATE POLICY "sources_select" ON public.sources
    FOR SELECT
    USING (true);

-- Politique d'insertion (utilisateur authentifié pour son entrepreneur)
DROP POLICY IF EXISTS "sources_insert" ON public.sources;
CREATE POLICY "sources_insert" ON public.sources
    FOR INSERT
    WITH CHECK (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- Politique de mise à jour (utilisateur authentifié pour ses sources)
DROP POLICY IF EXISTS "sources_update" ON public.sources;
CREATE POLICY "sources_update" ON public.sources
    FOR UPDATE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- Politique de suppression
DROP POLICY IF EXISTS "sources_delete" ON public.sources;
CREATE POLICY "sources_delete" ON public.sources
    FOR DELETE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- Confirmer la création
SELECT 'Table sources créée avec succès!' as message;
