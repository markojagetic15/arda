import { Dropdown } from '@heroui/react'
import { ChevronsUpDown, LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/entities/session'
import { UserAvatar } from '@/entities/user'
import { useLogout } from '@/features/auth/logout'
import { useTheme } from '@/shared/lib/theme'

const ITEM = 'flex items-center gap-2.5'
const ICON = 'h-4 w-4 text-muted'

export function UserMenu() {
  const { user } = useAuth()
  const { setPreference } = useTheme()
  const logout = useLogout()
  const navigate = useNavigate()
  if (!user) return null

  const signOut = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Account menu"
        className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-default/70"
      >
        <UserAvatar name={user.name} id={user.id} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted">{user.email}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top start" className="min-w-60">
        <Dropdown.Menu aria-label="Account">
          <Dropdown.Section>
            <Dropdown.Item id="profile" textValue="Profile & settings" onAction={() => navigate('/profile')}>
              <span className={ITEM}>
                <UserRound className={ICON} /> Profile & settings
              </span>
            </Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Section>
            <Dropdown.Item id="light" textValue="Light theme" onAction={() => setPreference('light')}>
              <span className={ITEM}>
                <Sun className={ICON} /> Light theme
              </span>
            </Dropdown.Item>
            <Dropdown.Item id="dark" textValue="Dark theme" onAction={() => setPreference('dark')}>
              <span className={ITEM}>
                <Moon className={ICON} /> Dark theme
              </span>
            </Dropdown.Item>
            <Dropdown.Item id="system" textValue="System theme" onAction={() => setPreference('system')}>
              <span className={ITEM}>
                <Monitor className={ICON} /> System theme
              </span>
            </Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Section>
            <Dropdown.Item id="logout" textValue="Log out" variant="danger" onAction={signOut}>
              <span className={ITEM}>
                <LogOut className="h-4 w-4" /> Log out
              </span>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
