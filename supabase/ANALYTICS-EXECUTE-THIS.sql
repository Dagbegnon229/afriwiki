-- =========================================
-- SCRIPT STATISTIQUES DE VISITE
-- Exécuter dans Supabase SQL Editor
-- =========================================

-- Table pour stocker les vues de pages
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    session_id TEXT,
    visitor_id TEXT,
    entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_entrepreneur_id ON page_views(entrepreneur_id);

-- Table pour les statistiques agrégées (rafraîchies périodiquement)
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE NOT NULL UNIQUE,
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    top_pages JSONB,
    top_referrers JSONB,
    top_countries JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Politiques RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour l'insertion des vues (anonyme)
CREATE POLICY "Allow anonymous inserts on page_views"
    ON page_views FOR INSERT
    TO anon
    WITH CHECK (true);

-- Lecture pour les admins uniquement
CREATE POLICY "Allow admin read on page_views"
    ON page_views FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
    );

CREATE POLICY "Allow admin read on daily_stats"
    ON daily_stats FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        auth.jwt() ->> 'email' = 'linkpehoundagbegnon@gmail.com'
    );

-- Fonction pour obtenir les stats des 7 derniers jours
CREATE OR REPLACE FUNCTION get_weekly_stats()
RETURNS TABLE (
    day DATE,
    views BIGINT,
    unique_visitors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as day,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as unique_visitors
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les pages les plus visitées
CREATE OR REPLACE FUNCTION get_top_pages(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    page_path TEXT,
    views BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.page_path,
        COUNT(*) as views
    FROM page_views pv
    WHERE pv.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY pv.page_path
    ORDER BY views DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les sources de trafic
CREATE OR REPLACE FUNCTION get_top_referrers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    referrer TEXT,
    views BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(NULLIF(pv.referrer, ''), 'Direct') as referrer,
        COUNT(*) as views
    FROM page_views pv
    WHERE pv.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY COALESCE(NULLIF(pv.referrer, ''), 'Direct')
    ORDER BY views DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions sur les fonctions
GRANT EXECUTE ON FUNCTION get_weekly_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_pages(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_referrers(INTEGER) TO authenticated;
