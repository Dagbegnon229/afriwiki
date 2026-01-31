-- =============================================
-- FIX: Foreign Key Constraint pour entrepreneurs
-- =============================================

-- D'abord, supprimer la contrainte existante si elle pointe vers profiles
ALTER TABLE IF EXISTS public.entrepreneurs 
DROP CONSTRAINT IF EXISTS entrepreneurs_user_id_fkey;

-- Recréer la contrainte pour pointer vers auth.users
ALTER TABLE public.entrepreneurs
ADD CONSTRAINT entrepreneurs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Vérifier que la table profiles existe et a la bonne structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- S'assurer que le profil de l'utilisateur actuel existe
-- (remplacer par l'ID de l'utilisateur si nécessaire)
INSERT INTO public.profiles (id, full_name)
SELECT id, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Activer RLS sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre l'insertion du profil lors de l'inscription
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- Vérifier/Créer la table entrepreneurs
-- =============================================

-- S'assurer que la table entrepreneurs existe avec la bonne structure
CREATE TABLE IF NOT EXISTS public.entrepreneurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    photo_url TEXT,
    bio TEXT,
    headline VARCHAR(200),
    country VARCHAR(2),
    city VARCHAR(100),
    verification_level INT DEFAULT 1 CHECK (verification_level >= 0 AND verification_level <= 4),
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.entrepreneurs ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut voir les entrepreneurs publiés
DROP POLICY IF EXISTS "Public can view published entrepreneurs" ON public.entrepreneurs;
CREATE POLICY "Public can view published entrepreneurs" ON public.entrepreneurs
    FOR SELECT USING (is_published = true);

-- Politique: Les utilisateurs peuvent voir leur propre profil (même non publié)
DROP POLICY IF EXISTS "Users can view own entrepreneur profile" ON public.entrepreneurs;
CREATE POLICY "Users can view own entrepreneur profile" ON public.entrepreneurs
    FOR SELECT USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leur profil
DROP POLICY IF EXISTS "Users can create own entrepreneur profile" ON public.entrepreneurs;
CREATE POLICY "Users can create own entrepreneur profile" ON public.entrepreneurs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leur propre profil
DROP POLICY IF EXISTS "Users can update own entrepreneur profile" ON public.entrepreneurs;
CREATE POLICY "Users can update own entrepreneur profile" ON public.entrepreneurs
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leur propre profil
DROP POLICY IF EXISTS "Users can delete own entrepreneur profile" ON public.entrepreneurs;
CREATE POLICY "Users can delete own entrepreneur profile" ON public.entrepreneurs
    FOR DELETE USING (auth.uid() = user_id);
