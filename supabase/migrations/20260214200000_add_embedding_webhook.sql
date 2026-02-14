-- =============================================================================
-- M4 Enhancement: Auto-generate embeddings on product INSERT/UPDATE
-- =============================================================================
-- Uses pg_net to call the generate-embedding Edge Function automatically
-- when a product is created or its text fields are updated.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enable pg_net extension (HTTP client from PostgreSQL)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net;

-- -----------------------------------------------------------------------------
-- 2. Store config for the trigger (uses existing app_config table)
-- -----------------------------------------------------------------------------
INSERT INTO public.app_config (key, value)
VALUES
  ('supabase_url', current_setting('app.settings.supabase_url', true)),
  ('service_role_key', current_setting('app.settings.service_role_key', true))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
WHERE EXCLUDED.value IS NOT NULL AND EXCLUDED.value != '';

-- -----------------------------------------------------------------------------
-- 3. Function: call Edge Function to generate embedding asynchronously
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
    RAISE WARNING 'trigger_generate_embedding: supabase_url or service_role_key not configured in app_config, skipping';
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

COMMENT ON FUNCTION public.trigger_generate_embedding IS 'Async call to generate-embedding Edge Function via pg_net on product INSERT/UPDATE.';

-- -----------------------------------------------------------------------------
-- 4. Trigger: fire on INSERT or UPDATE of text fields
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS products_generate_embedding_trigger ON public.products;

CREATE TRIGGER products_generate_embedding_trigger
  AFTER INSERT OR UPDATE OF title, description, category, subcategory
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_embedding();

COMMENT ON TRIGGER products_generate_embedding_trigger ON public.products IS 'Auto-generate semantic embedding when product text fields change.';
