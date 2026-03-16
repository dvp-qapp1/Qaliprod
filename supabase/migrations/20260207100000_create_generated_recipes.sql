-- Migration: Create generated_recipes table for Chef Mode
-- Stores AI-generated recipes created by the user from their pantry
CREATE TABLE IF NOT EXISTS generated_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions JSONB DEFAULT '[]'::jsonb,
    calories INT,
    image_url TEXT,
    description TEXT,
    source_ingredients JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups and chronological ordering
CREATE INDEX IF NOT EXISTS idx_generated_recipes_user_created 
ON generated_recipes(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE generated_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own generated recipes
CREATE POLICY "Users can view own generated recipes" ON generated_recipes
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy: Users can insert own generated recipes
CREATE POLICY "Users can insert own generated recipes" ON generated_recipes
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy: Users can delete own generated recipes
CREATE POLICY "Users can delete own generated recipes" ON generated_recipes
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())
        )
    );
