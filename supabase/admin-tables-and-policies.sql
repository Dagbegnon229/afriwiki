-- =============================================
-- TABLES ADMIN ET POLITIQUES - AfriWiki
-- Exécuter APRÈS security-policies-fixed.sql
-- =============================================

-- =============================================
-- 1. TABLE FEATURED_ITEMS (À la une)
-- =============================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS featured_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('entrepreneur', 'article')),
  item_id uuid NOT NULL,
  position integer DEFAULT 1,
  reason text,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_featured_items_active ON featured_items(is_active, position);

ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public read featured" ON featured_items;
DROP POLICY IF EXISTS "Admin manage featured" ON featured_items;
DROP POLICY IF EXISTS "Public read active featured" ON featured_items;
DROP POLICY IF EXISTS "featured_select_policy" ON featured_items;
DROP POLICY IF EXISTS "featured_admin_policy" ON featured_items;

-- Nouvelles politiques
CREATE POLICY "featured_select_policy" ON featured_items
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "featured_admin_policy" ON featured_items
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- 2. TABLE REPORTS (Signalements)
-- =============================================

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('entrepreneur', 'article', 'source', 'comment')),
  content_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'spam', 'inappropriate', 'false_information', 'copyright', 'harassment', 'other'
  )),
  description text,
  reporter_id uuid REFERENCES auth.users(id),
  reporter_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution text CHECK (resolution IN ('content_removed', 'content_edited', 'user_warned', 'user_banned', 'no_action')),
  resolution_note text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create reports" ON reports;
DROP POLICY IF EXISTS "Admin can manage reports" ON reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON reports;
DROP POLICY IF EXISTS "reports_admin_policy" ON reports;

-- Tout le monde peut créer un signalement
CREATE POLICY "reports_insert_policy" ON reports
  FOR INSERT WITH CHECK (true);

-- Seul l'admin peut voir et gérer
CREATE POLICY "reports_admin_policy" ON reports
  FOR SELECT USING (is_admin());

CREATE POLICY "reports_update_policy" ON reports
  FOR UPDATE USING (is_admin());

CREATE POLICY "reports_delete_policy" ON reports
  FOR DELETE USING (is_admin());

-- =============================================
-- 3. TABLE ADMIN_ACTIVITY_LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  admin_email text,
  action_type text NOT NULL,
  action_category text NOT NULL CHECK (action_category IN (
    'user_management', 'content_moderation', 'profile_validation', 
    'kyc_validation', 'featured_management', 'settings', 'other'
  )),
  target_type text,
  target_id uuid,
  target_name text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_activity_logs(created_at DESC);

ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admin only logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "admin_logs_policy" ON admin_activity_logs;

CREATE POLICY "admin_logs_policy" ON admin_activity_logs
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- 4. TABLE PLATFORM_SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'registration', 'publication', 'validation', 'moderation', 'appearance', 'other'
  )),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON platform_settings;
DROP POLICY IF EXISTS "Admin write settings" ON platform_settings;
DROP POLICY IF EXISTS "settings_read_policy" ON platform_settings;
DROP POLICY IF EXISTS "settings_admin_policy" ON platform_settings;

-- Lecture publique
CREATE POLICY "settings_read_policy" ON platform_settings
  FOR SELECT USING (true);

-- Écriture admin
CREATE POLICY "settings_admin_policy" ON platform_settings
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- Insérer les paramètres par défaut
INSERT INTO platform_settings (key, value, description, category) VALUES
  ('registration_enabled', 'true', 'Activer/désactiver les inscriptions', 'registration'),
  ('registration_requires_email_verification', 'true', 'Exiger la vérification email', 'registration'),
  ('auto_publish_profiles', 'false', 'Publier automatiquement les profils', 'publication'),
  ('auto_publish_articles', 'false', 'Publier automatiquement les articles', 'publication'),
  ('min_bio_length', '100', 'Longueur minimale de la biographie', 'validation'),
  ('require_photo_for_publish', 'false', 'Exiger une photo pour publier', 'validation'),
  ('min_sources_for_verification', '2', 'Nombre minimum de sources pour vérification', 'validation'),
  ('allow_anonymous_reports', 'true', 'Autoriser les signalements anonymes', 'moderation'),
  ('auto_hide_reported_content', 'false', 'Masquer automatiquement le contenu signalé', 'moderation')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 5. TABLE USER_ACTIVITY_LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity_logs(created_at DESC);

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own or admin activity" ON user_activity_logs;
DROP POLICY IF EXISTS "Read own activity" ON user_activity_logs;
DROP POLICY IF EXISTS "System insert activity" ON user_activity_logs;
DROP POLICY IF EXISTS "activity_read_policy" ON user_activity_logs;
DROP POLICY IF EXISTS "activity_insert_policy" ON user_activity_logs;

-- Utilisateur peut voir ses propres logs, admin voit tout
CREATE POLICY "activity_read_policy" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- Système peut insérer
CREATE POLICY "activity_insert_policy" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 6. TABLE BANNED_USERS
-- =============================================

CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_until timestamp with time zone, -- NULL = permanent
  reason text,
  banned_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_banned_users ON banned_users(user_id);

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banned_admin_policy" ON banned_users;

CREATE POLICY "banned_admin_policy" ON banned_users
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- 7. TABLE DELETED_ARTICLES (Corbeille)
-- =============================================

CREATE TABLE IF NOT EXISTS deleted_articles (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  deleted_by uuid REFERENCES auth.users(id),
  deletion_reason text,
  deleted_at timestamp with time zone DEFAULT now()
);

ALTER TABLE deleted_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage deleted articles" ON deleted_articles;
DROP POLICY IF EXISTS "deleted_admin_policy" ON deleted_articles;

CREATE POLICY "deleted_admin_policy" ON deleted_articles
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RÉSUMÉ DES TABLES CRÉÉES
-- =============================================
-- ✓ featured_items - Éléments à la une
-- ✓ reports - Signalements
-- ✓ admin_activity_logs - Logs admin
-- ✓ platform_settings - Paramètres plateforme
-- ✓ user_activity_logs - Activité utilisateur
-- ✓ banned_users - Utilisateurs bannis
-- ✓ deleted_articles - Articles supprimés
