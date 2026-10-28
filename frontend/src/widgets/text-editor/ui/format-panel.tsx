import type { Editor } from '@tiptap/react'
import {
  Columns3,
  Combine,
  RotateCcw,
  Rows3,
  SplitSquareHorizontal,
  TableProperties,
  Trash2,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { FONT_WEIGHTS, FONTS, HIGHLIGHT_COLORS, LINE_HEIGHTS, TEXT_COLORS } from '../model/fonts'
import { ColorGrid } from './controls'
import { ALIGNMENTS, BLOCK_TYPES, setBlockType, useSelectionFormat } from '../model/format'

const CASES = [
  { value: null, label: 'Aa', title: 'As typed' },
  { value: 'uppercase', label: 'AA', title: 'Uppercase' },
  { value: 'lowercase', label: 'aa', title: 'Lowercase' },
  { value: 'capitalize', label: 'Ab', title: 'Capitalize' },
] as const

const keepSelection = (event: React.MouseEvent) => event.preventDefault()

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border-b border-border px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h3>
        {action}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function Field({ label, children, onReset }: { label: string; children: ReactNode; onReset?: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        {onReset ? (
          <button
            type="button"
            onMouseDown={keepSelection}
            onClick={onReset}
            title="Reset"
            className="text-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

const SELECT =
  'h-9 w-full cursor-pointer rounded-lg border border-border bg-field px-2.5 text-sm outline-none focus:border-accent'

function Segmented<T extends string | null>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: ReactNode; title: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-border bg-surface-secondary p-0.5">
      {options.map((option) => (
        <button
          key={option.title}
          type="button"
          title={option.title}
          aria-label={option.title}
          aria-pressed={option.value === value}
          onMouseDown={keepSelection}
          onClick={() => onChange(option.value)}
          className={`flex h-7 flex-1 items-center justify-center rounded-md text-xs font-semibold transition ${
            option.value === value ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function TableActions({ editor }: { editor: Editor }) {
  const actions: { label: string; icon: typeof Rows3; run: () => void; danger?: boolean }[] = [
    { label: 'Row above', icon: Rows3, run: () => editor.chain().focus().addRowBefore().run() },
    { label: 'Row below', icon: Rows3, run: () => editor.chain().focus().addRowAfter().run() },
    { label: 'Column left', icon: Columns3, run: () => editor.chain().focus().addColumnBefore().run() },
    { label: 'Column right', icon: Columns3, run: () => editor.chain().focus().addColumnAfter().run() },
    { label: 'Merge cells', icon: Combine, run: () => editor.chain().focus().mergeCells().run() },
    { label: 'Split cell', icon: SplitSquareHorizontal, run: () => editor.chain().focus().splitCell().run() },
    { label: 'Header row', icon: TableProperties, run: () => editor.chain().focus().toggleHeaderRow().run() },
    { label: 'Delete row', icon: Trash2, run: () => editor.chain().focus().deleteRow().run(), danger: true },
    { label: 'Delete column', icon: Trash2, run: () => editor.chain().focus().deleteColumn().run(), danger: true },
    { label: 'Delete table', icon: Trash2, run: () => editor.chain().focus().deleteTable().run(), danger: true },
  ]
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {actions.map(({ label, icon: Icon, run, danger }) => (
        <button
          key={label}
          type="button"
          onMouseDown={keepSelection}
          onClick={run}
          className={`flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium ${
            danger ? 'text-danger hover:bg-danger-soft' : 'hover:bg-default'
          }`}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  )
}

/** Right-hand panel: every style option for the current selection, down to a single letter. */
export function FormatPanel({ editor }: { editor: Editor }) {
  const format = useSelectionFormat(editor)
  if (!format) return null

  const chain = () => editor.chain().focus()
  const size = format.fontSize ? Number.parseFloat(format.fontSize) : 16
  const spacing = format.letterSpacing ? Number.parseFloat(format.letterSpacing) : 0
  const readingMinutes = Math.max(1, Math.round(format.words / 220))

  return (
    <div className="flex flex-col">
      <Section title="Text">
        <Field label="Font" onReset={format.fontFamily ? () => chain().unsetFontFamily().run() : undefined}>
          <select
            className={SELECT}
            value={FONTS.find(({ value }) => value === format.fontFamily)?.label ?? ''}
            onChange={(event) => {
              const value = FONTS.find(({ label }) => label === event.target.value)?.value ?? null
              if (value) chain().setFontFamily(value).run()
              else chain().unsetFontFamily().run()
            }}
          >
            {FONTS.map(({ label }) => (
              <option key={label}>{label}</option>
            ))}
            {!FONTS.some(({ value }) => value === format.fontFamily) ? <option value="">Custom</option> : null}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Size" onReset={format.fontSize ? () => chain().unsetFontSize().run() : undefined}>
            <div className="flex h-9 items-center rounded-lg border border-border bg-field pr-2 focus-within:border-accent">
              <input
                type="number"
                min={6}
                max={200}
                value={size}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (value >= 6 && value <= 200) chain().setFontSize(`${value}px`).run()
                }}
                className="h-full w-full min-w-0 bg-transparent px-2.5 text-sm outline-none"
                aria-label="Font size"
              />
              <span className="text-xs text-muted">px</span>
            </div>
          </Field>
          <Field label="Weight" onReset={format.fontWeight ? () => chain().unsetFontWeight().run() : undefined}>
            <select
              className={SELECT}
              value={format.fontWeight ?? (format.bold ? '700' : '400')}
              onChange={(event) => chain().setFontWeight(event.target.value).run()}
            >
              {FONT_WEIGHTS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Letter case">
          <Segmented
            options={CASES}
            value={(format.textTransform as (typeof CASES)[number]['value']) ?? null}
            onChange={(value) => (value ? chain().setTextTransform(value).run() : chain().unsetTextTransform().run())}
          />
        </Field>

        <Field
          label={`Letter spacing  ${spacing > 0 ? '+' : ''}${spacing}px`}
          onReset={format.letterSpacing ? () => chain().unsetLetterSpacing().run() : undefined}
        >
          <input
            type="range"
            min={-3}
            max={16}
            step={0.5}
            value={spacing}
            onChange={(event) => chain().setLetterSpacing(`${event.target.value}px`).run()}
            className="w-full accent-[var(--accent)]"
            aria-label="Letter spacing"
          />
        </Field>

        <Field label="Line height" onReset={format.lineHeight ? () => chain().unsetLineHeight().run() : undefined}>
          <select
            className={SELECT}
            value={format.lineHeight ?? ''}
            onChange={(event) =>
              event.target.value ? chain().setLineHeight(event.target.value).run() : chain().unsetLineHeight().run()
            }
          >
            <option value="">Default</option>
            {LINE_HEIGHTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Color">
        <Field label="Text">
          <ColorGrid
            colors={TEXT_COLORS}
            value={format.color}
            asText
            clearLabel="Default color"
            onPick={(color) => chain().setColor(color).run()}
            onClear={() => chain().unsetColor().run()}
          />
        </Field>
        <Field label="Highlight">
          <ColorGrid
            colors={HIGHLIGHT_COLORS}
            value={format.highlight}
            clearLabel="No highlight"
            onPick={(color) => chain().setHighlight({ color }).run()}
            onClear={() => chain().unsetHighlight().run()}
          />
        </Field>
      </Section>

      <Section title="Paragraph">
        <Field label="Style">
          <select
            className={SELECT}
            value={format.block}
            onChange={(event) => setBlockType(editor, event.target.value as (typeof BLOCK_TYPES)[number]['id'])}
          >
            {BLOCK_TYPES.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Alignment">
          <Segmented
            options={ALIGNMENTS.map(({ id, label, icon: Icon }) => ({
              value: id,
              title: label,
              label: <Icon className="h-3.5 w-3.5" />,
            }))}
            value={format.align}
            onChange={(value) => chain().setTextAlign(value).run()}
          />
        </Field>
      </Section>

      {format.inTable ? (
        <Section title="Table">
          <TableActions editor={editor} />
        </Section>
      ) : null}

      <Section title="Document">
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Words', format.words],
            ['Characters', format.characters],
            ['Read time', `${readingMinutes} min`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface-secondary px-1 py-2">
              <dd className="text-sm font-semibold tabular-nums">{value}</dd>
              <dt className="text-[10px] text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  )
}
