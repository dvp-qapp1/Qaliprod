-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX INGREDIENTS RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Allow authenticated users to insert new ingredients
CREATE POLICY "Users can insert ingredients"
  ON public.ingredients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update ingredients (needed for upsert conflict resolution)
CREATE POLICY "Users can update ingredients"
  ON public.ingredients FOR UPDATE
  USING (auth.role() = 'authenticated');
