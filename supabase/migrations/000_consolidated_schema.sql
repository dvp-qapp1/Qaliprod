-- ═══════════════════════════════════════════════════════════════════════════════
-- QALIA DATABASE SCHEMA - CONSOLIDATED MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- This is a consolidated migration for fresh database installations.
-- It includes all tables, indices, triggers, RLS policies, and functions.
--
-- Created: 2026-02-02
-- Version: 1.0.0
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  
  -- Personal info
  age INTEGER CHECK (age > 0 AND age < 150),
  gender TEXT CHECK (gender IN (
    'male', 'female', 'other', 'prefer_not_to_say',
    'hombre', 'mujer', 'otro'  -- Spanish values from onboarding
  )),
  height_cm NUMERIC(5,2) CHECK (height_cm > 0),
  weight_kg NUMERIC(5,2) CHECK (weight_kg > 0),
  bmi NUMERIC(4,1) CHECK (bmi > 0 AND bmi < 100),
  
  -- Goals & Preferences
  goal TEXT CHECK (goal IN (
    'lose_weight', 'gain_muscle', 'maintain', 'eat_healthy',
    'Perder peso', 'Ganar músculo', 'Mantener peso', 'Mejorar energía', 'Mejorar digestión'
  )),
  activity_level TEXT CHECK (activity_level IN (
    'sedentary', 'light', 'moderate', 'active', 'very_active',
    'Sedentario', 'Ligeramente Activo', 'Moderado', 'Muy Activo'
  )),
  target_calories INTEGER CHECK (target_calories > 0),
  
  -- Dietary preferences & restrictions
  allergies TEXT[] DEFAULT '{}',
  diet_style TEXT[] DEFAULT '{}',
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Subscription cache (updated via webhook)
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps with timezone
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Column comments for documentation
COMMENT ON COLUMN profiles.allergies IS 'User food allergies (e.g., Gluten, Lácteos, Nueces)';
COMMENT ON COLUMN profiles.diet_style IS 'Dietary preferences (e.g., Vegetariano, Vegano, Keto)';
COMMENT ON COLUMN profiles.bmi IS 'Body Mass Index calculated during onboarding';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding wizard';
COMMENT ON COLUMN profiles.target_calories IS 'User-defined daily calorie target in kcal';

-- =====================
-- MEALS TABLE
-- =====================
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(8,2) NOT NULL CHECK (protein >= 0),
  carbs NUMERIC(8,2) NOT NULL CHECK (carbs >= 0),
  fat NUMERIC(8,2) NOT NULL CHECK (fat >= 0),
  
  image_url TEXT,
  ingredients TEXT[] DEFAULT '{}',
  detailed_ingredients JSONB,
  safety_status TEXT CHECK (safety_status IN ('safe', 'warning', 'danger')),
  coach_feedback TEXT,
  
  meal_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON COLUMN meals.detailed_ingredients IS 'Array of ingredients with safety info: [{name, calories, safe, warning}]';
COMMENT ON COLUMN meals.coach_feedback IS 'Personalized coaching feedback from Kili AI, generated at the time of meal registration';

-- =====================
-- DAILY CALORIES TABLE
-- Aggregated daily stats (updated via trigger)
-- =====================
CREATE TABLE daily_calories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  total_calories NUMERIC(10,2) DEFAULT 0,
  protein NUMERIC(10,2) DEFAULT 0,
  carbs NUMERIC(10,2) DEFAULT 0,
  fat NUMERIC(10,2) DEFAULT 0,
  meals_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, date)
);

-- =====================
-- CHAT HISTORY TABLE
-- =====================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================
-- WEIGHT HISTORY TABLE
-- =====================
CREATE TABLE weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
  notes TEXT,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDICES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Meals indices
CREATE INDEX idx_meals_user_created ON meals (user_id, created_at DESC);
CREATE INDEX idx_meals_user_meal_time ON meals (user_id, meal_time DESC);
CREATE INDEX idx_meals_user_safety ON meals (user_id, safety_status) WHERE safety_status IS NOT NULL;

-- Daily calories indices
CREATE INDEX idx_daily_user_date ON daily_calories (user_id, date DESC);

-- Profiles indices
CREATE INDEX idx_profiles_active ON profiles (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_premium ON profiles (subscription_tier) WHERE subscription_tier != 'free';
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed) WHERE onboarding_completed = false;

-- Chat messages indices
CREATE INDEX idx_chat_user_created ON chat_messages (user_id, created_at DESC);

-- Weight entries indices
CREATE INDEX idx_weight_user_recorded ON weight_entries (user_id, recorded_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_calories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- =====================
-- PROFILES POLICIES
-- =====================
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Prevent hard delete (use soft delete via deleted_at)
CREATE POLICY "Prevent profile deletion"
  ON profiles FOR DELETE
  USING (false);

-- =====================
-- MEALS POLICIES
-- =====================
CREATE POLICY "Users view own meals"
  ON meals FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own meals"
  ON meals FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users delete own meals"
  ON meals FOR DELETE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- =====================
-- DAILY CALORIES POLICIES
-- =====================
CREATE POLICY "Users view own daily calories"
  ON daily_calories FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- =====================
-- CHAT MESSAGES POLICIES
-- =====================
CREATE POLICY "Users view own chat messages"
  ON chat_messages FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- =====================
-- WEIGHT ENTRIES POLICIES
-- =====================
CREATE POLICY "Users view own weight entries"
  ON weight_entries FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own weight entries"
  ON weight_entries FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users delete own weight entries"
  ON weight_entries FOR DELETE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- =====================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_calories_updated_at
  BEFORE UPDATE ON daily_calories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- DAILY CALORIES AGGREGATION (ON MEAL INSERT)
-- Uses SECURITY DEFINER to bypass RLS for trigger execution
-- =====================
CREATE OR REPLACE FUNCTION update_daily_calories_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_calories (user_id, date, total_calories, protein, carbs, fat, meals_count)
  VALUES (
    NEW.user_id,
    DATE(NEW.meal_time),
    NEW.calories,
    NEW.protein,
    NEW.carbs,
    NEW.fat,
    1
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calories = daily_calories.total_calories + EXCLUDED.total_calories,
    protein = daily_calories.protein + EXCLUDED.protein,
    carbs = daily_calories.carbs + EXCLUDED.carbs,
    fat = daily_calories.fat + EXCLUDED.fat,
    meals_count = daily_calories.meals_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_meals_to_daily_calories
  AFTER INSERT ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_calories_on_insert();

-- =====================
-- DAILY CALORIES AGGREGATION (ON MEAL DELETE)
-- Uses SECURITY DEFINER to bypass RLS for trigger execution
-- =====================
CREATE OR REPLACE FUNCTION update_daily_calories_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_calories SET
    total_calories = GREATEST(0, total_calories - OLD.calories),
    protein = GREATEST(0, protein - OLD.protein),
    carbs = GREATEST(0, carbs - OLD.carbs),
    fat = GREATEST(0, fat - OLD.fat),
    meals_count = GREATEST(0, meals_count - 1),
    updated_at = NOW()
  WHERE user_id = OLD.user_id AND date = DATE(OLD.meal_time);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_meals_delete_daily_calories
  AFTER DELETE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_calories_on_delete();

-- =====================
-- PROFILE CREATION ON AUTH SIGNUP
-- Automatically creates profile when user signs up
-- Uses SECURITY DEFINER to insert into profiles table
-- =====================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF CONSOLIDATED MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
