import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

import { SlashMenu } from '../ui/slash-menu'
import { filterSlashItems, type SlashItem } from './slash-items'
import { suggestionPopup } from './suggestion-popup'

/** Type "/" to insert a block (heading, list, table, ...). */
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allow: ({ state, range }) => state.doc.resolve(range.from).parent.type.name !== 'codeBlock',
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: suggestionPopup<SlashItem>(SlashMenu),
      }),
    ]
  },
})
