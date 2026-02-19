# Git Commit Helper

Help me prepare a git commit with proper formatting and validation.

## Commit Format

```
TICKET-ID: Short description of the change
```

**Examples:**
- `MPEE-1234: Add logging context utility for interaction handlers`
- `MPEE-1234: Fix duplicate reflection in code review`
- `MPEE-1234: Refactor slack handlers for better modularity`

## Pre-Commit Checklist

Before committing, verify:

1. **Ruff Check** — Run `hatch run ruff check .` and fix any issues
2. **Ruff Format** — Run `hatch run ruff format .` if needed
3. **Tests** — Ensure relevant tests pass with `hatch run test`
4. **Staged Files** — Review `git status` and `git diff --staged`

## Commit Process

1. Run ruff check (mandatory - never skip)
2. Stage the relevant files
3. Create commit with ticket prefix
4. DO NOT push unless explicitly requested

## Your Task

Given the ticket prefix, please:

1. Show `git status` to see current changes
2. Run `hatch run ruff check .` to validate code
3. Summarize the changes and suggest a commit message
4. Wait for approval before executing `git commit`

---

*What is the ticket prefix for this commit? (e.g., MPEE-1234)*
