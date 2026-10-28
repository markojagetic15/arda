import type { SVGProps } from 'react'

const LINES: Record<'left' | 'center' | 'right' | 'justify', string[]> = {
  left: ['2 4 14 4', '2 8 10 8', '2 12 14 12'],
  center: ['3 4 13 4', '5 8 11 8', '3 12 13 12'],
  right: ['2 4 14 4', '6 8 14 8', '2 12 14 12'],
  justify: ['2 4 14 4', '2 8 14 8', '2 12 14 12'],
}

export function AlignIcon({
  align,
  ...props
}: SVGProps<SVGSVGElement> & { align: 'left' | 'center' | 'right' | 'justify' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      {LINES[align].map((points, index) => {
        const [x1, y1, x2, y2] = points.split(' ');
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      })}
    </svg>
  )
}
