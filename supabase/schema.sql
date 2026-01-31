-- ============================================
-- AfriWiki Database Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    continent VARCHAR(50)
);

-- Sectors table
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(10),
    description TEXT
);

-- Entrepreneurs table
CREATE TABLE IF NOT EXISTS entrepreneurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    photo_url TEXT,
    bio TEXT,
    headline VARCHAR(200),
    country VARCHAR(2) REFERENCES countries(code),
    city VARCHAR(100),
    verification_level INT DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 4),
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    website TEXT,
    founded_year INT,
    country VARCHAR(2) REFERENCES countries(code),
    sector_id UUID REFERENCES sectors(id),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entrepreneur-Company junction table
CREATE TABLE IF NOT EXISTS entrepreneur_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    UNIQUE(entrepreneur_id, company_id)
);

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),
    document_type VARCHAR(50),
    document_url TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social links table
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url TEXT NOT NULL
);

-- Education table
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(100),
    field VARCHAR(100),
    start_year INT,
    end_year INT
);

-- Awards table
CREATE TABLE IF NOT EXISTS awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    organization VARCHAR(200),
    year INT,
    description TEXT
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_entrepreneurs_slug ON entrepreneurs(slug);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_country ON entrepreneurs(country);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_verification ON entrepreneurs(verification_level);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_published ON entrepreneurs(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_user ON entrepreneurs(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector_id);
CREATE INDEX IF NOT EXISTS idx_verifications_entrepreneur ON verifications(entrepreneur_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_search ON entrepreneurs 
USING GIN(to_tsvector('french', first_name || ' ' || last_name || ' ' || COALESCE(bio, '')));

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Entrepreneurs policies
CREATE POLICY "Published entrepreneurs are viewable by everyone" ON entrepreneurs
    FOR SELECT USING (is_published = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create their own entrepreneur page" ON entrepreneurs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entrepreneur page" ON entrepreneurs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entrepreneur page" ON entrepreneurs
    FOR DELETE USING (auth.uid() = user_id);

-- Countries and Sectors (public read)
CREATE POLICY "Countries are viewable by everyone" ON countries
    FOR SELECT USING (TRUE);

CREATE POLICY "Sectors are viewable by everyone" ON sectors
    FOR SELECT USING (TRUE);

-- Companies (public read, authenticated write)
CREATE POLICY "Companies are viewable by everyone" ON companies
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Related tables follow entrepreneur access
CREATE POLICY "Social links follow entrepreneur access" ON social_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM entrepreneurs e 
            WHERE e.id = social_links.entrepreneur_id 
            AND (e.is_published = TRUE OR auth.uid() = e.user_id)
        )
    );

CREATE POLICY "Education follows entrepreneur access" ON education
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM entrepreneurs e 
            WHERE e.id = education.entrepreneur_id 
            AND (e.is_published = TRUE OR auth.uid() = e.user_id)
        )
    );

CREATE POLICY "Awards follow entrepreneur access" ON awards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM entrepreneurs e 
            WHERE e.id = awards.entrepreneur_id 
            AND (e.is_published = TRUE OR auth.uid() = e.user_id)
        )
    );

CREATE POLICY "Entrepreneur companies follow entrepreneur access" ON entrepreneur_companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM entrepreneurs e 
            WHERE e.id = entrepreneur_companies.entrepreneur_id 
            AND (e.is_published = TRUE OR auth.uid() = e.user_id)
        )
    );

-- Verifications (user can see own, admin can see all)
CREATE POLICY "Users can view own verifications" ON verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM entrepreneurs e 
            WHERE e.id = verifications.entrepreneur_id 
            AND auth.uid() = e.user_id
        )
    );

CREATE POLICY "Users can create verification requests" ON verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM entrepreneurs e 
            WHERE e.id = verifications.entrepreneur_id 
            AND auth.uid() = e.user_id
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_entrepreneurs_updated_at
    BEFORE UPDATE ON entrepreneurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    -- Create base slug from names
    base_slug := LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                UNACCENT(first_name || '-' || last_name),
                '[^a-z0-9-]', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM entrepreneurs WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert African countries
