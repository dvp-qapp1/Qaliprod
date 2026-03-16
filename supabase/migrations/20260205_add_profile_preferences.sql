-- Add user preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'es' CHECK (language_preference IN ('es', 'en')),
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));

COMMENT ON COLUMN profiles.language_preference IS 'Preferred application language (es, en)';
COMMENT ON COLUMN profiles.theme_preference IS 'Preferred UI theme (light, dark)';
