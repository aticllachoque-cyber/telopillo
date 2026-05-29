-- =============================================================================
-- TELO-001: Move webhook secrets out of publicly-readable app_config
-- =============================================================================
-- app_config had SELECT USING (true) for anon/authenticated, exposing
-- service_role_key and supabase_url. Secrets now live in app_secrets with no
-- anon/authenticated access. app_config is limited to public feature flags.
--
-- After deploy: rotate the Supabase service_role key if it was ever stored in
-- app_config, then update app_secrets via Dashboard/SQL (service_role only):
--   UPDATE public.app_secrets SET value = '...' WHERE key = 'service_role_key';
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.app_secrets IS
  'Server-only secrets for SECURITY DEFINER triggers (not exposed to anon/auth).';

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.app_secrets FROM PUBLIC;
REVOKE ALL ON public.app_secrets FROM anon;
REVOKE ALL ON public.app_secrets FROM authenticated;
GRANT ALL ON public.app_secrets TO service_role;

-- Migrate existing secret rows from app_config (if present)
INSERT INTO public.app_secrets (key, value, updated_at)
SELECT key, value, updated_at
FROM public.app_config
WHERE key IN ('supabase_url', 'service_role_key')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;

DELETE FROM public.app_config
WHERE key IN ('supabase_url', 'service_role_key');

-- Restrict public reads on app_config to non-secret keys only
DROP POLICY IF EXISTS "app_config_select_policy" ON public.app_config;

CREATE POLICY "app_config_select_policy"
  ON public.app_config
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'semantic_search_enabled'
    )
  );

-- -----------------------------------------------------------------------------
-- Embedding webhook triggers: read secrets from app_secrets
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
  SELECT value INTO v_supabase_url FROM public.app_secrets WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_secrets WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_supabase_url = '' OR
     v_service_key IS NULL OR v_service_key = '' THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION public.trigger_demand_post_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_embedding_text TEXT;
BEGIN
  SELECT value INTO v_supabase_url FROM public.app_secrets WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_secrets WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_supabase_url = '' OR
     v_service_key IS NULL OR v_service_key = '' THEN
    RETURN NEW;
  END IF;

  v_embedding_text := 'Busco: ' || NEW.title
    || '. ' || NEW.description
    || '. Categoría: ' || NEW.category
    || CASE WHEN NEW.subcategory IS NOT NULL AND NEW.subcategory != ''
         THEN ', ' || NEW.subcategory ELSE '' END;

  PERFORM net.http_post(
    url := rtrim(v_supabase_url, '/') || '/functions/v1/generate-embedding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'type', 'DEMAND',
      'record', jsonb_build_object('id', NEW.id, 'text', v_embedding_text)
    )
  );

  RETURN NEW;
END;
$$;
