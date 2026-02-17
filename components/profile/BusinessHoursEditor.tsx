'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BUSINESS_DAYS } from '@/lib/validations/business-profile'

/**
 * Business hours stored as JSONB:
 * { "lun": "09:00-18:00", "mar": "09:00-18:00", "sab": "closed" }
 * Keys not present means closed for that day.
 */
type BusinessHours = Record<string, string>

interface DayHours {
  open: boolean
  start: string
  end: string
}

function parseHours(value: string | undefined): DayHours {
  if (!value || value === 'closed') {
    return { open: false, start: '09:00', end: '18:00' }
  }
  const parts = value.split('-')
  return {
    open: true,
    start: parts[0] || '09:00',
    end: parts[1] || '18:00',
  }
}

function serializeHours(hours: Record<string, DayHours>): BusinessHours {
  const result: BusinessHours = {}
  for (const [key, val] of Object.entries(hours)) {
    if (val.open) {
      result[key] = `${val.start}-${val.end}`
    }
  }
  return result
}

interface BusinessHoursEditorProps {
  value: BusinessHours | null | undefined
  onChange: (hours: BusinessHours) => void
  disabled?: boolean
}

export function BusinessHoursEditor({
  value,
  onChange,
  disabled = false,
}: BusinessHoursEditorProps) {
  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const initial: Record<string, DayHours> = {}
    for (const day of BUSINESS_DAYS) {
      initial[day.key] = parseHours(value?.[day.key])
    }
    return initial
  })

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onChange(serializeHours(hours))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours])

  const updateDay = useCallback((key: string, update: Partial<DayHours>) => {
    setHours((prev) => {
      const current = prev[key] ?? { open: false, start: '09:00', end: '18:00' }
      return {
        ...prev,
        [key]: { ...current, ...update },
      }
    })
  }, [])

  const setAllOpen = () => {
    const next: Record<string, DayHours> = {}
    for (const day of BUSINESS_DAYS) {
      next[day.key] = { open: true, start: '09:00', end: '18:00' }
    }
    setHours(next)
  }

  const setWeekdays = () => {
    const next: Record<string, DayHours> = {}
    const weekdays = ['lun', 'mar', 'mie', 'jue', 'vie']
    for (const day of BUSINESS_DAYS) {
      if (weekdays.includes(day.key)) {
        next[day.key] = { open: true, start: '09:00', end: '18:00' }
      } else {
        next[day.key] = { open: false, start: '09:00', end: '18:00' }
      }
    }
    setHours(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Horario de Atención</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            onClick={setWeekdays}
            disabled={disabled}
          >
            Lun-Vie
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            onClick={setAllOpen}
            disabled={disabled}
          >
            Todos
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {BUSINESS_DAYS.map((day) => {
          const dayHours = hours[day.key] ?? { open: false, start: '09:00', end: '18:00' }
          return (
            <div
              key={day.key}
              className={cn(
                'flex items-center gap-3 rounded-md border p-2 transition-colors',
                dayHours.open ? 'border-border bg-background' : 'border-transparent bg-muted/30'
              )}
            >
              {/* Day toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={dayHours.open}
                aria-label={`${day.label}: ${dayHours.open ? 'abierto' : 'cerrado'}`}
                disabled={disabled}
                onClick={() => updateDay(day.key, { open: !dayHours.open })}
                className={cn(
                  'flex h-11 w-16 shrink-0 items-center justify-center rounded text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  dayHours.open
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground/70 hover:bg-muted/80'
                )}
              >
                {day.label.slice(0, 3)}
              </button>

              {/* Time pickers */}
              {dayHours.open ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={dayHours.start}
                    onChange={(e) => updateDay(day.key, { start: e.target.value })}
                    disabled={disabled}
                    aria-label={`${day.label} hora de apertura`}
                    className="h-11 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <input
                    type="time"
                    value={dayHours.end}
                    onChange={(e) => updateDay(day.key, { end: e.target.value })}
                    disabled={disabled}
                    aria-label={`${day.label} hora de cierre`}
                    className="h-11 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  />
                </div>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground">Cerrado</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
