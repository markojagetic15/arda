import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Bold, Code, Highlighter, Italic, Link2, MessageSquarePlus, Strikethrough, Underline } from 'lucide-react'

import { HIGHLIGHT_COLORS, TEXT_COLORS } from '../model/fonts'
import { ColorGrid, ToolButton, ToolDivider, ToolPopover } from './controls'
import { useSelectionFormat } from '../model/format'

interface SelectionBubbleProps {
  editor: Editor
  onComment: () => void
}

const ICON = 'h-4 w-4'

/** Floating quick-format bar over a text selection. */
export function SelectionBubble({ editor, onComment }: SelectionBubbleProps) {
  const format = useSelectionFormat(editor)

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state, editor: e }) => !state.selection.empty && !e.isActive('image') && !e.isActive('codeBlock')}
    >
      {format ? (
        <div className="app-shadow-lg flex items-center gap-0.5 rounded-xl border border-border bg-overlay p-1">
          <ToolButton label="Bold" active={format.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className={ICON} />
          </ToolButton>
          <ToolButton label="Italic" active={format.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className={ICON} />
          </ToolButton>
          <ToolButton
            label="Underline"
            active={format.underline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className={ICON} />
          </ToolButton>
          <ToolButton label="Strikethrough" active={format.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className={ICON} />
          </ToolButton>
          <ToolButton label="Inline code" active={format.code} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className={ICON} />
          </ToolButton>
          <ToolDivider />
          <ToolPopover
            label="Text color"
            trigger={<span className="text-sm font-bold" style={{ color: format.color ?? undefined }}>A</span>}
          >
            {(close) => (
              <ColorGrid
                colors={TEXT_COLORS}
                value={format.color}
                asText
                clearLabel="Default color"
                onPick={(color) => {
                  editor.chain().focus().setColor(color).run()
                  close()
                }}
                onClear={() => {
                  editor.chain().focus().unsetColor().run()
                  close()
                }}
              />
            )}
          </ToolPopover>
          <ToolPopover label="Highlight" active={Boolean(format.highlight)} trigger={<Highlighter className={ICON} />}>
            {(close) => (
              <ColorGrid
                colors={HIGHLIGHT_COLORS}
                value={format.highlight}
                clearLabel="No highlight"
                onPick={(color) => {
                  editor.chain().focus().setHighlight({ color }).run()
                  close()
                }}
                onClear={() => {
                  editor.chain().focus().unsetHighlight().run()
                  close()
                }}
              />
            )}
          </ToolPopover>
          <ToolButton
            label={format.link ? 'Remove link' : 'Add link'}
            active={Boolean(format.link)}
            onClick={() => {
              if (format.link) {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
              }
              const url = window.prompt('Link URL')?.trim()
              if (url) {
                editor
                  .chain()
                  .focus()
                  .setLink({ href: /^[a-z]+:/i.test(url) ? url : `https://${url}` })
                  .run()
              }
            }}
          >
            <Link2 className={ICON} />
          </ToolButton>
          <ToolDivider />
          <ToolButton label="Comment" onClick={onComment} className="gap-1.5 px-2">
            <MessageSquarePlus className={ICON} />
            <span className="text-xs font-medium">Comment</span>
          </ToolButton>
        </div>
      ) : null}
    </BubbleMenu>
  )
}
