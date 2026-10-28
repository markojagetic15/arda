import { useId, type SVGProps } from 'react'

/** The proarda mark: a gradient tile with a geometric "p". */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="0.55" stopColor="#5B4CF0" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M11.5 25V12.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="17.25" cy="14.25" r="5.5" stroke="white" strokeWidth="3.2" />
      <circle cx="24" cy="24" r="1.9" fill="white" fillOpacity="0.85" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  markClassName?: string
}

/** Mark + lowercase wordmark. */
export function Logo({ className = '', markClassName = 'h-7 w-7' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="font-display text-[1.15em] font-bold tracking-tight">proarda</span>
    </span>
  )
}
