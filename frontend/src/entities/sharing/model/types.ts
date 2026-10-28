import type { NodeKind, Role } from '@/entities/hierarchy-node'

export interface ScopeRef {
  type: NodeKind
  id: string
}

export interface ScopeSummary extends ScopeRef {
  label: string
}

export interface SharingPerson {
  userId: string
  name: string
  email: string
  role: Role
  isOwner: boolean
  inheritedFrom: ScopeSummary | null
}

export interface SharingInfo {
  scope: ScopeSummary
  myRole: Role
  canManage: boolean
  people: SharingPerson[]
  invitations: { id: string; email: string; role: Role; createdAt: string }[]
}

export interface InvitationPreview {
  scope: ScopeSummary
  email: string
  role: Role
  inviterName: string
}
