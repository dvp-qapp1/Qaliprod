-- Migration: Create suggested_recipes table for daily recipe persistence
-- Stores AI-generated recipe suggestions with refresh limit tracking

CREATE TABLE IF NOT EXISTS suggested_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image TEXT,
    calories INT,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions JSONB DEFAULT '[]'::jsonb,
    image_description TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_date DATE DEFAULT CURRENT_DATE,
    refresh_count INT DEFAULT 0
);

-- Ensure only one recipe per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_suggested_recipes_user_day 
ON suggested_recipes(user_id, generated_date);

-- Index for fast user + date lookups
CREATE INDEX IF NOT EXISTS idx_suggested_recipes_user_date 
ON suggested_recipes(user_id, generated_at);

-- Enable RLS
ALTER TABLE suggested_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own recipes
CREATE POLICY "Users can view own suggested recipes" ON suggested_recipes
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy: Users can insert their own recipes
CREATE POLICY "Users can insert own suggested recipes" ON suggested_recipes
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy: Users can update their own recipes (for refresh_count increment)
CREATE POLICY "Users can update own suggested recipes" ON suggested_recipes
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())
        )
    );
