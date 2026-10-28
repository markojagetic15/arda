import { useEditorState, type Editor } from '@tiptap/react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, type LucideIcon } from 'lucide-react'

import { FONT_SIZES } from './fonts'

export const BLOCK_TYPES = [
  { id: 'paragraph', label: 'Normal text' },
  { id: 'h1', label: 'Heading 1' },
  { id: 'h2', label: 'Heading 2' },
  { id: 'h3', label: 'Heading 3' },
  { id: 'h4', label: 'Heading 4' },
  { id: 'blockquote', label: 'Quote' },
  { id: 'codeBlock', label: 'Code block' },
] as const

export type BlockTypeId = (typeof BLOCK_TYPES)[number]['id']

export const ALIGNMENTS: { id: 'left' | 'center' | 'right' | 'justify'; label: string; icon: LucideIcon }[] = [
  { id: 'left', label: 'Align left', icon: AlignLeft },
  { id: 'center', label: 'Center', icon: AlignCenter },
  { id: 'right', label: 'Align right', icon: AlignRight },
  { id: 'justify', label: 'Justify', icon: AlignJustify },
]

export function setBlockType(editor: Editor, id: BlockTypeId) {
  const chain = editor.chain().focus()
  if (id === 'paragraph') chain.setParagraph().run()
  else if (id === 'blockquote') chain.setParagraph().toggleBlockquote().run()
  else if (id === 'codeBlock') chain.toggleCodeBlock().run()
  else chain.setHeading({ level: Number(id.slice(1)) as 1 | 2 | 3 | 4 }).run()
}

/** Everything the toolbar and side panel need to know about the current selection. */
export function useSelectionFormat(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const style = e.getAttributes('textStyle')
      const block: BlockTypeId = e.isActive('codeBlock')
        ? 'codeBlock'
        : e.isActive('blockquote')
          ? 'blockquote'
          : ((['h1', 'h2', 'h3', 'h4'] as const).find((id) => e.isActive('heading', { level: Number(id[1]) })) ??
            'paragraph')
      return {
        block,
        fontFamily: (style.fontFamily as string | undefined) ?? null,
        fontSize: (style.fontSize as string | undefined) ?? null,
        fontWeight: (style.fontWeight as string | undefined) ?? null,
        letterSpacing: (style.letterSpacing as string | undefined) ?? null,
        lineHeight: (style.lineHeight as string | undefined) ?? null,
        textTransform: (style.textTransform as string | undefined) ?? null,
        color: (style.color as string | undefined) ?? null,
        highlight: (e.getAttributes('highlight').color as string | undefined) ?? (e.isActive('highlight') ? '#fef08a' : null),
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        code: e.isActive('code'),
        subscript: e.isActive('subscript'),
        superscript: e.isActive('superscript'),
        link: (e.getAttributes('link').href as string | undefined) ?? null,
        align: ALIGNMENTS.find(({ id }) => e.isActive({ textAlign: id }))?.id ?? 'left',
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        taskList: e.isActive('taskList'),
        inList: e.isActive('listItem') || e.isActive('taskItem'),
        inTable: e.isActive('table'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        words: (e.storage.characterCount?.words?.() as number | undefined) ?? 0,
        characters: (e.storage.characterCount?.characters?.() as number | undefined) ?? 0,
      }
    },
  })
}

export type SelectionFormat = NonNullable<ReturnType<typeof useSelectionFormat>>


export function currentSize(fontSize: string | null): number {
  return fontSize ? Number.parseInt(fontSize, 10) || 16 : 16
}

export function stepFontSize(editor: Editor, fontSize: string | null, direction: 1 | -1) {
  const size = currentSize(fontSize)
  const next =
    direction === 1
      ? (FONT_SIZES.find((candidate) => candidate > size) ?? size + 8)
      : ([...FONT_SIZES].reverse().find((candidate) => candidate < size) ?? Math.max(6, size - 1))
  editor.chain().focus().setFontSize(`${next}px`).run()
}
