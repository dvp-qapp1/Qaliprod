-- ═══════════════════════════════════════════════════════════════════════════════
-- ALACENA (PANTRY) SCHEMA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- =====================
-- INGREDIENTS TABLE (Global Master List)
-- =====================
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for case-insensitive searching if needed later
CREATE INDEX idx_ingredients_name ON public.ingredients (name);

-- =====================
-- PANTRY ITEMS TABLE (User specific)
-- =====================
CREATE TABLE public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  
  quantity NUMERIC(10,2),
  unit TEXT, -- e.g., 'unidades', 'gramos', 'ml', 'tazas'
  
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, ingredient_id)
);

-- Indices for performance
CREATE INDEX idx_pantry_user ON public.pantry_items (user_id);
CREATE INDEX idx_pantry_user_updated ON public.pantry_items (user_id, last_updated DESC);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

-- Ingredients: Everyone can read, only system can insert/update for now (via service role)
-- Actually, let's allow users to insert if they are authenticated, but keep it simple.
CREATE POLICY "Anyone can view ingredients"
  ON public.ingredients FOR SELECT
  USING (true);

-- Pantry Items: Users can only see and manage their own
CREATE POLICY "Users view own pantry items"
  ON public.pantry_items FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own pantry items"
  ON public.pantry_items FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users update own pantry items"
  ON public.pantry_items FOR UPDATE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users delete own pantry items"
  ON public.pantry_items FOR DELETE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- =====================
-- UPDATED_AT TRIGGER
-- =====================
CREATE TRIGGER update_pantry_items_updated_at
  BEFORE UPDATE ON public.pantry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
