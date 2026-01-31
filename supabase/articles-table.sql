-- =============================================
-- Table des articles/contributions
-- Exécuter dans Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'thematique',
    cover_image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    views_count INT DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_category CHECK (category IN ('entrepreneur', 'entreprise', 'thematique', 'pays', 'secteur', 'actualite')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'pending', 'published', 'rejected'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

-- RLS (Row Level Security)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Lecture publique des articles publiés
DROP POLICY IF EXISTS "articles_select_public" ON public.articles;
CREATE POLICY "articles_select_public" ON public.articles
    FOR SELECT
    USING (status = 'published' OR author_id = auth.uid());

-- Insertion (utilisateurs authentifiés)
DROP POLICY IF EXISTS "articles_insert" ON public.articles;
CREATE POLICY "articles_insert" ON public.articles
    FOR INSERT
    WITH CHECK (author_id = auth.uid());

-- Mise à jour (auteur uniquement)
DROP POLICY IF EXISTS "articles_update" ON public.articles;
CREATE POLICY "articles_update" ON public.articles
    FOR UPDATE
    USING (author_id = auth.uid());

-- Suppression (auteur uniquement)
DROP POLICY IF EXISTS "articles_delete" ON public.articles;
CREATE POLICY "articles_delete" ON public.articles
    FOR DELETE
    USING (author_id = auth.uid());

-- Confirmer
SELECT 'Table articles créée avec succès!' as message;
