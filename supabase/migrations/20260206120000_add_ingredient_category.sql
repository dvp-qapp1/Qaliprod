-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD CATEGORY COLUMN TO INGREDIENTS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ingredients ADD COLUMN category TEXT;

-- Index for category-based filtering
CREATE INDEX idx_ingredients_category ON public.ingredients (category);

-- Add comment explaining categories for future reference
COMMENT ON COLUMN public.ingredients.category IS 'Technical slug for category: abarrotes, congelados, refrigerados, frutas_verduras, snacks_dulces, bebidas, especias_condimentos, panaderia_reposteria, otros';
