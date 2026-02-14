import { createClient } from '@/lib/supabase/server'

/**
 * Feature flag keys stored in app_config table.
 * Primary source: environment variable override.
 * Fallback: database app_config table.
 */
export type FeatureFlag = 'semantic_search_enabled'

const ENV_OVERRIDES: Record<FeatureFlag, string | undefined> = {
  semantic_search_enabled: process.env.SEMANTIC_SEARCH_ENABLED,
}

/**
 * Check if a feature flag is enabled.
 *
 * Priority:
 * 1. Environment variable (SEMANTIC_SEARCH_ENABLED=true)
 * 2. Database app_config table
 * 3. Default: false
 */
export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  // 1. Check env var override first (instant, no DB call)
  const envValue = ENV_OVERRIDES[flag]
  if (envValue !== undefined) {
    return envValue === 'true'
  }

  // 2. Check database
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', flag)
      .single()

    if (error || !data) return false
    return data.value === 'true'
  } catch {
    return false
  }
}

/**
 * Get a feature flag value as string.
 */
export async function getFeatureFlag(flag: FeatureFlag): Promise<string | null> {
  const envValue = ENV_OVERRIDES[flag]
  if (envValue !== undefined) return envValue

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', flag)
      .single()

    if (error || !data) return null
    return data.value
  } catch {
    return null
  }
}
