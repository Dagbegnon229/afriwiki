-- =============================================
-- Fix RLS policies for parcours, entreprises, recompenses
-- Execute this in Supabase SQL Editor
-- =============================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.parcours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recompenses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Public can view parcours" ON public.parcours;
DROP POLICY IF EXISTS "Users can manage own parcours" ON public.parcours;
DROP POLICY IF EXISTS "parcours_select" ON public.parcours;
DROP POLICY IF EXISTS "parcours_all" ON public.parcours;

DROP POLICY IF EXISTS "Public can view entreprises" ON public.entreprises;
DROP POLICY IF EXISTS "Users can manage own entreprises" ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_select" ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_all" ON public.entreprises;

DROP POLICY IF EXISTS "Public can view recompenses" ON public.recompenses;
DROP POLICY IF EXISTS "Users can manage own recompenses" ON public.recompenses;
DROP POLICY IF EXISTS "recompenses_select" ON public.recompenses;
DROP POLICY IF EXISTS "recompenses_all" ON public.recompenses;

-- 3. Create new policies for PARCOURS
-- Public read access (for public profile pages)
CREATE POLICY "parcours_select" ON public.parcours
    FOR SELECT
    USING (true);

-- Authenticated users can insert/update/delete their own
CREATE POLICY "parcours_insert" ON public.parcours
    FOR INSERT
    WITH CHECK (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "parcours_update" ON public.parcours
    FOR UPDATE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "parcours_delete" ON public.parcours
    FOR DELETE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- 4. Create new policies for ENTREPRISES
CREATE POLICY "entreprises_select" ON public.entreprises
    FOR SELECT
    USING (true);

CREATE POLICY "entreprises_insert" ON public.entreprises
    FOR INSERT
    WITH CHECK (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "entreprises_update" ON public.entreprises
    FOR UPDATE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "entreprises_delete" ON public.entreprises
    FOR DELETE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- 5. Create new policies for RECOMPENSES
CREATE POLICY "recompenses_select" ON public.recompenses
    FOR SELECT
    USING (true);

CREATE POLICY "recompenses_insert" ON public.recompenses
    FOR INSERT
    WITH CHECK (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "recompenses_update" ON public.recompenses
    FOR UPDATE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "recompenses_delete" ON public.recompenses
    FOR DELETE
    USING (
        entrepreneur_id IN (
            SELECT id FROM public.entrepreneurs WHERE user_id = auth.uid()
        )
    );

-- 6. Check the data
SELECT 'PARCOURS:' as table_name, COUNT(*) as count FROM public.parcours;
SELECT 'ENTREPRISES:' as table_name, COUNT(*) as count FROM public.entreprises;
SELECT 'RECOMPENSES:' as table_name, COUNT(*) as count FROM public.recompenses;

-- 7. Show all parcours to verify data
SELECT p.id, p.title, p.description, p.start_date, p.end_date, e.first_name, e.last_name
FROM public.parcours p
JOIN public.entrepreneurs e ON p.entrepreneur_id = e.id
ORDER BY p.order_index;
