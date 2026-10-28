import '@fontsource-variable/lora'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/700.css'

export interface FontOption {
  label: string
  /** CSS font-family value stored in the document (null = the editor default). */
  value: string | null
}

export const FONTS: FontOption[] = [
  { label: 'Default (Inter)', value: null },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans Variable", sans-serif' },
  { label: 'Lora (serif)', value: '"Lora Variable", Georgia, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono Variable", monospace' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Caveat (handwriting)', value: 'Caveat, cursive' },
]

export const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96]

export const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra bold', value: '800' },
  { label: 'Black', value: '900' },
]

export const LINE_HEIGHTS = ['1', '1.15', '1.3', '1.5', '1.75', '2', '2.5', '3']

export const TEXT_COLORS = [
  '#0f172a', '#475569', '#94a3b8', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#16a34a',
  '#059669', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#c026d3', '#db2777', '#e11d48',
]

export const HIGHLIGHT_COLORS = [
  '#fef08a', '#fde68a', '#fed7aa', '#fecaca', '#fbcfe8', '#e9d5ff', '#c7d2fe', '#bfdbfe',
  '#a5f3fc', '#bbf7d0', '#d9f99d', '#e5e7eb',
]
