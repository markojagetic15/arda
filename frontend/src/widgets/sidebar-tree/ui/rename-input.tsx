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
      className="min-w-0 flex-1 rounded border border-current/30 bg-transparent px-1 py-0.5 text-sm outline-none"
    />
  )
}
