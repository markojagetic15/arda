import type { SVGProps } from 'react'

import type { HierarchyNode } from '@/entities/hierarchy-node'

function SpaceGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ProjectGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M2 4.5A1.5 1.5 0 0 1 3.5 3h3l1.5 1.75h4.5A1.5 1.5 0 0 1 14 6.25v6.25A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DocumentGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M4 2h5l3 3v9H4V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 8h4M6 10.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function CanvasGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="6.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="m4 12 3.2-3.6 2.3 2 2.5-3.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KanbanGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 2.5v11M10.5 2.5v6.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export function NodeIcon({ node, className }: { node: HierarchyNode; className?: string }) {
  if (node.kind === 'space') return <SpaceGlyph className={className} />
  if (node.kind === 'project') return <ProjectGlyph className={className} />
  if (node.pageType === 'canvas') return <CanvasGlyph className={className} />
  if (node.pageType === 'kanban') return <KanbanGlyph className={className} />
  return <DocumentGlyph className={className} />
}

export function DragHandleGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 10 16" fill="currentColor" {...props}>
      {[3, 7].map((cx) =>
        [3, 8, 13].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.1" />),
      )}
    </svg>
  )
}
