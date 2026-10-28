import { useEffect, useRef, useState } from 'react'

import { useHierarchyTree, useRenameNode } from '@/features/hierarchy-tree'

interface DocumentTitleProps {
  pageId: string
  /** Called when Enter is pressed, to move focus into the body. */
  onEnter: () => void
  readOnly?: boolean
}

/** The page's name as a large, editable title above the document body. */
export function DocumentTitle({ pageId, onEnter, readOnly }: DocumentTitleProps) {
  const { data } = useHierarchyTree()
  const renameNode = useRenameNode()
  const label = data?.nodes.find((node) => node.id === pageId)?.label ?? ''
  const [value, setValue] = useState(label)
  const [source, setSource] = useState(label)
  const ref = useRef<HTMLTextAreaElement>(null)

  // Follow renames made elsewhere (sidebar, other people).
  if (label !== source) {
    setSource(label)
    setValue(label)
  }

  useEffect(() => {
    const element = ref.current
    if (!element) return
    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
  }, [value])

  function commit() {
    const next = value.trim()
    if (!next) setValue(label)
    else if (next !== label) renameNode.mutate({ id: pageId, kind: 'page', label: next })
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      placeholder="Untitled"
      aria-label="Page title"
      onChange={(event) => setValue(event.target.value.replace(/\n/g, ''))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
          onEnter()
        }
      }}
      className="font-display mb-6 block w-full resize-none overflow-hidden bg-transparent text-4xl leading-tight font-extrabold outline-none placeholder:text-foreground/25"
    />
  )
}
