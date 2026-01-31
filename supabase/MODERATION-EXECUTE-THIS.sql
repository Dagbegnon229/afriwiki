-- =========================================
-- SCRIPT SYSTÈME DE MODÉRATION
-- Exécuter dans Supabase SQL Editor
-- =========================================

-- Table pour stocker les demandes de modification
CREATE TABLE IF NOT EXISTS modification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- L'entrepreneur concerné
    entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    entrepreneur_slug TEXT NOT NULL,
    
    -- L'utilisateur qui fait la demande (peut être null si anonyme)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    
    -- Contenu de la modification
    field_name TEXT NOT NULL, -- bio, headline, parcours, entreprises, etc.
    current_value TEXT, -- Valeur actuelle
    proposed_value TEXT NOT NULL, -- Valeur proposée
    
    -- Justification
    reason TEXT, -- Pourquoi cette modification ?
    source_url TEXT, -- Source pour vérifier
    
    -- Statut
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Réponse admin
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_mod_requests_status ON modification_requests(status);
CREATE INDEX IF NOT EXISTS idx_mod_requests_entrepreneur ON modification_requests(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_mod_requests_created ON modification_requests(created_at DESC);

-- Politiques RLS
ALTER TABLE modification_requests ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent créer des demandes
CREATE POLICY "Allow authenticated insert on modification_requests"
    ON modification_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Les utilisateurs anonymes peuvent aussi proposer des modifications
CREATE POLICY "Allow anon insert on modification_requests"
    ON modification_requests FOR INSERT
    TO anon
    WITH CHECK (true);

-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view own modification_requests"
    ON modification_requests FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admin full access on modification_requests"
    ON modification_requests FOR ALL
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

-- Fonction pour obtenir les stats de modération
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE (
    pending_count BIGINT,
    approved_count BIGINT,
    rejected_count BIGINT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) as total_count
    FROM modification_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_moderation_stats() TO authenticated;
