# frontend

React + TypeScript + Vite, structured with Feature-Sliced Design.

## Stack

- HeroUI + Tailwind CSS v4 for UI/styling
- TanStack Query for server state
- React Hook Form + Yup for forms/validation — see `src/shared/lib/form`
- ESLint (flat config) + Prettier

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck (`tsc -b`) and build
- `npm run typecheck` — typecheck only
- `npm run lint` — ESLint
- `npm run format` — Prettier write

## Structure (`src/`)

| Slice | Purpose |
|---|---|
| `app/` | Providers, router, global styles — app composition root |
| `processes/` | Cross-page business processes |
| `pages/` | Route-level compositions |
| `widgets/` | Composed, page-agnostic UI blocks |
| `features/` | User-facing actions |
| `entities/` | Business entities |
| `shared/` | Reusable, business-agnostic code (`api/`, `ui/`, `lib/`, `config/`, `types/`) |

Each slice (other than `app`) has its own `README.md` describing its role.
