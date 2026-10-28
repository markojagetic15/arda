import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'

import type { HierarchyNode } from '@/entities/hierarchy-node'

import { PageMentionMenu } from '../ui/page-mention-menu'
import { suggestionPopup } from './suggestion-popup'

export interface PageMentionOptions {
  /** Pages the user can see, read when the menu opens (kept fresh by the tree query). */
  getPages: () => HierarchyNode[]
}

/** Type "@" and pick a page to insert a link chip to it. */
export const PageMention = Extension.create<PageMentionOptions>({
  name: 'pageMention',

  addOptions() {
    return { getPages: () => [] }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<HierarchyNode, HierarchyNode>({
        pluginKey: new PluginKey('pageMention'),
        editor: this.editor,
        char: '@',
        items: ({ query }) => {
          const needle = query.toLowerCase().trim()
          return this.options
            .getPages()
            .filter((page) => page.kind === 'page' && page.label.toLowerCase().includes(needle))
            .slice(0, 8)
        },
        command: ({ editor, range, props }) => editor.chain().focus().deleteRange(range).insertPageLink(props.id).run(),
        render: suggestionPopup<HierarchyNode>(PageMentionMenu),
      }),
    ]
  },
})
