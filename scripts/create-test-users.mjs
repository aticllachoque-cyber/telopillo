#!/usr/bin/env node
/**
 * Create test users for each category (Buyer, Seller personal, Seller business)
 * and write their credentials to Documentation/TEST_USERS.md.
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - Supabase running (e.g. npx supabase start)
 *
 * Usage: node scripts/create-test-users.mjs
 *
 * Standard password: TestPassword123 (same as set-test-passwords.mjs)
 */

import { readFileSync, existsSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const STANDARD_PASSWORD = 'TestPassword123'

const USERS_BY_CATEGORY = {
  buyer: [
    { email: 'buyer1@test.com', full_name: 'Comprador Uno' },
    { email: 'buyer2@test.com', full_name: 'Comprador Dos' },
  ],
  seller_personal: [
    { email: 'seller1@test.com', full_name: 'Vendedor Uno' },
    { email: 'seller2@test.com', full_name: 'Vendedor Dos' },
  ],
  seller_business: [
    { email: 'business1@test.com', full_name: 'Ana Negocio', business_name: 'Tienda Electrónica La Paz' },
    { email: 'business2@test.com', full_name: 'Carlos Comercio', business_name: 'Moda Bolivia' },
  ],
}

function loadEnvLocal() {
  const path = new URL('../.env.local', import.meta.url)
  if (!existsSync(path)) {
    console.error('Missing .env.local. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
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
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

function slugFromName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function main() {
  const created = []
  const skipped = []

  for (const [category, users] of Object.entries(USERS_BY_CATEGORY)) {
    for (const u of users) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find((x) => x.email === u.email)
      if (found) {
        skipped.push({ category, ...u })
        console.log(`Skip (exists): ${u.email}`)
        continue
      }

      const { data: user, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: STANDARD_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          ...(u.business_name && { business_name: u.business_name }),
        },
      })

      if (error) {
        console.error(`Failed ${u.email}:`, error.message)
        continue
      }

      const slug = u.business_name ? slugFromName(u.business_name) : null
      created.push({
        category,
        email: u.email,
        full_name: u.full_name,
        business_name: u.business_name ?? null,
        business_slug: slug,
        user_id: user?.user?.id ?? null,
      })
      console.log(`Created: ${u.email} (${category})`)
    }
  }

  const allUsers = [
    ...created,
    ...skipped.map((u) => ({
      ...u,
      business_name: u.business_name ?? null,
      business_slug: u.business_name ? slugFromName(u.business_name) : null,
    })),
  ]
  const md = buildMarkdown(allUsers)
  const outPath = new URL('../Documentation/TEST_USERS.md', import.meta.url)
  writeFileSync(outPath, md, 'utf8')
  console.log(`\nWrote ${outPath.pathname}`)
}

function buildMarkdown(allUsers) {
  const lines = [
    '# Test Users (by category)',
    '',
    'Users for local E2E and Playwright CLI. Created with `node scripts/create-test-users.mjs`.',
    '',
    '**Standard password (all accounts):** `TestPassword123`',
    '',
    '---',
    '',
  ]

  const byCategory = {
    buyer: allUsers.filter((u) => u.category === 'buyer'),
    seller_personal: allUsers.filter((u) => u.category === 'seller_personal'),
    seller_business: allUsers.filter((u) => u.category === 'seller_business'),
  }

  const categoryTitles = {
    buyer: 'Buyer',
    seller_personal: 'Seller (personal)',
    seller_business: 'Seller (business)',
  }

  for (const [cat, list] of Object.entries(byCategory)) {
    if (list.length === 0) continue
    lines.push(`## ${categoryTitles[cat]}`)
    lines.push('')
    const hasBusiness = list.some((u) => u.business_name)
    if (hasBusiness) {
      lines.push('| Email | Full name | Password | Business | Slug |')
      lines.push('|-------|-----------|----------|----------|------|')
      for (const u of list) {
        lines.push(`| \`${u.email}\` | ${u.full_name} | \`TestPassword123\` | ${u.business_name ?? '—'} | ${u.business_slug ?? '—'} |`)
      }
    } else {
      lines.push('| Email | Full name | Password |')
      lines.push('|-------|-----------|----------|')
      for (const u of list) {
        lines.push(`| \`${u.email}\` | ${u.full_name} | \`TestPassword123\` |`)
      }
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('## Set / reset password')
  lines.push('')
  lines.push('To reset passwords for existing users (e.g. seller1, seller2):')
  lines.push('')
  lines.push('```bash')
  lines.push('node scripts/set-test-passwords.mjs')
  lines.push('```')
  lines.push('')
  lines.push('Add more emails in `TEST_USER_EMAILS` in that script if needed.')
  lines.push('')

  return lines.join('\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
