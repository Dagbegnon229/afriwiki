-- ============================================
-- Configuration du Storage Supabase pour AfriWiki
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================

-- Note: Le bucket doit être créé via l'interface Supabase Storage
-- ou via l'API. Ce script configure les policies.

-- 1. Créer le bucket "afriwiki" manuellement dans Supabase:
--    - Aller dans Storage > New Bucket
--    - Nom: afriwiki
--    - Public: Oui (pour les images de profil publiques)

-- 2. Policies pour le bucket "afriwiki"

-- Permettre à tout le monde de voir les images (public)
CREATE POLICY "Images publiques en lecture" ON storage.objects
FOR SELECT
USING (bucket_id = 'afriwiki');

-- Permettre aux utilisateurs authentifiés d'uploader dans leur dossier
CREATE POLICY "Upload pour utilisateurs authentifiés" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'afriwiki' 
  AND (storage.foldername(name))[1] = 'photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Permettre aux utilisateurs de mettre à jour leurs propres images
CREATE POLICY "Update pour propriétaires" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'afriwiki'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Permettre aux utilisateurs de supprimer leurs propres images
CREATE POLICY "Delete pour propriétaires" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'afriwiki'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- INSTRUCTIONS MANUELLES
-- ============================================
-- 
-- 1. Allez dans Supabase Dashboard > Storage
-- 2. Cliquez sur "New Bucket"
-- 3. Nom: afriwiki
-- 4. Cochez "Public bucket"
-- 5. Cliquez "Create bucket"
-- 6. Ensuite exécutez les policies ci-dessus
--
-- ============================================
