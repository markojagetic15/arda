import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import type { SlashItem } from '../model/slash-items'
import type { SuggestionMenuHandle } from '../model/suggestion-popup'

interface SlashMenuProps {
  items: SlashItem[]
  command: (item: SlashItem) => void
}

export const SlashMenu = forwardRef<SuggestionMenuHandle, SlashMenuProps>(function SlashMenu({ items, command }, ref) {
  const [selected, setSelected] = useState(0)

  useEffect(() => setSelected(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === 'ArrowDown') {
        setSelected((index) => (index + 1) % Math.max(items.length, 1))
        return true
      }
      if (event.key === 'ArrowUp') {
        setSelected((index) => (index - 1 + items.length) % Math.max(items.length, 1))
        return true
      }
      if (event.key === 'Enter') {
        const item = items[selected]
        if (item) command(item)
        return true
      }
      return false
    },
  }))

  useEffect(() => {
    document.querySelector(`[data-slash-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div className="app-shadow-lg scroll-thin max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-overlay p-1.5 animate-fade-in">
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted">No matching blocks</p>
      ) : (
        <>
          <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Blocks</p>
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                type="button"
                data-slash-index={index}
                onMouseEnter={() => setSelected(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  command(item)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                  index === selected ? 'bg-accent-soft' : ''
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="block text-xs text-muted">{item.description}</span>
                </span>
              </button>
            )
          })}
        </>
      )}
    </div>
  )
})
