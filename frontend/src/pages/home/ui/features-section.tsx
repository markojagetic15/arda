import { Card } from '@heroui/react'

import {
  CanvasIcon,
  CommentIcon,
  DocIcon,
  KanbanIcon,
  PresenceIcon,
  TreeIcon,
} from './feature-icons'

const FEATURES = [
  {
    icon: DocIcon,
    title: 'Collaborative docs',
    description: 'A rich text editor where every cursor, highlight, and edit lands instantly for everyone viewing the page.',
  },
  {
    icon: CanvasIcon,
    title: 'Infinite canvas',
    description: 'Sketch shapes, sticky notes, and connectors on a shared whiteboard that stays in sync shape-by-shape.',
  },
  {
    icon: KanbanIcon,
    title: 'Kanban boards',
    description: 'Default To Do / Doing / Done columns, custom columns per project, and drag-and-drop cards that move live.',
  },
  {
    icon: CommentIcon,
    title: 'Threaded comments',
    description: 'Leave a comment on a text selection, a canvas shape, or a task card — threads update live for the whole team.',
  },
  {
    icon: PresenceIcon,
    title: 'Live presence',
    description: 'See who else is here, their live cursors, and their selections — no refresh, no merge conflicts.',
  },
  {
    icon: TreeIcon,
    title: 'Nested workspaces',
    description: 'Spaces, projects, and unlimited nested pages, organized in a drag-and-drop sidebar tree.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything your team needs, one workspace</h2>
        <p className="mt-3 text-base opacity-70">
          Stop switching between five different tools. Arda brings documents, whiteboards, and task boards together —
          all live, all in one place.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="h-full">
            <Card.Header>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-current/5">
                <Icon className="h-5 w-5" />
              </div>
            </Card.Header>
            <Card.Content>
              <Card.Title>{title}</Card.Title>
              <Card.Description className="mt-1.5">{description}</Card.Description>
            </Card.Content>
          </Card>
        ))}
      </div>
    </section>
  )
}
