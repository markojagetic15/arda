import { useMutation } from '@tanstack/react-query'
import { MailWarning, X } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/entities/session'
import { userApi } from '@/entities/user'

/** Reminds unconfirmed users to verify their email; teammates can only add confirmed addresses directly. */
export function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const resend = useMutation({ mutationFn: userApi.resendVerification })

  if (!user || user.emailVerified || dismissed) return null

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning-soft-foreground">
      <MailWarning className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {resend.isSuccess ? (
          <>We sent a new confirmation link to <strong>{user.email}</strong>.</>
        ) : (
          <>Please confirm your email (<strong>{user.email}</strong>) so teammates can share pages with you directly.</>
        )}
      </p>
      {!resend.isSuccess ? (
        <button
          type="button"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-50"
        >
          Resend email
        </button>
      ) : null}
      <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="shrink-0 rounded p-1 hover:bg-black/5">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
