-- =============================================
-- Tables pour l'administration AfriWiki
-- =============================================

-- Table pour les utilisateurs bannis
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_at timestamp with time zone DEFAULT now(),
  banned_by uuid REFERENCES auth.users(id),
  reason text,
  unbanned_at timestamp with time zone,
  UNIQUE(user_id)
);

-- Table pour les demandes KYC
CREATE TABLE IF NOT EXISTS kyc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id uuid REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  requested_level integer NOT NULL DEFAULT 2,
  current_level integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_type text, -- 'id_card', 'passport', 'business_registration', etc.
  document_url text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table pour l'historique des actions admin
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL, -- 'ban_user', 'unban_user', 'approve_kyc', 'reject_kyc', 'publish_article', etc.
  target_type text NOT NULL, -- 'user', 'article', 'source', 'entrepreneur'
  target_id uuid NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Ajouter une colonne pour le statut de publication des articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_notes text;

-- Ajouter une colonne pour le statut de vérification des entrepreneurs
ALTER TABLE entrepreneurs ADD COLUMN IF NOT EXISTS verification_requested_at timestamp with time zone;
ALTER TABLE entrepreneurs ADD COLUMN IF NOT EXISTS verification_notes text;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests(status);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_entrepreneur ON kyc_requests(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON admin_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_created ON admin_actions_log(created_at DESC);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Policies pour banned_users
DROP POLICY IF EXISTS "Admin can read banned users" ON banned_users;
CREATE POLICY "Admin can read banned users" ON banned_users
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can ban users" ON banned_users;
CREATE POLICY "Admin can ban users" ON banned_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can update bans" ON banned_users;
CREATE POLICY "Admin can update bans" ON banned_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

-- Policies pour kyc_requests
DROP POLICY IF EXISTS "Users can see own KYC requests" ON kyc_requests;
CREATE POLICY "Users can see own KYC requests" ON kyc_requests
  FOR SELECT
  TO authenticated
  USING (
    entrepreneur_id IN (
      SELECT id FROM entrepreneurs WHERE user_id = auth.uid()
    )
    OR
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Users can submit KYC requests" ON kyc_requests;
CREATE POLICY "Users can submit KYC requests" ON kyc_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    entrepreneur_id IN (
      SELECT id FROM entrepreneurs WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can update KYC requests" ON kyc_requests;
CREATE POLICY "Admin can update KYC requests" ON kyc_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

-- Policies pour admin_actions_log
DROP POLICY IF EXISTS "Admin can read action log" ON admin_actions_log;
CREATE POLICY "Admin can read action log" ON admin_actions_log
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can insert action log" ON admin_actions_log;
CREATE POLICY "Admin can insert action log" ON admin_actions_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

-- Permettre à l'admin de modifier tous les articles
DROP POLICY IF EXISTS "Admin can update all articles" ON articles;
CREATE POLICY "Admin can update all articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can delete all articles" ON articles;
CREATE POLICY "Admin can delete all articles" ON articles
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

-- Permettre à l'admin de modifier tous les entrepreneurs
DROP POLICY IF EXISTS "Admin can update all entrepreneurs" ON entrepreneurs;
CREATE POLICY "Admin can update all entrepreneurs" ON entrepreneurs
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can delete all entrepreneurs" ON entrepreneurs;
CREATE POLICY "Admin can delete all entrepreneurs" ON entrepreneurs
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

-- Permettre à l'admin de modifier toutes les sources
DROP POLICY IF EXISTS "Admin can update all sources" ON sources;
CREATE POLICY "Admin can update all sources" ON sources
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can delete all sources" ON sources;
CREATE POLICY "Admin can delete all sources" ON sources
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );
