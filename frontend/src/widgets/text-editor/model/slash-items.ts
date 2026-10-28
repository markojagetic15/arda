import type { Editor, Range } from '@tiptap/core'
import {
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table,
  type LucideIcon,
} from 'lucide-react'

export interface SlashItem {
  title: string
  description: string
  icon: LucideIcon
  keywords: string
  run: (editor: Editor, range: Range) => void
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Text',
    description: 'Plain paragraph',
    icon: Pilcrow,
    keywords: 'paragraph text p',
    run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section title',
    icon: Heading1,
    keywords: 'h1 title big',
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section title',
    icon: Heading2,
    keywords: 'h2 subtitle',
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section title',
    icon: Heading3,
    keywords: 'h3',
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Bulleted list',
    description: 'Simple bullet points',
    icon: List,
    keywords: 'ul unordered bullet',
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    description: 'Ordered steps',
    icon: ListOrdered,
    keywords: 'ol ordered number',
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'To-do list',
    description: 'Tasks with checkboxes',
    icon: CheckSquare,
    keywords: 'todo task checkbox check',
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Quote',
    description: 'Highlighted quotation',
    icon: Quote,
    keywords: 'blockquote citation',
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code block',
    description: 'Monospaced code',
    icon: Code2,
    keywords: 'code pre snippet',
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Table',
    description: '3 x 3 table with header',
    icon: Table,
    keywords: 'table grid',
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Link to page',
    description: 'Mention another page (or type @)',
    icon: Link2,
    keywords: 'link page mention reference @',
    run: (editor, range) => editor.chain().focus().deleteRange(range).insertContent('@').run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal line',
    icon: Minus,
    keywords: 'hr rule separator line',
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Image',
    description: 'Upload from your computer',
    icon: ImageIcon,
    keywords: 'image picture photo img upload',
    run: (editor, range) => editor.chain().focus().deleteRange(range).pickImages().run(),
  },
]

export function filterSlashItems(query: string): SlashItem[] {
  const needle = query.toLowerCase().trim()
  if (!needle) return SLASH_ITEMS
  return SLASH_ITEMS.filter((item) => `${item.title} ${item.keywords}`.toLowerCase().includes(needle))
}
