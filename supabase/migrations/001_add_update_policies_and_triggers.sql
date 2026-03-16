-- ═══════════════════════════════════════════════════════════════════════════════
-- QALIA DATABASE SCHEMA - UPDATE POLICIES AND TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- This migration adds missing UPDATE capabilities:
-- 1. UPDATE policy for meals table
-- 2. UPDATE policy for weight_entries table
-- 3. UPDATE trigger for daily_calories aggregation when meals are modified
--
-- Created: 2026-02-02
-- Version: 1.0.1
-- ═══════════════════════════════════════════════════════════════════════════════

-- =====================
-- MEALS UPDATE POLICY
-- Allows users to correct meal information (macros, name, etc.)
-- =====================
CREATE POLICY "Users update own meals"
  ON meals FOR UPDATE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- =====================
-- WEIGHT ENTRIES UPDATE POLICY
-- Allows users to correct weight entries
-- =====================
CREATE POLICY "Users update own weight entries"
  ON weight_entries FOR UPDATE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- =====================
-- DAILY CALORIES AGGREGATION (ON MEAL UPDATE)
-- Handles three scenarios:
-- 1. Meal macros changed (same day) → Update difference
-- 2. Meal moved to different day → Subtract from old, add to new
-- 3. Both macros and day changed → Full recalculation
-- Uses SECURITY DEFINER to bypass RLS for trigger execution
-- =====================
CREATE OR REPLACE FUNCTION update_daily_calories_on_update()
RETURNS TRIGGER AS $$
DECLARE
  old_date DATE := DATE(OLD.meal_time);
  new_date DATE := DATE(NEW.meal_time);
BEGIN
  -- If meal was moved to a different day
  IF old_date != new_date THEN
    -- Subtract from old day
    UPDATE daily_calories SET
      total_calories = GREATEST(0, total_calories - OLD.calories),
      protein = GREATEST(0, protein - OLD.protein),
      carbs = GREATEST(0, carbs - OLD.carbs),
      fat = GREATEST(0, fat - OLD.fat),
      meals_count = GREATEST(0, meals_count - 1),
      updated_at = NOW()
    WHERE user_id = OLD.user_id AND date = old_date;
    
    -- Add to new day (upsert)
    INSERT INTO daily_calories (user_id, date, total_calories, protein, carbs, fat, meals_count)
    VALUES (
      NEW.user_id,
      new_date,
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
  ELSE
    -- Same day, just update the difference
    UPDATE daily_calories SET
      total_calories = GREATEST(0, total_calories + (NEW.calories - OLD.calories)),
      protein = GREATEST(0, protein + (NEW.protein - OLD.protein)),
      carbs = GREATEST(0, carbs + (NEW.carbs - OLD.carbs)),
      fat = GREATEST(0, fat + (NEW.fat - OLD.fat)),
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND date = new_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_meals_update_daily_calories
  AFTER UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_calories_on_update();

-- =====================
-- MEALS UPDATED_AT TRIGGER
-- Auto-update timestamp when meal is modified
-- =====================
ALTER TABLE meals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
