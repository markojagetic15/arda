import { Plus } from 'lucide-react'
import { useState } from 'react'

interface AddColumnFormProps {
  onCreate: (title: string) => void
}

export function AddColumnForm({ onCreate }: AddColumnFormProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')

  function submit() {
    const trimmed = title.trim()
    if (trimmed) onCreate(trimmed)
    setTitle('')
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-12 w-[288px] shrink-0 items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" /> Add column
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="w-[288px] shrink-0 rounded-2xl bg-surface-secondary/70 p-2"
    >
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={submit}
        onKeyDown={(event) => event.key === 'Escape' && setEditing(false)}
        placeholder="Column name"
        aria-label="New column title"
        className="h-9 w-full rounded-lg border border-accent bg-surface px-3 text-sm outline-none"
      />
    </form>
  )
}
