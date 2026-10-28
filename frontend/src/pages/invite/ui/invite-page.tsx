import { Spinner } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, MailX } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { HIERARCHY_TREE_QUERY_KEY, roleLabel } from '@/entities/hierarchy-node'
import { useAuth } from '@/entities/session'
import { sharingApi } from '@/entities/sharing'
import { errorMessage } from '@/shared/api/error-message'
import { AuthLayout } from '@/shared/ui/auth-layout'
import { FormAlert } from '@/shared/ui/form-alert'

const BUTTON =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-60'

export function InvitePage() {
  const { token = '' } = useParams<{ token: string }>()
  const { user, isInitializing } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const preview = useQuery({ queryKey: ['invitation', token], queryFn: () => sharingApi.previewInvitation(token), retry: false })
  const accept = useMutation({
    mutationFn: () => sharingApi.acceptInvitation(token),
    onSuccess: async ({ pageId }) => {
      await queryClient.invalidateQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY })
      navigate(pageId ? `/workspace/${pageId}` : '/workspace', { replace: true })
    },
  })

  if (preview.isPending || isInitializing) {
    return (
      <AuthLayout title="Opening invitation">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </AuthLayout>
    )
  }

  if (preview.isError) {
    return (
      <AuthLayout
        title="This invitation can't be used"
        description="It may have expired, been revoked, or already been accepted."
        footer={
          <Link to="/workspace" className="font-semibold text-accent hover:underline">
            Go to proarda
          </Link>
        }
      >
        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
          <MailX className="h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">Ask the person who invited you to send a new invitation.</p>
        </div>
      </AuthLayout>
    )
  }

  const invite = preview.data
  const here = `/invite/${token}`

  return (
    <AuthLayout
      title={`Join "${invite.scope.label}"`}
      description={
        <>
          <strong className="text-foreground">{invite.inviterName}</strong> invited {invite.email} to this {invite.scope.type} with{' '}
          <strong className="text-foreground">{roleLabel(invite.role).toLowerCase()}</strong> access.
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {accept.isError ? <FormAlert>{errorMessage(accept.error)}</FormAlert> : null}
        {user ? (
          <>
            {user.email !== invite.email ? (
              <FormAlert>
                You're signed in as {user.email}. Accepting adds access to this account, not {invite.email}.
              </FormAlert>
            ) : null}
            <button
              type="button"
              disabled={accept.isPending}
              onClick={() => accept.mutate()}
              className={`${BUTTON} bg-accent text-accent-foreground`}
            >
              {accept.isPending ? <Spinner size="sm" color="current" /> : <>Accept and open <ArrowRight className="h-4 w-4" /></>}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate(`/register?email=${encodeURIComponent(invite.email)}`, { state: { from: here } })}
              className={`${BUTTON} bg-accent text-accent-foreground`}
            >
              Create an account to join <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: here } })}
              className={`${BUTTON} border border-border hover:bg-default`}
            >
              I already have an account
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
