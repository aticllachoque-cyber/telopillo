-- =============================================================================
-- Fix: Populate app_config with Supabase URL and service key for the
-- embedding trigger, and update the trigger function to read from app_config.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Insert Supabase project config into app_config
--    NOTE: These values must be updated after migration via SQL or Dashboard
--    if app.settings GUCs are not available (typical for Supabase hosted).
-- -----------------------------------------------------------------------------
INSERT INTO public.app_config (key, value)
VALUES ('supabase_url', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_config (key, value)
VALUES ('service_role_key', '')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Recreate trigger function to read from app_config
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_generate_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_payload JSONB;
BEGIN
  -- Read config from app_config table
  SELECT value INTO v_supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_config WHERE key = 'service_role_key';

  -- Skip if config not available
  IF v_supabase_url IS NULL OR v_supabase_url = '' OR
     v_service_key IS NULL OR v_service_key = '' THEN
    RETURN NEW;
  END IF;

  -- Build the webhook payload
  v_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'description', NEW.description,
      'category', NEW.category,
      'subcategory', NEW.subcategory
    )
  );

  -- Fire async HTTP POST to the Edge Function via pg_net
  PERFORM net.http_post(
    url := rtrim(v_supabase_url, '/') || '/functions/v1/generate-embedding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := v_payload
  );

  RETURN NEW;
END;
$$;
