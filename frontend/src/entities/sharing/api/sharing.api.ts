import type { Role } from '@/entities/hierarchy-node'
import { httpClient } from '@/shared/api/http-client'

import type { InvitationPreview, ScopeRef, ScopeSummary, SharingInfo } from '../model/types'

const base = (scope: ScopeRef) => `/sharing/${scope.type}/${scope.id}`

export const sharingApi = {
  get: (scope: ScopeRef) => httpClient.get<SharingInfo>(base(scope)),
  invite: (scope: ScopeRef, input: { email: string; role: Role }) =>
    httpClient.post<{ status: 'added' | 'invited' }>(`${base(scope)}/invite`, input),
  changeRole: (scope: ScopeRef, userId: string, role: Role) =>
    httpClient.patch<void>(`${base(scope)}/members/${userId}`, { role }),
  removeMember: (scope: ScopeRef, userId: string) => httpClient.delete<void>(`${base(scope)}/members/${userId}`),
  revokeInvitation: (invitationId: string) => httpClient.delete<void>(`/sharing/invitations/${invitationId}`),
  previewInvitation: (token: string) => httpClient.get<InvitationPreview>(`/invitations/${token}`),
  acceptInvitation: (token: string) =>
    httpClient.post<{ scope: ScopeSummary; pageId: string | null }>('/invitations/accept', { token }),
}
