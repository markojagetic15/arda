import { useState } from 'react'

interface AddColumnFormProps {
  onCreate: (title: string) => void
}

export function AddColumnForm({ onCreate }: AddColumnFormProps) {
  const [title, setTitle] = useState('')

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setTitle('')
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="w-72 shrink-0"
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={submit}
        placeholder="+ Add column"
        aria-label="New column title"
        className="w-full rounded-lg border border-dashed border-current/20 bg-transparent px-3 py-2.5 text-sm outline-none hover:border-current/40 focus:border-current/50"
      />
    </form>
  )
}
