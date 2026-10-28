import type { Editor } from '@tiptap/react'
import {
  AlignLeft,
  Baseline,
  Bold,
  CheckSquare,
  Code,
  Highlighter,
  ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Underline,
  Undo2,
  Upload,
} from 'lucide-react'
import { useState } from 'react'

import { FONT_SIZES, FONTS, HIGHLIGHT_COLORS, TEXT_COLORS } from '../model/fonts'
import {
  ALIGNMENTS,
  BLOCK_TYPES,
  currentSize,
  setBlockType,
  stepFontSize,
  useSelectionFormat,
} from '../model/format'
import { ColorGrid, MenuOption, ToolButton, ToolDivider, ToolPopover } from './controls'

const ICON = 'h-4 w-4'

function LinkPanel({ editor, href, close }: { editor: Editor; href: string | null; close: () => void }) {
  const [value, setValue] = useState(href ?? '')
  const apply = () => {
    const url = value.trim()
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: /^[a-z]+:/i.test(url) ? url : `https://${url}` }).run()
    close()
  }
  return (
    <form
      className="flex w-72 flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Paste or type a link"
        className="h-9 rounded-lg border border-border bg-field px-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex justify-end gap-1.5">
        {href ? (
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              close()
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft"
          >
            Remove link
          </button>
        ) : null}
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
          Apply
        </button>
      </div>
    </form>
  )
}

function ImagePanel({ editor, close }: { editor: Editor; close: () => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex w-72 flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().pickImages().run()
          close()
        }}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground"
      >
        <Upload className="h-4 w-4" /> Upload from computer
      </button>
      <p className="text-center text-[11px] text-muted">PNG, JPEG, GIF or WebP up to 10 MB. You can also paste or drop images.</p>
      <form
        className="flex flex-col gap-2 border-t border-border pt-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (value.trim()) editor.chain().focus().setImage({ src: value.trim() }).run()
          close()
        }}
      >
        <p className="text-xs font-medium text-muted">Or embed from a link</p>
        <div className="flex gap-1.5">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://..."
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-field px-2.5 text-sm outline-none focus:border-accent"
          />
          <button type="submit" className="rounded-lg border border-border px-3 text-xs font-semibold hover:bg-default">
            Embed
          </button>
        </div>
      </form>
    </div>
  )
}

function TablePicker({ editor, close }: { editor: Editor; close: () => void }) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 })
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted">
        {hover.rows > 0 ? `${hover.rows} x ${hover.cols} table` : 'Insert table'}
      </p>
      <div className="grid grid-cols-8 gap-1" onMouseLeave={() => setHover({ rows: 0, cols: 0 })}>
        {Array.from({ length: 64 }, (_, index) => {
          const row = Math.floor(index / 8) + 1
          const col = (index % 8) + 1
          const on = row <= hover.rows && col <= hover.cols
          return (
            <button
              key={index}
              type="button"
              aria-label={`${row} by ${col} table`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHover({ rows: row, cols: col })}
              onClick={() => {
                editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run()
                close()
              }}
              className={`h-4 w-4 rounded-[3px] border ${on ? 'border-accent bg-accent-soft' : 'border-border'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const format = useSelectionFormat(editor)
  if (!format) return null

  const run = (fn: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => fn(editor.chain().focus()).run()
  const blockLabel = BLOCK_TYPES.find(({ id }) => id === format.block)?.label ?? 'Normal text'
  const fontLabel = FONTS.find(({ value }) => value === format.fontFamily)?.label.replace(/ \(.*\)/, '') ?? 'Custom'
  const AlignIcon = ALIGNMENTS.find(({ id }) => id === format.align)?.icon ?? AlignLeft

  return (
    <div className="scroll-thin flex items-center gap-0.5 overflow-x-auto px-3 py-1.5" role="toolbar" aria-label="Formatting">
      <ToolButton label="Undo (Ctrl+Z)" disabled={!format.canUndo} onClick={() => run((c) => c.undo())}>
        <Undo2 className={ICON} />
      </ToolButton>
      <ToolButton label="Redo (Ctrl+Shift+Z)" disabled={!format.canRedo} onClick={() => run((c) => c.redo())}>
        <Redo2 className={ICON} />
      </ToolButton>
      <ToolDivider />

      <ToolPopover label="Text style" trigger={<span className="w-24 truncate text-left">{blockLabel}</span>} caret>
        {(close) => (
          <div className="flex w-52 flex-col">
            {BLOCK_TYPES.map(({ id, label }) => (
              <MenuOption
                key={id}
                selected={format.block === id}
                onSelect={() => {
                  setBlockType(editor, id)
                  close()
                }}
              >
                <span
                  className={
                    id === 'h1'
                      ? 'font-display text-xl font-bold'
                      : id === 'h2'
                        ? 'font-display text-lg font-bold'
                        : id === 'h3'
                          ? 'font-display text-base font-bold'
                          : id === 'h4'
                            ? 'font-display text-sm font-bold'
                            : id === 'codeBlock'
                              ? 'font-mono text-xs'
                              : id === 'blockquote'
                                ? 'italic'
                                : ''
                  }
                >
                  {label}
                </span>
              </MenuOption>
            ))}
          </div>
        )}
      </ToolPopover>

      <ToolPopover label="Font" trigger={<span className="w-24 truncate text-left">{fontLabel}</span>} caret>
        {(close) => (
          <div className="scroll-thin flex max-h-80 w-60 flex-col overflow-y-auto">
            {FONTS.map(({ label, value }) => (
              <MenuOption
                key={label}
                selected={format.fontFamily === value}
                onSelect={() => {
                  if (value) editor.chain().focus().setFontFamily(value).run()
                  else editor.chain().focus().unsetFontFamily().run()
                  close()
                }}
              >
                <span style={{ fontFamily: value ?? undefined }}>{label}</span>
              </MenuOption>
            ))}
          </div>
        )}
      </ToolPopover>

      <div className="flex shrink-0 items-center">
        <ToolButton label="Smaller text" onClick={() => stepFontSize(editor, format.fontSize, -1)}>
          <Minus className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolPopover
          label="Font size"
          trigger={<span className="w-7 text-center tabular-nums">{currentSize(format.fontSize)}</span>}
          triggerClassName="border border-border"
        >
          {(close) => (
            <div className="scroll-thin flex max-h-72 w-24 flex-col overflow-y-auto">
              <MenuOption
                selected={!format.fontSize}
                onSelect={() => {
                  editor.chain().focus().unsetFontSize().run()
                  close()
                }}
              >
                Default
              </MenuOption>
              {FONT_SIZES.map((size) => (
                <MenuOption
                  key={size}
                  selected={format.fontSize === `${size}px`}
                  onSelect={() => {
                    editor.chain().focus().setFontSize(`${size}px`).run()
                    close()
                  }}
                >
                  {size}
                </MenuOption>
              ))}
            </div>
          )}
        </ToolPopover>
        <ToolButton label="Bigger text" onClick={() => stepFontSize(editor, format.fontSize, 1)}>
          <Plus className="h-3.5 w-3.5" />
        </ToolButton>
      </div>
      <ToolDivider />

      <ToolButton label="Bold (Ctrl+B)" active={format.bold} onClick={() => run((c) => c.toggleBold())}>
        <Bold className={ICON} />
      </ToolButton>
      <ToolButton label="Italic (Ctrl+I)" active={format.italic} onClick={() => run((c) => c.toggleItalic())}>
        <Italic className={ICON} />
      </ToolButton>
      <ToolButton label="Underline (Ctrl+U)" active={format.underline} onClick={() => run((c) => c.toggleUnderline())}>
        <Underline className={ICON} />
      </ToolButton>
      <ToolButton label="Strikethrough" active={format.strike} onClick={() => run((c) => c.toggleStrike())}>
        <Strikethrough className={ICON} />
      </ToolButton>
      <ToolButton label="Inline code" active={format.code} onClick={() => run((c) => c.toggleCode())}>
        <Code className={ICON} />
      </ToolButton>
      <ToolButton label="Subscript" active={format.subscript} onClick={() => run((c) => c.toggleSubscript())}>
        <Subscript className={ICON} />
      </ToolButton>
      <ToolButton label="Superscript" active={format.superscript} onClick={() => run((c) => c.toggleSuperscript())}>
        <Superscript className={ICON} />
      </ToolButton>

      <ToolPopover
        label="Text color"
        trigger={
          <span className="flex flex-col items-center">
            <Baseline className="h-4 w-4" />
            <span className="-mt-0.5 h-1 w-4 rounded-full" style={{ backgroundColor: format.color ?? 'currentColor' }} />
          </span>
        }
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
      <ToolPopover
        label="Highlight"
        active={Boolean(format.highlight)}
        trigger={
          <span className="flex flex-col items-center">
            <Highlighter className="h-4 w-4" />
            <span className="-mt-0.5 h-1 w-4 rounded-full" style={{ backgroundColor: format.highlight ?? 'transparent' }} />
          </span>
        }
      >
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
      <ToolPopover label="Link (Ctrl+K)" active={Boolean(format.link)} trigger={<Link2 className={ICON} />}>
        {(close) => <LinkPanel editor={editor} href={format.link} close={close} />}
      </ToolPopover>
      <ToolDivider />

      <ToolPopover label="Alignment" trigger={<AlignIcon className={ICON} />} caret>
        {(close) => (
          <div className="flex gap-0.5">
            {ALIGNMENTS.map(({ id, label, icon: Icon }) => (
              <ToolButton
                key={id}
                label={label}
                active={format.align === id}
                onClick={() => {
                  editor.chain().focus().setTextAlign(id).run()
                  close()
                }}
              >
                <Icon className={ICON} />
              </ToolButton>
            ))}
          </div>
        )}
      </ToolPopover>
      <ToolButton label="Bulleted list" active={format.bulletList} onClick={() => run((c) => c.toggleBulletList())}>
        <List className={ICON} />
      </ToolButton>
      <ToolButton label="Numbered list" active={format.orderedList} onClick={() => run((c) => c.toggleOrderedList())}>
        <ListOrdered className={ICON} />
      </ToolButton>
      <ToolButton label="To-do list" active={format.taskList} onClick={() => run((c) => c.toggleTaskList())}>
        <CheckSquare className={ICON} />
      </ToolButton>
      <ToolButton
        label="Decrease indent"
        disabled={!format.inList}
        onClick={() => run((c) => (format.taskList ? c.liftListItem('taskItem') : c.liftListItem('listItem')))}
      >
        <IndentDecrease className={ICON} />
      </ToolButton>
      <ToolButton
        label="Increase indent"
        disabled={!format.inList}
        onClick={() => run((c) => (format.taskList ? c.sinkListItem('taskItem') : c.sinkListItem('listItem')))}
      >
        <IndentIncrease className={ICON} />
      </ToolButton>
      <ToolButton label="Quote" active={format.block === 'blockquote'} onClick={() => run((c) => c.toggleBlockquote())}>
        <Quote className={ICON} />
      </ToolButton>
      <ToolDivider />

      <ToolPopover label="Insert table" active={format.inTable} trigger={<Table className={ICON} />}>
        {(close) => <TablePicker editor={editor} close={close} />}
      </ToolPopover>
      <ToolPopover label="Insert image" trigger={<ImageIcon className={ICON} />}>
        {(close) => <ImagePanel editor={editor} close={close} />}
      </ToolPopover>
      <ToolButton label="Divider" onClick={() => run((c) => c.setHorizontalRule())}>
        <Minus className={ICON} />
      </ToolButton>
      <ToolDivider />
      <ToolButton label="Clear formatting" onClick={() => run((c) => c.unsetAllMarks().clearNodes())}>
        <RemoveFormatting className={ICON} />
      </ToolButton>
    </div>
  )
}
