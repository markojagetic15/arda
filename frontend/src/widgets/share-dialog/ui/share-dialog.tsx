import { Spinner } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Link2, Mail, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { HIERARCHY_TREE_QUERY_KEY, pageUrl, ROLE_OPTIONS, roleLabel, type Role } from '@/entities/hierarchy-node'
import { useAuth } from '@/entities/session'
import { sharingApi, sharingQueryKey, type SharingPerson } from '@/entities/sharing'
import { UserAvatar } from '@/entities/user'
import { errorMessage } from '@/shared/api/error-message'
import { shareDialog, useShareTarget, type ShareTarget } from '@/shared/lib/share-dialog/store'
import { FormAlert } from '@/shared/ui/form-alert'
import { copyText } from '@/shared/lib/clipboard'

const KIND: Record<ShareTarget['type'], string> = { space: 'space', project: 'project', page: 'page' }

function RoleSelect({
  value,
  onChange,
  disabled,
  allowRemove,
  ariaLabel,
}: {
  value: Role
  onChange: (value: Role | 'remove') => void
  disabled?: boolean
  allowRemove?: boolean
  ariaLabel: string
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as Role | 'remove')}
      className="h-8 cursor-pointer rounded-lg border border-transparent bg-transparent px-2 text-xs font-medium text-muted outline-none hover:border-border hover:text-foreground focus:border-accent disabled:cursor-default disabled:hover:border-transparent"
    >
      {ROLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {allowRemove ? <option value="remove">Remove access</option> : null}
    </select>
  )
}

export function ShareDialog() {
  const target = useShareTarget()
  return target ? <ShareDialogContent key={`${target.type}:${target.id}`} target={target} /> : null
}

function ShareDialogContent({ target }: { target: ShareTarget }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryKey = sharingQueryKey(target)
  const sharing = useQuery({ queryKey, queryFn: () => sharingApi.get(target) })
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('edit')
  const [notice, setNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && shareDialog.close()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const refresh = () => queryClient.invalidateQueries({ queryKey })
  const invite = useMutation({
    mutationFn: () => sharingApi.invite(target, { email, role }),
    onSuccess: ({ status }) => {
      setNotice(status === 'added' ? `${email} now has access and was notified by email.` : `Invitation sent to ${email}.`)
      setEmail('')
      void refresh()
    },
  })
  const change = useMutation({
    mutationFn: ({ person, next }: { person: SharingPerson; next: Role | 'remove' }) =>
      next === 'remove' ? sharingApi.removeMember(target, person.userId) : sharingApi.changeRole(target, person.userId, next),
    onSuccess: (_result, { person, next }) => {
      if (next === 'remove' && person.userId === user?.id) {
        // Left a shared item: it disappears from the sidebar.
        shareDialog.close()
        void queryClient.invalidateQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY })
        navigate('/workspace')
        return
      }
      void refresh()
    },
  })
  const revoke = useMutation({ mutationFn: sharingApi.revokeInvitation, onSuccess: () => void refresh() })

  const info = sharing.data
  const error = invite.error ?? change.error ?? revoke.error ?? sharing.error

  async function copyLink() {
    await copyText(pageUrl(target.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(event) => event.target === event.currentTarget && shareDialog.close()}
    >
      <div role="dialog" aria-label="Share" className="app-shadow-lg w-full max-w-lg rounded-2xl border border-border bg-overlay animate-rise">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display truncate text-lg font-bold">Share {info ? `"${info.scope.label}"` : KIND[target.type]}</h2>
            <p className="text-xs text-muted">
              People you add get access to this {KIND[target.type]}
              {target.type === 'page' ? ' and its sub-pages' : ' and everything inside it'}.
            </p>
          </div>
          <button
            type="button"
            onClick={shareDialog.close}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-default hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {error ? <FormAlert>{errorMessage(error)}</FormAlert> : null}
          {notice && !error ? <FormAlert tone="success">{notice}</FormAlert> : null}

          {info?.canManage ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                setNotice(null)
                if (email.trim()) invite.mutate()
              }}
              className="flex gap-2"
            >
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-field pr-1 pl-3 focus-within:border-accent">
                <Mail className="h-4 w-4 shrink-0 text-muted" />
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  aria-label="Email address to invite"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <RoleSelect ariaLabel="Role for the invite" value={role} onChange={(next) => next !== 'remove' && setRole(next)} />
              </label>
              <button
                type="submit"
                disabled={!email.trim() || invite.isPending}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {invite.isPending ? <Spinner size="sm" color="current" /> : <UserPlus className="h-4 w-4" />}
                Invite
              </button>
            </form>
          ) : info ? (
            <p className="rounded-xl bg-surface-secondary px-3 py-2 text-xs text-muted">
              You have <strong className="text-foreground">{roleLabel(info.myRole).toLowerCase()}</strong> access. Only people
              with full access can invite others.
            </p>
          ) : null}

          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">People with access</p>
            {sharing.isPending ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              <ul className="scroll-thin flex max-h-72 flex-col gap-1 overflow-y-auto">
                {info?.people.map((person) => {
                  const isMe = person.userId === user?.id
                  const editable = info.canManage && !person.isOwner && !person.inheritedFrom
                  return (
                    <li key={person.userId} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-default/50">
                      <UserAvatar name={person.name} id={person.userId} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {person.name} {isMe ? <span className="font-normal text-muted">(you)</span> : null}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {person.email}
                          {person.inheritedFrom ? ` · via ${person.inheritedFrom.type} "${person.inheritedFrom.label}"` : ''}
                        </p>
                      </div>
                      {person.isOwner ? (
                        <span className="px-2 text-xs font-medium text-muted">Owner</span>
                      ) : editable || (isMe && !person.inheritedFrom) ? (
                        <RoleSelect
                          ariaLabel={`Access for ${person.name}`}
                          value={person.role}
                          disabled={!editable}
                          allowRemove
                          onChange={(next) => {
                            if (next === 'remove' && isMe && !window.confirm('Leave? You will lose access to this item.')) return
                            change.mutate({ person, next })
                          }}
                        />
                      ) : (
                        <span className="px-2 text-xs font-medium text-muted">{roleLabel(person.role)}</span>
                      )}
                    </li>
                  )
                })}
                {info?.invitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{invitation.email}</p>
                      <p className="text-xs text-muted">Invited · {roleLabel(invitation.role)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revoke.mutate(invitation.id)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {target.type === 'page' ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
            <p className="text-xs text-muted">Only people with access can open the link.</p>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium hover:bg-default"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
