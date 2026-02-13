'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEPARTMENTS = [
  'Santa Cruz',
  'La Paz',
  'Cochabamba',
  'Potosí',
  'Chuquisaca',
  'Oruro',
  'Tarija',
  'Beni',
  'Pando',
]

const CITIES_BY_DEPARTMENT: Record<string, string[]> = {
  'Santa Cruz': ['Santa Cruz de la Sierra', 'Montero', 'Warnes', 'Camiri', 'Vallegrande'],
  'La Paz': ['La Paz', 'El Alto', 'Viacha', 'Achocalla', 'Copacabana'],
  Cochabamba: ['Cochabamba', 'Quillacollo', 'Sacaba', 'Colcapirhua', 'Punata'],
  Potosí: ['Potosí', 'Uyuni', 'Villazón', 'Tupiza', 'Llallagua'],
  Chuquisaca: ['Sucre', 'Monteagudo', 'Camargo', 'Tarabuco', 'Yamparáez'],
  Oruro: ['Oruro', 'Huanuni', 'Challapata', 'Caracollo', 'Machacamarca'],
  Tarija: ['Tarija', 'Yacuiba', 'Bermejo', 'Villamontes', 'Entre Ríos'],
  Beni: ['Trinidad', 'Riberalta', 'Guayaramerín', 'Santa Ana', 'San Borja'],
  Pando: ['Cobija', 'Porvenir', 'Puerto Rico', 'Filadelfia', 'Bolpebra'],
}

interface LocationSelectorProps {
  department: string | null
  city: string | null
  onDepartmentChange: (value: string) => void
  onCityChange: (value: string) => void
  disabled?: boolean
  errors?: {
    department?: string
    city?: string
  }
}

export function LocationSelector({
  department,
  city,
  onDepartmentChange,
  onCityChange,
  disabled,
  errors,
}: LocationSelectorProps) {
  const cities = department ? CITIES_BY_DEPARTMENT[department] || [] : []

  const handleDepartmentChange = (value: string) => {
    onDepartmentChange(value)
    // Reset city when department changes
    onCityChange('')
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="department">Departamento *</Label>
        <Select value={department || ''} onValueChange={handleDepartmentChange} disabled={disabled}>
          <SelectTrigger
            id="department"
            className="h-11"
            aria-invalid={!!errors?.department}
            aria-describedby={errors?.department ? 'department-error' : undefined}
          >
            <SelectValue placeholder="Selecciona departamento" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.department && (
          <p id="department-error" className="text-sm text-destructive" role="alert">
            {errors.department}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ciudad *</Label>
        <Select value={city || ''} onValueChange={onCityChange} disabled={disabled || !department}>
          <SelectTrigger
            id="city"
            className="h-11"
            aria-invalid={!!errors?.city}
            aria-describedby={errors?.city ? 'city-error' : undefined}
          >
            <SelectValue placeholder="Selecciona ciudad" />
          </SelectTrigger>
          <SelectContent>
            {cities.length > 0 ? (
              cities.map((cityName) => (
                <SelectItem key={cityName} value={cityName}>
                  {cityName}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                Primero selecciona un departamento
              </div>
            )}
          </SelectContent>
        </Select>
        {errors?.city && (
          <p id="city-error" className="text-sm text-destructive" role="alert">
            {errors.city}
          </p>
        )}
      </div>
    </div>
  )
}
