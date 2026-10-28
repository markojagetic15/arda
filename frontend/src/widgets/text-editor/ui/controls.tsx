import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Keeps the editor's selection when a toolbar control is clicked. */
const keepSelection = (event: React.MouseEvent) => event.preventDefault()

interface ToolButtonProps {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
}

export function ToolButton({ label, onClick, active, disabled, children, className = '' }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={keepSelection}
      onClick={onClick}
      className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm transition-colors disabled:pointer-events-none disabled:opacity-35 ${
        active ? 'bg-accent-soft text-accent' : 'text-foreground/80 hover:bg-default hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function ToolDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
}

interface ToolPopoverProps {
  label: string
  /** Content of the trigger button. */
  trigger: ReactNode
  active?: boolean
  /** Shows a small caret next to the trigger. */
  caret?: boolean
  triggerClassName?: string
  panelClassName?: string
  align?: 'start' | 'end'
  children: (close: () => void) => ReactNode
}

/** A toolbar button that opens a small floating panel; closes on outside click or Escape. */
export function ToolPopover({
  label,
  trigger,
  active,
  caret,
  triggerClassName = '',
  panelClassName = '',
  align = 'start',
  children,
}: ToolPopoverProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={open}
        onMouseDown={keepSelection}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-8 items-center justify-center gap-1 rounded-lg px-1.5 text-sm transition-colors ${
          active || open ? 'bg-accent-soft text-accent' : 'text-foreground/80 hover:bg-default hover:text-foreground'
        } ${triggerClassName}`}
      >
        {trigger}
        {caret ? <ChevronDown className="h-3 w-3 opacity-60" /> : null}
      </button>
      {open ? (
        <div
          className={`app-shadow-lg absolute top-full z-50 mt-1.5 rounded-xl border border-border bg-overlay p-2 animate-fade-in ${
            align === 'end' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

interface MenuOptionProps {
  selected?: boolean
  onSelect: () => void
  children: ReactNode
}

export function MenuOption({ selected, onSelect, children }: MenuOptionProps) {
  return (
    <button
      type="button"
      onMouseDown={keepSelection}
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-default ${
        selected ? 'font-medium text-accent' : ''
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
    </button>
  )
}

interface ColorGridProps {
  colors: string[]
  value: string | null
  onPick: (color: string) => void
  onClear: () => void
  clearLabel: string
  /** Renders each swatch as text (an "A") rather than a solid chip. */
  asText?: boolean
}

export function ColorGrid({ colors, value, onPick, onClear, clearLabel, asText }: ColorGridProps) {
  const normalized = value?.toLowerCase() ?? null
  return (
    <div className="flex w-56 flex-col gap-2">
      <button
        type="button"
        onMouseDown={keepSelection}
        onClick={onClear}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-default"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-border">
          <X className="h-3 w-3 text-muted" />
        </span>
        {clearLabel}
      </button>
      <div className="grid grid-cols-8 gap-1.5 px-1">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            aria-label={`Use color ${color}`}
            onMouseDown={keepSelection}
            onClick={() => onPick(color)}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold ring-offset-2 ring-offset-overlay transition-transform hover:scale-110 ${
              normalized === color ? 'ring-2 ring-accent' : asText ? 'ring-1 ring-border' : ''
            }`}
            style={asText ? { color } : { backgroundColor: color }}
          >
            {asText ? 'A' : null}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-default">
        <input
          type="color"
          value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#5b4cf0'}
          onChange={(event) => onPick(event.target.value)}
          className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        Custom color...
      </label>
    </div>
  )
}
