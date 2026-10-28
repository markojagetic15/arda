import { useEffect, useRef, useState } from 'react'

interface RenameInputProps {
  defaultValue: string
  onCommit: (value: string) => void
  onCancel: () => void
}

export function RenameInput({ defaultValue, onCommit, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const commit = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== defaultValue) {
      onCommit(trimmed)
    } else {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      className="ml-1 h-6 min-w-0 flex-1 rounded-md border border-accent bg-field px-1.5 text-sm font-normal text-foreground outline-none"
    />
  )
}
