-- =============================================
-- Table pour les éléments à la une (Featured)
-- =============================================

CREATE TABLE IF NOT EXISTS featured_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type d'élément (entrepreneur ou article)
  item_type text NOT NULL CHECK (item_type IN ('entrepreneur', 'article')),
  
  -- ID de l'élément (entrepreneur_id ou article_id)
  item_id uuid NOT NULL,
  
  -- Position d'affichage (1 = principal, 2+ = secondaire)
  position integer NOT NULL DEFAULT 1,
  
  -- Période de mise en avant
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone, -- NULL = indéfini
  
  -- Métadonnées
  reason text, -- Pourquoi cet élément est mis en avant
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE(item_type, item_id, position)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_featured_active ON featured_items(item_type, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_featured_position ON featured_items(position);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les éléments à la une actifs
DROP POLICY IF EXISTS "Public can view active featured items" ON featured_items;
CREATE POLICY "Public can view active featured items" ON featured_items
  FOR SELECT
  USING (
    starts_at <= now() AND (ends_at IS NULL OR ends_at > now())
  );

-- Seul l'admin peut gérer les éléments à la une
DROP POLICY IF EXISTS "Admin can manage featured items" ON featured_items;
CREATE POLICY "Admin can manage featured items" ON featured_items
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
  );

-- =============================================
-- Vue pour récupérer les éléments à la une avec leurs détails
-- =============================================

CREATE OR REPLACE VIEW featured_entrepreneurs AS
SELECT 
  f.id as featured_id,
  f.position,
  f.starts_at,
  f.ends_at,
  f.reason,
  e.*
FROM featured_items f
JOIN entrepreneurs e ON f.item_id = e.id
WHERE f.item_type = 'entrepreneur'
  AND f.starts_at <= now()
  AND (f.ends_at IS NULL OR f.ends_at > now())
  AND e.is_published = true
ORDER BY f.position ASC;

CREATE OR REPLACE VIEW featured_articles AS
SELECT 
  f.id as featured_id,
  f.position,
  f.starts_at,
  f.ends_at,
  f.reason,
  a.*
FROM featured_items f
JOIN articles a ON f.item_id = a.id
WHERE f.item_type = 'article'
  AND f.starts_at <= now()
  AND (f.ends_at IS NULL OR f.ends_at > now())
  AND a.status = 'published'
ORDER BY f.position ASC;
