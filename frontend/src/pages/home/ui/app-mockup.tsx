import { CheckSquare, FileText, KanbanSquare, MessageSquare, PenTool, Search } from 'lucide-react'

/** A static, hand-built picture of the app for the hero - no screenshots to keep in sync. */
export function AppMockup() {
  return (
    <div className="app-shadow-lg overflow-hidden rounded-2xl border border-border bg-surface text-left">
      <div className="flex items-center gap-2 border-b border-border bg-surface-secondary px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex h-6 flex-1 items-center gap-2 rounded-md bg-background px-2.5 text-[11px] text-muted sm:max-w-xs">
          <Search className="h-3 w-3" /> proarda.com/workspace
        </span>
      </div>

      <div className="flex h-[340px] sm:h-[380px]">
        <div className="hidden w-48 shrink-0 flex-col gap-1 border-r border-border bg-[var(--app-sidebar)] p-3 text-[12px] sm:flex">
          <span className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted uppercase">Design team</span>
          {[
            { icon: FileText, label: 'Launch brief', color: 'text-sky-500', active: true },
            { icon: PenTool, label: 'Moodboard', color: 'text-fuchsia-500' },
            { icon: KanbanSquare, label: 'Sprint 14', color: 'text-amber-500' },
            { icon: FileText, label: 'Meeting notes', color: 'text-sky-500' },
          ].map(({ icon: Icon, label, color, active }) => (
            <span
              key={label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${active ? 'bg-accent-soft font-medium text-accent' : ''}`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? '' : color}`} /> {label}
            </span>
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden px-6 py-5 sm:px-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">Design team / Website relaunch</span>
            <span className="flex -space-x-1.5">
              {['bg-violet-500', 'bg-emerald-500', 'bg-amber-500'].map((color, index) => (
                <span key={color} className={`h-6 w-6 rounded-full border-2 border-surface ${color} text-[9px] leading-5 font-bold text-white`}>
                  {['AH', 'MK', 'LP'][index]}
                </span>
              ))}
            </span>
          </div>
          <h3 className="font-display mt-4 text-2xl font-bold sm:text-3xl">
            Launch brief
            <span className="relative ml-1 inline-block h-7 w-0.5 translate-y-1 bg-emerald-500">
              <span className="absolute -top-4 left-0 rounded-sm bg-emerald-500 px-1 font-sans text-[9px] leading-4 font-semibold whitespace-nowrap text-white">
                Mia
              </span>
            </span>
          </h3>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
            Our goal is a <span className="rounded bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-400/30">faster, friendlier</span>{' '}
            onboarding. Every page should feel{' '}
            <span className="font-semibold text-violet-600 dark:text-violet-400" style={{ letterSpacing: '0.08em' }}>
              crafted
            </span>
            ,{' '}
            <span className="italic" style={{ fontFamily: '"Lora Variable", Georgia, serif' }}>
              calm
            </span>{' '}
            and <span className="underline decoration-sky-500 decoration-2 underline-offset-2">consistent</span>.
          </p>
          <div className="mt-4 flex flex-col gap-1.5 text-[13px]">
            {[
              ['Finalize hero copy', true],
              ['Review color tokens', true],
              ['Ship the new sign-up flow', false],
            ].map(([label, done]) => (
              <span key={String(label)} className="flex items-center gap-2">
                <CheckSquare className={`h-3.5 w-3.5 ${done ? 'text-accent' : 'text-muted'}`} />
                <span className={done ? 'text-muted line-through' : ''}>{label}</span>
              </span>
            ))}
          </div>

          <div className="absolute right-5 bottom-5 hidden w-56 rotate-2 rounded-xl border border-border bg-surface p-3 shadow-xl md:block">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="h-5 w-5 rounded-full bg-violet-500 text-center text-[9px] leading-5 text-white">AH</span>
              Ana
              <span className="font-normal text-muted">2m ago</span>
            </div>
            <p className="mt-1.5 text-[12px]">Love this direction. Can we try the serif for headings too?</p>
            <span className="mt-2 flex items-center gap-1 text-[11px] text-accent">
              <MessageSquare className="h-3 w-3" /> 3 replies
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
