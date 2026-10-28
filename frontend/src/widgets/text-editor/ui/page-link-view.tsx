import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

import { PageLinkChip } from '@/features/hierarchy-tree'

export function PageLinkView({ node, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper as="span" className="inline">
      <PageLinkChip pageId={node.attrs.pageId as string} selected={selected} />
    </NodeViewWrapper>
  )
}
