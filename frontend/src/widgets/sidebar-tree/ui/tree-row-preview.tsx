import { NodeGlyph } from '@/entities/hierarchy-node'

import type { FlatNode } from '../lib/flatten-tree'

export function TreeRowPreview({ node }: { node: FlatNode }) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-lg border border-border bg-overlay px-2.5 text-sm font-medium shadow-xl">
      <NodeGlyph node={node} />
      <span className="truncate">{node.label}</span>
    </div>
  )
}
