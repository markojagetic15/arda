import { Extension, type CommandProps } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textStyleExtras: {
      setLetterSpacing: (value: string) => ReturnType
      unsetLetterSpacing: () => ReturnType
      setFontWeight: (value: string) => ReturnType
      unsetFontWeight: () => ReturnType
      setTextTransform: (value: string) => ReturnType
      unsetTextTransform: () => ReturnType
    }
  }
}

const STYLE_ATTRIBUTES = [
  { name: 'letterSpacing', css: 'letter-spacing' },
  { name: 'fontWeight', css: 'font-weight' },
  { name: 'textTransform', css: 'text-transform' },
] as const

/**
 * Extra per-character styling on top of TextStyleKit (font, size, color,
 * background, line height): letter spacing, font weight and letter case.
 * Like the built-in ones they live on the `textStyle` mark, so any range -
 * down to a single letter - can carry its own value.
 */
export const TextStyleExtras = Extension.create({
  name: 'textStyleExtras',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: Object.fromEntries(
          STYLE_ATTRIBUTES.map(({ name, css }) => [
            name,
            {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.getPropertyValue(css) || null,
              renderHTML: (attributes: Record<string, string | null>) =>
                attributes[name] ? { style: `${css}: ${attributes[name]}` } : {},
            },
          ]),
        ),
      },
    ]
  },

  addCommands() {
    const set =
      (name: string) =>
      (value: string) =>
      ({ chain }: CommandProps) =>
        chain().setMark('textStyle', { [name]: value }).run()
    const unset =
      (name: string) =>
      () =>
      ({ chain }: CommandProps) =>
        chain().setMark('textStyle', { [name]: null }).removeEmptyTextStyle().run()
    return {
      setLetterSpacing: set('letterSpacing'),
      unsetLetterSpacing: unset('letterSpacing'),
      setFontWeight: set('fontWeight'),
      unsetFontWeight: unset('fontWeight'),
      setTextTransform: set('textTransform'),
      unsetTextTransform: unset('textTransform'),
    }
  },
})
