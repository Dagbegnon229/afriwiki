-- =============================================
-- AfriWiki - Tables additionnelles
-- =============================================

-- Table: parcours (timeline des événements)
CREATE TABLE IF NOT EXISTS public.parcours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrepreneur_id UUID NOT NULL REFERENCES public.entrepreneurs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: entreprises
CREATE TABLE IF NOT EXISTS public.entreprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrepreneur_id UUID NOT NULL REFERENCES public.entrepreneurs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(200),
    description TEXT,
    website VARCHAR(500),
    logo_url TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: récompenses
CREATE TABLE IF NOT EXISTS public.recompenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrepreneur_id UUID NOT NULL REFERENCES public.entrepreneurs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    organization VARCHAR(200),
    year INT,
    description TEXT,
    source_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_parcours_entrepreneur ON public.parcours(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_entreprises_entrepreneur ON public.entreprises(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_recompenses_entrepreneur ON public.recompenses(entrepreneur_id);

-- RLS pour parcours
ALTER TABLE public.parcours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view parcours" ON public.parcours;
CREATE POLICY "Public can view parcours" ON public.parcours
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own parcours" ON public.parcours;
CREATE POLICY "Users can manage own parcours" ON public.parcours
    FOR ALL USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- RLS pour entreprises
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view entreprises" ON public.entreprises;
CREATE POLICY "Public can view entreprises" ON public.entreprises
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own entreprises" ON public.entreprises;
CREATE POLICY "Users can manage own entreprises" ON public.entreprises
    FOR ALL USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- RLS pour récompenses
ALTER TABLE public.recompenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view recompenses" ON public.recompenses;
CREATE POLICY "Public can view recompenses" ON public.recompenses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own recompenses" ON public.recompenses;
CREATE POLICY "Users can manage own recompenses" ON public.recompenses
    FOR ALL USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- Storage bucket pour les photos
-- =============================================
-- Note: Exécuter ces commandes dans le SQL Editor de Supabase

-- Créer le bucket pour les avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload
DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
CREATE POLICY "Users can upload avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politique pour permettre la mise à jour
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politique pour permettre la suppression
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politique pour permettre la lecture publique
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
