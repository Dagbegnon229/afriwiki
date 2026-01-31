-- =============================================
-- Tables pour la modération et les paramètres AfriWiki
-- =============================================

-- =============================================
-- 1. SIGNALEMENTS (Reports)
-- =============================================

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de contenu signalé
  content_type text NOT NULL CHECK (content_type IN ('entrepreneur', 'article', 'source', 'comment')),
  content_id uuid NOT NULL,
  
  -- Informations sur le signalement
  reason text NOT NULL CHECK (reason IN (
    'spam',
    'inappropriate',
    'false_information',
    'copyright',
    'harassment',
    'other'
  )),
  description text,
  
  -- Qui a signalé
  reporter_id uuid REFERENCES auth.users(id),
  reporter_email text,
  
  -- Statut du signalement
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  
  -- Résolution
  resolution text CHECK (resolution IN ('content_removed', 'content_edited', 'user_warned', 'user_banned', 'no_action')),
  resolution_note text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);

-- =============================================
-- 2. LOGS D'ACTIVITÉ ADMIN
-- =============================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  admin_id uuid REFERENCES auth.users(id),
  admin_email text,
  
  action_type text NOT NULL,
  action_category text NOT NULL CHECK (action_category IN (
    'user_management',
    'content_moderation',
    'profile_validation',
    'kyc_validation',
    'featured_management',
    'settings',
    'other'
  )),
  
  -- Cible de l'action
  target_type text,
  target_id uuid,
  target_name text,
  
  -- Détails
  details jsonb,
  ip_address text,
  user_agent text,
  
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_activity_logs(created_at DESC);

-- =============================================
-- 3. PARAMÈTRES GLOBAUX
-- =============================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'registration',
    'publication',
    'validation',
    'moderation',
    'appearance',
    'other'
  )),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insérer les paramètres par défaut
INSERT INTO platform_settings (key, value, description, category) VALUES
  ('registration_enabled', 'true', 'Activer/désactiver les inscriptions', 'registration'),
  ('registration_requires_email_verification', 'true', 'Exiger la vérification email', 'registration'),
  ('auto_publish_profiles', 'false', 'Publier automatiquement les profils (sans validation)', 'publication'),
  ('auto_publish_articles', 'false', 'Publier automatiquement les articles (sans validation)', 'publication'),
  ('min_bio_length', '100', 'Longueur minimale de la biographie', 'validation'),
  ('require_photo_for_publish', 'false', 'Exiger une photo pour publier', 'validation'),
  ('min_sources_for_verification', '2', 'Nombre minimum de sources pour être vérifié', 'validation'),
  ('allow_anonymous_reports', 'true', 'Autoriser les signalements anonymes', 'moderation'),
  ('auto_hide_reported_content', 'false', 'Masquer automatiquement le contenu signalé', 'moderation')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 4. SESSIONS UTILISATEURS (pour déconnexion forcée)
-- =============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- =============================================
-- 5. HISTORIQUE D'ACTIVITÉ UTILISATEUR
-- =============================================

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action_type text NOT NULL CHECK (action_type IN (
    'login',
    'logout',
    'profile_created',
    'profile_updated',
    'article_created',
    'article_updated',
    'source_added',
    'report_submitted'
  )),
  
  details jsonb,
  ip_address text,
  
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity_logs(created_at DESC);

-- =============================================
-- 6. ARTICLES SUPPRIMÉS (pour restauration)
-- =============================================

CREATE TABLE IF NOT EXISTS deleted_articles (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  deleted_by uuid REFERENCES auth.users(id),
  deletion_reason text,
  deleted_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_articles ENABLE ROW LEVEL SECURITY;

-- Reports: tout le monde peut créer, seul admin peut lire/modifier
DROP POLICY IF EXISTS "Anyone can create reports" ON reports;
CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage reports" ON reports;
CREATE POLICY "Admin can manage reports" ON reports
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com');

-- Admin logs: seul admin
DROP POLICY IF EXISTS "Admin can access logs" ON admin_activity_logs;
CREATE POLICY "Admin can access logs" ON admin_activity_logs
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com');

-- Settings: lecture publique, écriture admin
DROP POLICY IF EXISTS "Public can read settings" ON platform_settings;
CREATE POLICY "Public can read settings" ON platform_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can update settings" ON platform_settings;
CREATE POLICY "Admin can update settings" ON platform_settings
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com');

-- User sessions: admin only
DROP POLICY IF EXISTS "Admin can manage sessions" ON user_sessions;
CREATE POLICY "Admin can manage sessions" ON user_sessions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com');

-- User activity: users see own, admin sees all
DROP POLICY IF EXISTS "Users can see own activity" ON user_activity_logs;
CREATE POLICY "Users can see own activity" ON user_activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com');

-- Deleted articles: admin only
DROP POLICY IF EXISTS "Admin can manage deleted articles" ON deleted_articles;
CREATE POLICY "Admin can manage deleted articles" ON deleted_articles
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com');
