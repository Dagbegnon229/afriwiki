-- =============================================
-- POLITIQUES DE SÉCURITÉ RENFORCÉES - AfriWiki
-- Version corrigée - Compatible avec le schéma existant
-- =============================================

-- =============================================
-- 1. FONCTION IS_ADMIN (à exécuter en premier)
-- =============================================

-- Créer une fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email = 'linkpehoundagbegnon@gmail.com'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. PROTECTION TABLE ENTREPRENEURS
-- =============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can read published entrepreneurs" ON entrepreneurs;
DROP POLICY IF EXISTS "Users can create own entrepreneur" ON entrepreneurs;
DROP POLICY IF EXISTS "Users can update own entrepreneur" ON entrepreneurs;
DROP POLICY IF EXISTS "Admin can manage all entrepreneurs" ON entrepreneurs;
DROP POLICY IF EXISTS "Read published or own entrepreneur" ON entrepreneurs;
DROP POLICY IF EXISTS "Create own entrepreneur" ON entrepreneurs;
DROP POLICY IF EXISTS "Update own or admin entrepreneur" ON entrepreneurs;
DROP POLICY IF EXISTS "Only admin can delete entrepreneur" ON entrepreneurs;

-- Activer RLS
ALTER TABLE entrepreneurs ENABLE ROW LEVEL SECURITY;

-- Lecture: profils publiés pour tous, propre profil pour le propriétaire
CREATE POLICY "Read published or own entrepreneur" ON entrepreneurs
  FOR SELECT USING (
    is_published = true 
    OR user_id = auth.uid() 
    OR is_admin()
  );

-- Création: uniquement son propre profil
CREATE POLICY "Create own entrepreneur" ON entrepreneurs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Mise à jour: propre profil ou admin
CREATE POLICY "Update own or admin entrepreneur" ON entrepreneurs
  FOR UPDATE USING (
    user_id = auth.uid() OR is_admin()
  );

-- Suppression: admin uniquement
CREATE POLICY "Only admin can delete entrepreneur" ON entrepreneurs
  FOR DELETE USING (
    is_admin()
  );

-- =============================================
-- 3. PROTECTION TABLE ARTICLES
-- =============================================

DROP POLICY IF EXISTS "Read published articles" ON articles;
DROP POLICY IF EXISTS "Authors manage own articles" ON articles;
DROP POLICY IF EXISTS "Admin manage all articles" ON articles;
DROP POLICY IF EXISTS "Read published or own articles" ON articles;
DROP POLICY IF EXISTS "Create own articles" ON articles;
DROP POLICY IF EXISTS "Update own or admin articles" ON articles;
DROP POLICY IF EXISTS "Only admin delete articles" ON articles;

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Lecture: articles publiés pour tous, propres articles pour l'auteur
CREATE POLICY "Read published or own articles" ON articles
  FOR SELECT USING (
    status = 'published'
    OR author_id = auth.uid()
    OR is_admin()
  );

-- Création: utilisateurs authentifiés
CREATE POLICY "Create own articles" ON articles
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
  );

-- Mise à jour: propre article ou admin
CREATE POLICY "Update own or admin articles" ON articles
  FOR UPDATE USING (
    author_id = auth.uid() OR is_admin()
  );

-- Suppression: admin uniquement
CREATE POLICY "Only admin delete articles" ON articles
  FOR DELETE USING (
    is_admin()
  );

-- =============================================
-- 4. PROTECTION TABLE SOURCES
-- =============================================

DROP POLICY IF EXISTS "Read own or admin sources" ON sources;
DROP POLICY IF EXISTS "Create own sources" ON sources;
DROP POLICY IF EXISTS "Update admin only sources" ON sources;
DROP POLICY IF EXISTS "Read sources policy" ON sources;
DROP POLICY IF EXISTS "Create sources policy" ON sources;
DROP POLICY IF EXISTS "Update sources admin only" ON sources;
DROP POLICY IF EXISTS "Delete sources policy" ON sources;

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Lecture: propres sources ou admin
CREATE POLICY "Read sources policy" ON sources
  FOR SELECT USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

-- Création: pour son propre profil
CREATE POLICY "Create sources policy" ON sources
  FOR INSERT WITH CHECK (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
  );

-- Mise à jour: admin uniquement (pour validation)
CREATE POLICY "Update sources admin only" ON sources
  FOR UPDATE USING (
    is_admin()
  );

-- Suppression: propriétaire ou admin
CREATE POLICY "Delete sources policy" ON sources
  FOR DELETE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

-- =============================================
-- 5. PROTECTION PARCOURS
-- =============================================

DROP POLICY IF EXISTS "Read parcours" ON parcours;
DROP POLICY IF EXISTS "Manage own parcours" ON parcours;
DROP POLICY IF EXISTS "parcours_select_policy" ON parcours;
DROP POLICY IF EXISTS "parcours_insert_policy" ON parcours;
DROP POLICY IF EXISTS "parcours_update_policy" ON parcours;
DROP POLICY IF EXISTS "parcours_delete_policy" ON parcours;

ALTER TABLE parcours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parcours_select_policy" ON parcours
  FOR SELECT USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE is_published = true)
    OR entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "parcours_insert_policy" ON parcours
  FOR INSERT WITH CHECK (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
  );

CREATE POLICY "parcours_update_policy" ON parcours
  FOR UPDATE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "parcours_delete_policy" ON parcours
  FOR DELETE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

-- =============================================
-- 6. PROTECTION ENTREPRISES
-- =============================================

DROP POLICY IF EXISTS "Read entreprises" ON entreprises;
DROP POLICY IF EXISTS "Manage own entreprises" ON entreprises;
DROP POLICY IF EXISTS "entreprises_select_policy" ON entreprises;
DROP POLICY IF EXISTS "entreprises_insert_policy" ON entreprises;
DROP POLICY IF EXISTS "entreprises_update_policy" ON entreprises;
DROP POLICY IF EXISTS "entreprises_delete_policy" ON entreprises;

ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entreprises_select_policy" ON entreprises
  FOR SELECT USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE is_published = true)
    OR entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "entreprises_insert_policy" ON entreprises
  FOR INSERT WITH CHECK (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
  );

CREATE POLICY "entreprises_update_policy" ON entreprises
  FOR UPDATE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "entreprises_delete_policy" ON entreprises
  FOR DELETE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

-- =============================================
-- 7. PROTECTION RECOMPENSES
-- =============================================

DROP POLICY IF EXISTS "Read recompenses" ON recompenses;
DROP POLICY IF EXISTS "Manage own recompenses" ON recompenses;
DROP POLICY IF EXISTS "recompenses_select_policy" ON recompenses;
DROP POLICY IF EXISTS "recompenses_insert_policy" ON recompenses;
DROP POLICY IF EXISTS "recompenses_update_policy" ON recompenses;
DROP POLICY IF EXISTS "recompenses_delete_policy" ON recompenses;

ALTER TABLE recompenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recompenses_select_policy" ON recompenses
  FOR SELECT USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE is_published = true)
    OR entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "recompenses_insert_policy" ON recompenses
  FOR INSERT WITH CHECK (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
  );

CREATE POLICY "recompenses_update_policy" ON recompenses
  FOR UPDATE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "recompenses_delete_policy" ON recompenses
  FOR DELETE USING (
    entrepreneur_id IN (SELECT id FROM entrepreneurs WHERE user_id = auth.uid())
    OR is_admin()
  );
