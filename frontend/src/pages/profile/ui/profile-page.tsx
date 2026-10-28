import { Card } from '@heroui/react'
import { Link, useNavigate } from 'react-router-dom'

import { LogoutButton } from '@/features/auth/logout'
import { UpdateProfileForm } from '@/features/profile/update-profile'
import { useAuth } from '@/entities/session'

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <Card.Header className="flex items-center justify-between gap-4">
          <div>
            <Card.Title>{user.name}</Card.Title>
            <Card.Description>{user.email}</Card.Description>
          </div>
          <LogoutButton onLoggedOut={() => navigate('/login', { replace: true })} />
        </Card.Header>
        <Card.Content>
          <UpdateProfileForm user={user} />
        </Card.Content>
        <Card.Footer>
          <Link to="/workspace" className="text-sm underline">
            Go to workspace
          </Link>
        </Card.Footer>
      </Card>
    </main>
  )
}
