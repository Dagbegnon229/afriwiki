-- =============================================
-- SCRIPT COMPLET AFRIWIKI - À EXÉCUTER EN ENTIER
-- Copier tout ce contenu et exécuter dans Supabase SQL Editor
-- =============================================

-- =============================================
-- ÉTAPE 1: FONCTION IS_ADMIN
-- =============================================

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
-- ÉTAPE 2: SUPPRIMER LES ANCIENNES POLITIQUES (ignorer les erreurs)
-- =============================================

DO $$ 
BEGIN
  -- featured_items policies
  DROP POLICY IF EXISTS "featured_select_policy" ON featured_items;
  DROP POLICY IF EXISTS "featured_admin_policy" ON featured_items;
  DROP POLICY IF EXISTS "Public read featured" ON featured_items;
  DROP POLICY IF EXISTS "Admin manage featured" ON featured_items;
  DROP POLICY IF EXISTS "Public read active featured" ON featured_items;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "reports_insert_policy" ON reports;
  DROP POLICY IF EXISTS "reports_admin_policy" ON reports;
  DROP POLICY IF EXISTS "reports_update_policy" ON reports;
  DROP POLICY IF EXISTS "reports_delete_policy" ON reports;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "admin_logs_policy" ON admin_activity_logs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "settings_read_policy" ON platform_settings;
  DROP POLICY IF EXISTS "settings_admin_policy" ON platform_settings;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "banned_admin_policy" ON banned_users;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "deleted_admin_policy" ON deleted_articles;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "activity_read_policy" ON user_activity_logs;
  DROP POLICY IF EXISTS "activity_insert_policy" ON user_activity_logs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =============================================
-- ÉTAPE 3: CRÉER LES TABLES
-- =============================================

-- Table featured_items
CREATE TABLE IF NOT EXISTS featured_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  position integer DEFAULT 1,
  reason text,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Table reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  reporter_id uuid,
  reporter_email text,
  status text NOT NULL DEFAULT 'pending',
  resolution text,
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Table admin_activity_logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  admin_email text,
  action_type text NOT NULL,
  action_category text NOT NULL,
  target_type text,
  target_id uuid,
  target_name text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Table platform_settings
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  category text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table banned_users
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  banned_until timestamp with time zone,
  reason text,
  banned_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table deleted_articles
CREATE TABLE IF NOT EXISTS deleted_articles (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  deleted_by uuid,
  deletion_reason text,
  deleted_at timestamp with time zone DEFAULT now()
);

-- Table user_activity_logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- ÉTAPE 4: ACTIVER RLS SUR TOUTES LES TABLES
-- =============================================

ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ÉTAPE 5: CRÉER LES POLITIQUES RLS
-- =============================================

-- featured_items
CREATE POLICY "featured_select_policy" ON featured_items
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "featured_admin_policy" ON featured_items
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "featured_update_policy" ON featured_items
  FOR UPDATE USING (is_admin());

CREATE POLICY "featured_delete_policy" ON featured_items
  FOR DELETE USING (is_admin());

-- reports
CREATE POLICY "reports_insert_policy" ON reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reports_select_policy" ON reports
  FOR SELECT USING (is_admin());

CREATE POLICY "reports_update_policy" ON reports
  FOR UPDATE USING (is_admin());

CREATE POLICY "reports_delete_policy" ON reports
  FOR DELETE USING (is_admin());

-- admin_activity_logs
CREATE POLICY "admin_logs_select" ON admin_activity_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_logs_insert" ON admin_activity_logs
  FOR INSERT WITH CHECK (is_admin());

-- platform_settings
CREATE POLICY "settings_read_policy" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "settings_update_policy" ON platform_settings
  FOR UPDATE USING (is_admin());

CREATE POLICY "settings_insert_policy" ON platform_settings
  FOR INSERT WITH CHECK (is_admin());

-- banned_users
CREATE POLICY "banned_select_policy" ON banned_users
  FOR SELECT USING (is_admin());

CREATE POLICY "banned_insert_policy" ON banned_users
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "banned_update_policy" ON banned_users
  FOR UPDATE USING (is_admin());

CREATE POLICY "banned_delete_policy" ON banned_users
  FOR DELETE USING (is_admin());

-- deleted_articles
CREATE POLICY "deleted_select_policy" ON deleted_articles
  FOR SELECT USING (is_admin());

CREATE POLICY "deleted_insert_policy" ON deleted_articles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "deleted_delete_policy" ON deleted_articles
  FOR DELETE USING (is_admin());

-- user_activity_logs
CREATE POLICY "activity_read_policy" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "activity_insert_policy" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- ÉTAPE 6: INSÉRER LES PARAMÈTRES PAR DÉFAUT
-- =============================================

INSERT INTO platform_settings (key, value, description, category) VALUES
  ('registration_enabled', '"true"', 'Activer les inscriptions', 'registration'),
  ('auto_publish_profiles', '"false"', 'Auto-publier les profils', 'publication'),
  ('auto_publish_articles', '"false"', 'Auto-publier les articles', 'publication'),
  ('allow_anonymous_reports', '"true"', 'Signalements anonymes', 'moderation')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- FIN DU SCRIPT - SUCCÈS!
-- =============================================
