# Demo Plan

## Goal

Build repeatable product demos from Telopillo's core user flows using Playwright-generated video as the source material and AI-assisted editing/voiceover as a second step.

The priority is demos that communicate real product value, not synthetic marketing clips detached from the actual product.

## Principles

- Demos must come from real product flows.
- Each demo must be reproducible with stable test data.
- Playwright is the source of truth for video capture.
- AI is used for editing, captions, and voiceover, not for faking product behavior.
- Production-facing flows take priority over local-only polish.

## Priority Flows

### P0

1. Publish a demand post to receive offers
2. Publish a product for sale
3. Search and contact a seller

### P1

1. Share seller profile
2. Create business profile
3. Login and onboarding

## Demo 01: Publish Demand Post

### Why this is first

This is one of Telopillo's clearest differentiators. It shows that users can publish what they need and let sellers respond with offers, which is stronger than a normal classifieds-only flow.

### Core message

"If you can't find the product, you can publish what you need and receive offers from sellers."

### Target duration

- Short version: 30-45 seconds
- Extended version: 60-90 seconds

### Flow

1. Authenticated buyer opens `/busco/publicar`
2. User fills title, description, category, budget or price range, and location
3. User submits the demand post
4. Success state is shown
5. Resulting post is visible in detail or list view

### Visual checkpoints

1. Publish demand page loaded
2. Form partially filled
3. Form completed
4. Submit action
5. Success feedback
6. Published demand visible

### Voiceover structure

Suggested segmentation for TTS generation:

1. `01_intro`
2. `02_fill_form`
3. `03_publish`
4. `04_result`
5. `05_close`

## Demo System Architecture

### Source of truth

Playwright test flows generate:

- video
- screenshots
- stable checkpoints

### Post-processing layer

AI-assisted editing tools are used for:

- captions
- silence trimming
- pacing
- voiceover
- short-form and long-form exports

Recommended workflow:

1. Playwright records the base flow
2. Video is exported to demo output
3. Voiceover is generated in segments
4. Final edit is done in Descript

## Repo Structure

```text
Documentation/
  DEMO_PLAN.md

demos/
  flows/
  manifests/
  scripts/
  voiceover/
  output/

tests/
  demo/

scripts/
  seed-demo-data.sql
```

## Planned Files

### For the first demo

- `demos/flows/demo-demand-publish.md`
- `demos/manifests/demo-demand-publish.json`
- `demos/voiceover/demo-demand-publish.txt`
- `tests/demo/demo-demand-publish.spec.ts`
- `demos/scripts/run-demo-demand-publish.sh`

### Supporting config

- `playwright.demo.config.ts`

## Manifest Contract

Each demo manifest should define:

- demo id
- title
- audience
- start route
- required user
- required seed data
- expected output paths
- checkpoints
- voiceover segment list

## Script Contract

Each demo runner script should:

1. Verify the app is running
2. Verify Supabase/test data is ready
3. Run the Playwright demo spec
4. Save the generated video in `demos/output/`
5. Save screenshots in a demo-specific folder
6. Print final artifact paths

## Data Requirements

Demos must use stable seeded data.

We should avoid:

- relying on random local dev state
- manually created accounts
- dynamic content that changes daily

We should prefer:

- dedicated demo users
- dedicated demo products
- dedicated demo demand posts
- fixed locations and categories

## Recording Rules

- fixed viewport for desktop demo
- optional second mobile-specific version later
- avoid flaky waits
- keep flow concise
- prefer visually clean seed data
- avoid debug overlays and incidental errors

## Quality Checklist

A demo is ready only if:

- it runs without manual intervention
- the video is reproducible
- the flow reflects real product behavior
- the UI state is clean and understandable
- the result state is visible
- the voiceover can be generated scene by scene

## Execution Order

### Phase 1

1. Create `playwright.demo.config.ts`
2. Create demo folder structure
3. Implement `demo-demand-publish`
4. Generate first reusable video artifacts

### Phase 2

1. Implement `demo-product-publish`
2. Implement `demo-search-contact`
3. Add shared script helpers

### Phase 3

1. Add voiceover scripts by scene
2. Add short and long variants
3. Add optional mobile demo versions

## Immediate Next Step

Implement the first complete pipeline for:

`demo-demand-publish`

That should be the reference pattern for every later demo.
