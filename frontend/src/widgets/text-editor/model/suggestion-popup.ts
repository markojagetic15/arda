import { ReactRenderer } from '@tiptap/react'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type { ComponentType } from 'react'

export interface SuggestionMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

function place(element: HTMLElement, rect: DOMRect | null | undefined) {
  if (!rect) return
  const menuHeight = 330
  const below = rect.bottom + 6
  const top = below + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight - 6) : below
  Object.assign(element.style, {
    position: 'fixed',
    left: `${Math.min(rect.left, window.innerWidth - 310)}px`,
    top: `${top}px`,
    zIndex: '60',
  })
}

/** Mounts a React menu next to the caret for a Tiptap suggestion (slash commands, @ mentions). */
export function suggestionPopup<I>(
  // The menu receives SuggestionProps<I, I> and exposes SuggestionMenuHandle via its ref.
  component: ComponentType<never>,
): SuggestionOptions<I, I>['render'] {
  return () => {
    let renderer: ReactRenderer<SuggestionMenuHandle> | null = null
    const close = () => {
      renderer?.destroy()
      renderer?.element.remove()
      renderer = null
    }
    return {
      onStart: (props) => {
        renderer = new ReactRenderer(component as ComponentType<object>, { props, editor: props.editor })
        document.body.appendChild(renderer.element)
        place(renderer.element as HTMLElement, props.clientRect?.())
      },
      onUpdate: (props) => {
        renderer?.updateProps(props)
        if (renderer) place(renderer.element as HTMLElement, props.clientRect?.())
      },
      onKeyDown: ({ event }) => {
        if (event.key === 'Escape') {
          close()
          return true
        }
        return renderer?.ref?.onKeyDown(event) ?? false
      },
      onExit: close,
    }
  }
}
