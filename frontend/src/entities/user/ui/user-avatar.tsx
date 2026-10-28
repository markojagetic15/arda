import { colorForUserId } from '@/shared/lib/collaboration'

import { initials } from '../lib/initials'

interface UserAvatarProps {
  name: string
  /** Id the color is derived from; pass an explicit `color` to override. */
  id?: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-lg',
}

export function UserAvatar({ name, id, color, size = 'sm', className = '' }: UserAvatarProps) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none ${SIZES[size]} ${className}`}
      style={{ backgroundColor: color ?? colorForUserId(id ?? name) }}
    >
      {initials(name)}
    </span>
  )
}
