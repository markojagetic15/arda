import { Button, Spinner } from '@heroui/react'

import { useLogout } from '../model/use-logout'

export function LogoutButton({ onLoggedOut }: { onLoggedOut?: () => void }) {
  const logout = useLogout()

  return (
    <Button variant="secondary" isDisabled={logout.isPending} onPress={() => logout.mutate(undefined, { onSuccess: onLoggedOut, onError: onLoggedOut })}>
      {logout.isPending ? <Spinner size="sm" /> : 'Log out'}
    </Button>
  )
}
