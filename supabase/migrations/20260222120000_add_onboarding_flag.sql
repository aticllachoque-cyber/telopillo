-- Add onboarding_completed flag to profiles
-- Used to show the welcome interstitial only on the user's first session

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
