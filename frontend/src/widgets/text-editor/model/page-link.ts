import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'

import { parsePageLink } from '@/entities/hierarchy-node'

import { PageLinkView } from '../ui/page-link-view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageLink: {
      /** Inserts a link chip to another page at the cursor. */
      insertPageLink: (pageId: string) => ReturnType
    }
  }
}

/**
 * An inline chip linking to another page. Only the page id is stored in the
 * document; the icon and title are looked up live, so renames show up
 * everywhere. Pasting a page URL (from "Copy link") turns into one of these.
 */
export const PageLink = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      pageId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-page-link'),
        renderHTML: (attributes) => ({ 'data-page-link': attributes.pageId }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-page-link]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['a', mergeAttributes(HTMLAttributes, { href: `/workspace/${node.attrs.pageId}` }), 'page']
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageLinkView)
  },

  addCommands() {
    return {
      insertPageLink:
        (pageId) =>
        ({ chain }) =>
          chain()
            .insertContent([{ type: this.name, attrs: { pageId } }, { type: 'text', text: ' ' }])
            .run(),
    }
  },

  addProseMirrorPlugins() {
    const type = this.type
    return [
      new Plugin({
        key: new PluginKey('pageLinkPaste'),
        props: {
          handlePaste: (view, event) => {
            const pageId = parsePageLink(event.clipboardData?.getData('text/plain') ?? '')
            if (!pageId) return false
            const { tr } = view.state
            tr.replaceSelectionWith(type.create({ pageId }), false).insertText(' ')
            view.dispatch(tr.scrollIntoView())
            return true
          },
        },
      }),
    ]
  },
})
