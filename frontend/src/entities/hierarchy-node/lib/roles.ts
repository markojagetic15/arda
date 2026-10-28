import type { Role } from '../model/types'

const ORDER: Role[] = ['view', 'comment', 'edit', 'full']

export const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: 'full', label: 'Full access', description: 'Edit and share with others' },
  { value: 'edit', label: 'Can edit', description: 'Edit content and add pages' },
  { value: 'comment', label: 'Can comment', description: 'Read and leave comments' },
  { value: 'view', label: 'Can view', description: 'Read only' },
]

export function roleLabel(role: Role): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
}

/** Nodes without a role came from an older API or the mock backend: treat them as fully owned. */
export function hasRole(role: Role | undefined, min: Role): boolean {
  return ORDER.indexOf(role ?? 'full') >= ORDER.indexOf(min)
}
