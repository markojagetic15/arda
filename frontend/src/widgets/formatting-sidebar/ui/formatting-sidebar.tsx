import { NumberField, ToggleButton } from '@heroui/react'
import { useCurrentEditor, useEditorState } from '@tiptap/react'

import { AlignIcon } from './align-icon'

const HEADING_LEVELS = [1, 2, 3] as const
const ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const
const TEXT_COLORS = ['#111827', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#9333ea']

const SECTION_LABEL = 'mb-2 text-xs font-medium tracking-wide uppercase opacity-60'

export function FormattingSidebar() {
  const { editor } = useCurrentEditor()

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null
      const activeEditor = ctx.editor
      return {
        headingLevel: HEADING_LEVELS.find((level) => activeEditor.isActive('heading', { level })) ?? 0,
        align: ALIGNMENTS.find((alignment) => activeEditor.isActive({ textAlign: alignment })) ?? 'left',
        color: (activeEditor.getAttributes('textStyle').color as string | undefined) ?? null,
        fontSize: (activeEditor.getAttributes('textStyle').fontSize as string | undefined) ?? null,
      }
    },
  })

  if (!editor || !state) {
    return <p className="text-sm opacity-60">No active editor.</p>
  }

  const fontSizeValue = state.fontSize ? Number.parseInt(state.fontSize, 10) : 16

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className={SECTION_LABEL}>Heading</h3>
        <div className="flex gap-1">
          <ToggleButton
            aria-label="Paragraph"
            isSelected={state.headingLevel === 0}
            onChange={() => editor.chain().focus().setParagraph().run()}
          >
            P
          </ToggleButton>
          {HEADING_LEVELS.map((level) => (
            <ToggleButton
              key={level}
              aria-label={`Heading ${level}`}
              isSelected={state.headingLevel === level}
              onChange={() => editor.chain().focus().toggleHeading({ level }).run()}
            >
              H{level}
            </ToggleButton>
          ))}
        </div>
      </section>

      <section>
        <h3 className={SECTION_LABEL}>Alignment</h3>
        <div className="flex gap-1">
          {ALIGNMENTS.map((alignment) => (
            <ToggleButton
              key={alignment}
              isIconOnly
              aria-label={`Align ${alignment}`}
              isSelected={state.align === alignment}
              onChange={() => editor.chain().focus().setTextAlign(alignment).run()}
            >
              <AlignIcon align={alignment} className="h-4 w-4" />
            </ToggleButton>
          ))}
        </div>
      </section>

      <section>
        <h3 className={SECTION_LABEL}>Font size</h3>
        <NumberField
          value={fontSizeValue}
          minValue={8}
          maxValue={96}
          step={1}
          onChange={(value) => editor.chain().focus().setFontSize(`${value}px`).run()}
          aria-label="Font size in pixels"
        >
          <NumberField.Group>
            <NumberField.DecrementButton aria-label="Decrease font size">−</NumberField.DecrementButton>
            <NumberField.Input />
            <NumberField.IncrementButton aria-label="Increase font size">+</NumberField.IncrementButton>
          </NumberField.Group>
        </NumberField>
      </section>

      <section>
        <h3 className={SECTION_LABEL}>Text color</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Set text color to ${color}`}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className={`h-6 w-6 rounded-full border-2 ${
                state.color === color ? 'border-current' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            type="button"
            aria-label="Reset text color"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-current/30 text-xs"
          >
            ×
          </button>
        </div>
      </section>
    </div>
  )
}
