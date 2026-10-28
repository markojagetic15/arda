import { NodeIcon } from './node-icon'
import type { FlatNode } from '../lib/flatten-tree'

export function TreeRowPreview({ node }: { node: FlatNode }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-current/10 px-2 py-1 shadow-lg backdrop-blur-sm">
      <NodeIcon node={node} className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="truncate text-sm">{node.label}</span>
    </div>
  )
}
