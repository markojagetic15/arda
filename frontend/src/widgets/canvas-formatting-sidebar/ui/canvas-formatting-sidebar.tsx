import { NumberField, ToggleButton } from '@heroui/react'
import {
  DefaultColorStyle,
  DefaultSizeStyle,
  getColorValue,
  track,
  useValue,
  type Editor,
  type TLDefaultColorStyle,
  type TLDefaultSizeStyle,
} from 'tldraw'

const SECTION_LABEL = 'mb-2 text-xs font-medium tracking-wide uppercase opacity-60'
const SIZE_LABELS: Record<TLDefaultSizeStyle, string> = { s: 'S', m: 'M', l: 'L', xl: 'XL' }

interface CanvasFormattingSidebarProps {
  editor: Editor | null
}

export const CanvasFormattingSidebar = track(function CanvasFormattingSidebar({
  editor,
}: CanvasFormattingSidebarProps) {
  const selectedShapes = useValue('selected-shapes', () => editor?.getSelectedShapes() ?? [], [editor])
  const sharedStyles = useValue('shared-styles', () => editor?.getSharedStyles() ?? null, [editor])
  const sharedOpacity = useValue('shared-opacity', () => editor?.getSharedOpacity() ?? null, [editor])

  if (!editor || selectedShapes.length === 0) {
    return <p className="text-sm opacity-60">Select a shape to edit its style.</p>
  }

  const palette = editor.getCurrentTheme().colors[editor.getColorMode()]
  const color = sharedStyles?.get(DefaultColorStyle)
  const size = sharedStyles?.get(DefaultSizeStyle)
  const opacity = sharedOpacity?.type === 'shared' ? sharedOpacity.value : 1
  const canAlign = selectedShapes.length > 1

  const setFill = (value: TLDefaultColorStyle) => editor.setStyleForSelectedShapes(DefaultColorStyle, value)
  const setSize = (value: TLDefaultSizeStyle) => editor.setStyleForSelectedShapes(DefaultSizeStyle, value)
  const setOpacity = (value: number) => editor.setOpacityForSelectedShapes(value)

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className={SECTION_LABEL}>Fill color</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {DefaultColorStyle.values.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={`Set fill color to ${name}`}
              onClick={() => setFill(name)}
              className={`h-6 w-6 rounded-full border-2 ${
                color?.type === 'shared' && color.value === name ? 'border-current' : 'border-transparent'
              }`}
              style={{ backgroundColor: getColorValue(palette, name, 'solid') }}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className={SECTION_LABEL}>Stroke width</h3>
        <div className="flex gap-1">
          {DefaultSizeStyle.values.map((value) => (
            <ToggleButton
              key={value}
              aria-label={`Stroke width ${SIZE_LABELS[value]}`}
              isSelected={size?.type === 'shared' && size.value === value}
              onChange={() => setSize(value)}
            >
              {SIZE_LABELS[value]}
            </ToggleButton>
          ))}
        </div>
      </section>

      <section>
        <h3 className={SECTION_LABEL}>Opacity</h3>
        <NumberField
          value={Math.round(opacity * 100)}
          minValue={10}
          maxValue={100}
          step={10}
          onChange={(value) => setOpacity(value / 100)}
          aria-label="Opacity percentage"
        >
          <NumberField.Group>
            <NumberField.DecrementButton aria-label="Decrease opacity">−</NumberField.DecrementButton>
            <NumberField.Input />
            <NumberField.IncrementButton aria-label="Increase opacity">+</NumberField.IncrementButton>
          </NumberField.Group>
        </NumberField>
      </section>

      <section>
        <h3 className={SECTION_LABEL}>Align</h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!canAlign}
              onClick={() => editor.alignShapes(editor.getSelectedShapeIds(), 'left')}
              className="flex-1 rounded border border-current/20 px-2 py-1 text-xs disabled:opacity-40"
            >
              Left
            </button>
            <button
              type="button"
              disabled={!canAlign}
              onClick={() => editor.alignShapes(editor.getSelectedShapeIds(), 'center-horizontal')}
              className="flex-1 rounded border border-current/20 px-2 py-1 text-xs disabled:opacity-40"
            >
              Center
            </button>
            <button
              type="button"
              disabled={!canAlign}
              onClick={() => editor.alignShapes(editor.getSelectedShapeIds(), 'right')}
              className="flex-1 rounded border border-current/20 px-2 py-1 text-xs disabled:opacity-40"
            >
              Right
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!canAlign}
              onClick={() => editor.alignShapes(editor.getSelectedShapeIds(), 'top')}
              className="flex-1 rounded border border-current/20 px-2 py-1 text-xs disabled:opacity-40"
            >
              Top
            </button>
            <button
              type="button"
              disabled={!canAlign}
              onClick={() => editor.alignShapes(editor.getSelectedShapeIds(), 'center-vertical')}
              className="flex-1 rounded border border-current/20 px-2 py-1 text-xs disabled:opacity-40"
            >
              Middle
            </button>
            <button
              type="button"
              disabled={!canAlign}
              onClick={() => editor.alignShapes(editor.getSelectedShapeIds(), 'bottom')}
              className="flex-1 rounded border border-current/20 px-2 py-1 text-xs disabled:opacity-40"
            >
              Bottom
            </button>
          </div>
        </div>
      </section>
    </div>
  )
})
