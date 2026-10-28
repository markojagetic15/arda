import type { SuggestionProps } from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { NodeGlyph, type HierarchyNode } from '@/entities/hierarchy-node'

import type { SuggestionMenuHandle } from '../model/suggestion-popup'

export const PageMentionMenu = forwardRef<SuggestionMenuHandle, SuggestionProps<HierarchyNode, HierarchyNode>>(
  function PageMentionMenu({ items, command }, ref) {
    const [selected, setSelected] = useState(0)
    const [lastItems, setLastItems] = useState(items)
    if (items !== lastItems) {
      setLastItems(items)
      setSelected(0)
    }

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
          if (items[selected]) command(items[selected])
          return true
        }
        return false
      },
    }))

    useEffect(() => {
      document.querySelector(`[data-mention-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
    }, [selected])

    return (
      <div className="app-shadow-lg scroll-thin max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-overlay p-1.5 animate-fade-in">
        <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Link to page</p>
        {items.length === 0 ? (
          <p className="px-2.5 py-2 text-sm text-muted">No matching pages</p>
        ) : (
          items.map((page, index) => (
            <button
              key={page.id}
              type="button"
              data-mention-index={index}
              onMouseEnter={() => setSelected(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                command(page)
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm ${
                index === selected ? 'bg-accent-soft' : ''
              }`}
            >
              <NodeGlyph node={page} />
              <span className="truncate font-medium">{page.label}</span>
            </button>
          ))
        )}
      </div>
    )
  },
)
