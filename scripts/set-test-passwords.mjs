#!/usr/bin/env node
/**
 * Set standard test password for local Supabase test users via Auth Admin API.
 * Use this when running Supabase locally (Docker) so GoTrue accepts the password.
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local)
 *   - Supabase running (e.g. npx supabase start)
 *
 * Usage:
 *   node scripts/set-test-passwords.mjs
 *
 * Standard password: TestPassword123 (see tests/playwright-cli/README.md)
 *
 * If you see "Database error finding/loading user", GoTrue may not have a working
 * DB connection or the auth schema may differ. Set passwords manually in
 * Supabase Studio (http://127.0.0.1:54323) → Auth → Users.
 */

import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const STANDARD_TEST_PASSWORD = 'TestPassword123'

// Emails to set password for (local test accounts)
const TEST_USER_EMAILS = ['seller1@test.com', 'seller2@test.com']

/**
 * Fallback: get user ids when listUsers fails (e.g. "Database error finding users").
 * Tries psql to 127.0.0.1:54322; if that fails (e.g. psql not in PATH or socket used),
 * uses known seed IDs for seller1/seller2 so updateUserById can still run.
 */
const FALLBACK_IDS = [
  { id: 'a0000000-0000-0000-0000-000000000001', email: 'seller1@test.com' },
  { id: 'a0000000-0000-0000-0000-000000000002', email: 'seller2@test.com' },
]

function getUserIdEmailPairsFromDb() {
  const emails = TEST_USER_EMAILS.map((e) => `'${e.replace(/'/g, "''")}'`).join(',')
  const sql = `SELECT id, email FROM auth.users WHERE email IN (${emails})`
  try {
    const conn = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    const out = execSync('psql', ['-d', conn, '-t', '-A', '-F,', '-c', sql], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      env: { PATH: process.env.PATH },
    })
    const pairs = []
    for (const line of out.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const [id, email] = trimmed.split(',')
      if (id && email) pairs.push({ id: id.trim(), email: email.trim() })
    }
    return pairs
  } catch (e) {
    return FALLBACK_IDS.filter((u) => TEST_USER_EMAILS.includes(u.email))
  }
}

function loadEnvLocal() {
  const path = new URL('../.env.local', import.meta.url)
  if (!existsSync(path)) {
    console.error('Missing .env.local. Create it with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local).')
    process.exit(1)
  }
  const content = readFileSync(path, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const value = m[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (e.g. from npx supabase status).')
  process.exit(1)
}

console.log('Using Supabase URL:', url.replace(/\/$/, ''))

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

async function main() {
  let toUpdate = []

  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (!listError && users?.length) {
    toUpdate = TEST_USER_EMAILS.map((email) => users.find((u) => u.email === email)).filter(Boolean)
  }

  if (toUpdate.length === 0 && listError) {
    console.warn('listUsers failed:', listError.message)
    console.warn('Fallback: reading user IDs from DB (psql at 127.0.0.1:54322)...')
    const fromDb = getUserIdEmailPairsFromDb()
    toUpdate = fromDb
    if (fromDb.length === 0) {
      console.error('Could not list users or read from DB. Ensure Supabase is running and test users exist.')
      process.exit(1)
    }
  }

  for (const user of toUpdate) {
    const email = user.email
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: STANDARD_TEST_PASSWORD,
    })
    if (error) {
      console.error(`Failed to set password for ${email}:`, error.message)
      console.error('  If GoTrue shows "Database error", set the password in Supabase Studio: Auth → Users → user → Set password.')
    } else {
      console.log(`OK: ${email} → password set to ${STANDARD_TEST_PASSWORD}`)
    }
  }
}

main()
