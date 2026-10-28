export function SiteFooter() {
  return (
    <footer className="border-t border-current/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm opacity-60 sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} Arda</span>
        <span>Built with React, NestJS, and Yjs.</span>
      </div>
    </footer>
  )
}