INSERT INTO countries (code, name, flag_emoji, continent) VALUES
    ('DZ', 'Algérie', '🇩🇿', 'Afrique du Nord'),
    ('AO', 'Angola', '🇦🇴', 'Afrique Centrale'),
    ('BJ', 'Bénin', '🇧🇯', 'Afrique de l''Ouest'),
    ('BW', 'Botswana', '🇧🇼', 'Afrique Australe'),
    ('BF', 'Burkina Faso', '🇧🇫', 'Afrique de l''Ouest'),
    ('BI', 'Burundi', '🇧🇮', 'Afrique de l''Est'),
    ('CV', 'Cap-Vert', '🇨🇻', 'Afrique de l''Ouest'),
    ('CM', 'Cameroun', '🇨🇲', 'Afrique Centrale'),
    ('CF', 'Centrafrique', '🇨🇫', 'Afrique Centrale'),
    ('TD', 'Tchad', '🇹🇩', 'Afrique Centrale'),
    ('KM', 'Comores', '🇰🇲', 'Afrique de l''Est'),
    ('CG', 'Congo', '🇨🇬', 'Afrique Centrale'),
    ('CD', 'RD Congo', '🇨🇩', 'Afrique Centrale'),
    ('DJ', 'Djibouti', '🇩🇯', 'Afrique de l''Est'),
    ('EG', 'Égypte', '🇪🇬', 'Afrique du Nord'),
    ('GQ', 'Guinée équatoriale', '🇬🇶', 'Afrique Centrale'),
    ('ER', 'Érythrée', '🇪🇷', 'Afrique de l''Est'),
    ('SZ', 'Eswatini', '🇸🇿', 'Afrique Australe'),
    ('ET', 'Éthiopie', '🇪🇹', 'Afrique de l''Est'),
    ('GA', 'Gabon', '🇬🇦', 'Afrique Centrale'),
    ('GM', 'Gambie', '🇬🇲', 'Afrique de l''Ouest'),
    ('GH', 'Ghana', '🇬🇭', 'Afrique de l''Ouest'),
    ('GN', 'Guinée', '🇬🇳', 'Afrique de l''Ouest'),
    ('GW', 'Guinée-Bissau', '🇬🇼', 'Afrique de l''Ouest'),
    ('CI', 'Côte d''Ivoire', '🇨🇮', 'Afrique de l''Ouest'),
    ('KE', 'Kenya', '🇰🇪', 'Afrique de l''Est'),
    ('LS', 'Lesotho', '🇱🇸', 'Afrique Australe'),
    ('LR', 'Liberia', '🇱🇷', 'Afrique de l''Ouest'),
    ('LY', 'Libye', '🇱🇾', 'Afrique du Nord'),
    ('MG', 'Madagascar', '🇲🇬', 'Afrique de l''Est'),
    ('MW', 'Malawi', '🇲🇼', 'Afrique de l''Est'),
    ('ML', 'Mali', '🇲🇱', 'Afrique de l''Ouest'),
    ('MR', 'Mauritanie', '🇲🇷', 'Afrique de l''Ouest'),
    ('MU', 'Maurice', '🇲🇺', 'Afrique de l''Est'),
    ('MA', 'Maroc', '🇲🇦', 'Afrique du Nord'),
    ('MZ', 'Mozambique', '🇲🇿', 'Afrique de l''Est'),
    ('NA', 'Namibie', '🇳🇦', 'Afrique Australe'),
    ('NE', 'Niger', '🇳🇪', 'Afrique de l''Ouest'),
    ('NG', 'Nigeria', '🇳🇬', 'Afrique de l''Ouest'),
    ('RW', 'Rwanda', '🇷🇼', 'Afrique de l''Est'),
    ('ST', 'São Tomé-et-Príncipe', '🇸🇹', 'Afrique Centrale'),
    ('SN', 'Sénégal', '🇸🇳', 'Afrique de l''Ouest'),
    ('SC', 'Seychelles', '🇸🇨', 'Afrique de l''Est'),
    ('SL', 'Sierra Leone', '🇸🇱', 'Afrique de l''Ouest'),
    ('SO', 'Somalie', '🇸🇴', 'Afrique de l''Est'),
    ('ZA', 'Afrique du Sud', '🇿🇦', 'Afrique Australe'),
    ('SS', 'Soudan du Sud', '🇸🇸', 'Afrique de l''Est'),
    ('SD', 'Soudan', '🇸🇩', 'Afrique du Nord'),
    ('TZ', 'Tanzanie', '🇹🇿', 'Afrique de l''Est'),
    ('TG', 'Togo', '🇹🇬', 'Afrique de l''Ouest'),
    ('TN', 'Tunisie', '🇹🇳', 'Afrique du Nord'),
    ('UG', 'Ouganda', '🇺🇬', 'Afrique de l''Est'),
    ('ZM', 'Zambie', '🇿🇲', 'Afrique de l''Est'),
    ('ZW', 'Zimbabwe', '🇿🇼', 'Afrique de l''Est')
ON CONFLICT (code) DO NOTHING;

-- Insert sectors
INSERT INTO sectors (name, slug, icon, description) VALUES
    ('Fintech & Mobile Money', 'fintech', '💰', 'Services financiers et paiements mobiles'),
    ('Agriculture & Agritech', 'agriculture', '🌾', 'Agriculture et technologies agricoles'),
    ('Santé & Healthtech', 'sante', '🏥', 'Santé et technologies médicales'),
    ('Éducation & Edtech', 'education', '🎓', 'Éducation et e-learning'),
    ('E-commerce & Retail', 'ecommerce', '🛒', 'Commerce en ligne et distribution'),
    ('Énergie & Cleantech', 'energie', '⚡', 'Énergie renouvelable et technologies propres'),
    ('Logistique & Transport', 'logistique', '🚚', 'Logistique et mobilité'),
    ('Construction & Immobilier', 'immobilier', '🏗️', 'BTP et promotion immobilière'),
    ('Médias & Divertissement', 'medias', '🎨', 'Médias, créativité et entertainment'),
    ('Services aux entreprises', 'services', '💼', 'B2B et services professionnels'),
    ('Télécommunications', 'telecom', '📡', 'Télécoms et connectivité'),
    ('Industrie & Manufacturing', 'industrie', '🏭', 'Industrie et fabrication')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ AfriWiki database schema created successfully!';
    RAISE NOTICE '📊 Tables: profiles, entrepreneurs, companies, sectors, countries, verifications, etc.';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '🌍 54 African countries inserted';
    RAISE NOTICE '📂 12 business sectors inserted';
END $$;
