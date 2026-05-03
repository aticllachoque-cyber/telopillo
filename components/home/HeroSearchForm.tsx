'use client'

import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const EMPTY_SEARCH_MESSAGE = 'Escribí un término para buscar.'

/**
 * Hero GET form to /buscar. Disables built-in HTML5 validation (noValidate) and
 * validates on submit so the tooltip always uses Spanish via setCustomValidity +
 * reportValidity — avoids browsers showing "Please fill out this field" in English.
 */
export function HeroSearchForm() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    const el = form.querySelector<HTMLInputElement>('input[name="q"]')
    if (!el) return
    const q = el.value.trim()
    if (q.length === 0) {
      e.preventDefault()
      el.setCustomValidity(EMPTY_SEARCH_MESSAGE)
      el.reportValidity()
      return
    }
    if (el.value !== q) {
      el.value = q
    }
  }

  return (
    <form
      action="/buscar"
      method="GET"
      className="mx-auto mt-8 max-w-2xl"
      role="search"
      aria-label="Buscar productos"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            placeholder="Ej: iPhone, moto, muebles..."
            className="h-12 min-h-[44px] pl-12 text-base touch-manipulation"
            aria-label="Término de búsqueda"
            aria-required="true"
            autoComplete="off"
            maxLength={200}
            onInput={(e) => {
              e.currentTarget.setCustomValidity('')
            }}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 min-h-[44px] px-8 touch-manipulation sm:shrink-0"
        >
          Buscar
        </Button>
      </div>
    </form>
  )
}
