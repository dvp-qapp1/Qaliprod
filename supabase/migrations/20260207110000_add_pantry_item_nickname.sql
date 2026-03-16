-- Add nickname column to pantry_items table
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update the comment to explain usage
COMMENT ON COLUMN public.pantry_items.nickname IS 'User-defined name for the ingredient, overrides the global master list name in UI.';
