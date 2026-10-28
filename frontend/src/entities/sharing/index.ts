export { sharingApi } from './api/sharing.api'
export type { InvitationPreview, ScopeRef, ScopeSummary, SharingInfo, SharingPerson } from './model/types'

export const sharingQueryKey = (scope: { type: string; id: string }) => ['sharing', scope.type, scope.id] as const
