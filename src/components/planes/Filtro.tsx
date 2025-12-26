'use client'

import { CheckIcon, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type Option = { value: string; label: string }

type Props = {
  options: Array<Option>
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}

const Filtro: React.FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  className,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false)

  const label = value
    ? (options.find((o) => o.value === value)?.label ?? placeholder)
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          aria-label={ariaLabel ?? 'Filtro combobox'}
        >
          {label}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Buscar…" className="h-9" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                  }}
                >
                  {opt.label}
                  <CheckIcon
                    className={cn(
                      'ml-auto',
                      value === opt.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default Filtro
