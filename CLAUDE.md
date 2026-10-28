# proarda - Project Context

**proarda** (lowercase; the repo folder is still `arda`) is a real-time collaborative workspace: Notion-style **documents**, Miro-style **canvas** and Trello-style **Kanban** pages, organised in a **Space → Project → Page** tree. Every page is live-collaborative (Yjs CRDT over Socket.io) and can be commented on.

- Product spec / original requirements: [`docs/PRD.md`](docs/PRD.md). It describes the target; **this file describes what actually exists**.
- Backend details: [`backend/CLAUDE.md`](backend/CLAUDE.md) · Frontend details: [`frontend/CLAUDE.md`](frontend/CLAUDE.md)

## Repo layout

One git repo (monorepo) at `/var/www/arda` - single "Initial commit" (2026-10-28), authored on the owner's Mac.

```
backend/             NestJS 12 + TypeORM 1 + Postgres + Redis, DDD layers, ESM ("type": "module")
frontend/            React 19 + Vite 8 + HeroUI 3 + Tailwind 4, Feature-Sliced Design
docker-compose.yml   LOCAL DEV ONLY: Postgres 17 + Redis 8 with host ports published
docker-compose.prod.yml  production on the VPS (see "Production" below)
caddy/site.caddy     production routing, imported by /var/www/proxy
backup.conf          picked up by /var/www/backup/backup.sh
docs/PRD.md          original product spec
.idea/               JetBrains project files (committed)
```

## Running locally

```bash
cp .env.example .env && docker compose up -d                    # postgres :5432, redis :6379
cp backend/.env.example backend/.env
cd backend && npm install && npm run migration:run && npm run start:dev   # http://localhost:3000/api
cp frontend/.env.example frontend/.env
cd frontend && npm install && npm run dev                       # http://localhost:5173
```

Frontend-only mode, no backend at all: set `VITE_MOCK_AUTH=true` in `frontend/.env`. An in-memory fake serves auth and the hierarchy (see `frontend/src/shared/api/mock-backend.ts`). Pages render and edit locally but show "Disconnected" (no realtime).

## Architecture in one picture

```
 browser (React)                                   NestJS (:3000)
 ───────────────                                   ──────────────
 TanStack Query ── REST /api/auth/*, /api/users/me ──▶ AuthModule (JWT access + rotating refresh cookie)
                ── REST /api/hierarchy/*  ───────────▶ HierarchyModule
 useCollaboration(pageId)
   Y.Doc + Awareness ── socket.io ns /collaboration ─▶ CollaborationGateway
   + comments events     (one socket per open page)      └ RoomManagerService: one Y.Doc per page in memory,
                                                           debounced snapshot → Postgres document_snapshots,
                                                           Redis pub/sub relays updates between instances
```

- **Hierarchy (structure)** is relational: `spaces`, `projects`, `pages` tables, ordered by an integer `position` (gap 65536, midpoint insert, rebalance when exhausted).
- **Page content** is *not* relational. Each page is one Yjs document stored as an opaque `bytea` blob in `document_snapshots`. Document, canvas and Kanban differ only in how the frontend reads that Y.Doc (Tiptap XML fragment / `excalidraw-elements` + `excalidraw-files` Y.Maps / `kanban-columns` + `kanban-cards` + `kanban-labels` Y.Maps).
- **Sync handshake (important):** the client sends nothing until the server answers `join` with `sync-state`, then sends its full local state once. Sending earlier got updates dropped (the server's `join` is async), and Yjs then holds every later update from that client as pending forever - that was the "canvas crashes / content disappears" bug fixed on 2026-10-28. Canvas and Kanban also wait for `synced` before seeding defaults.
- **Comments** are relational (`comments` table), anchored by `(page_id, anchor_type, anchor_id)`, and travel over the same per-page socket.

## Implementation status vs. the PRD

| Area | State |
|---|---|
| Auth: register, login, refresh, logout, password reset, change password, email confirmation | ✅ Emails (reset, confirm, invite, shared-with-you, password changed) go through SMTP when `SMTP_HOST`+`MAIL_FROM` are set; otherwise they are only logged |
| Landing page | ✅ `pages/home` (redirects to `/workspace` when logged in) |
| Workspace shell: sidebar, breadcrumbs, home dashboard, Ctrl/Cmd+K command palette, dark mode, mobile | ✅ |
| Space → Project → Page tree, unlimited page nesting | ✅ Domain + use cases + frontend. Spaces/projects have `parent_id` columns but don't nest yet |
| New project gets Document + Canvas + Board pages | ✅ `CreateProjectUseCase` |
| Sidebar: DnD reorder (optimistic), create, rename, delete, duplicate, move-to dialog | ✅ |
| Rich-text editor (Tiptap + Yjs, live carets) | ✅ Per-character font, size, weight, color, highlight, letter spacing, line height, case; headings, lists, to-dos, tables, quotes, code, links, images, slash menu, bubble menu, word count |
| Canvas (Excalidraw + Yjs, live cursors/selections, comments on elements) | ✅ Switched from tldraw on 2026-10-28: tldraw v5 refuses to render on a production domain without a paid license key. Excalidraw is MIT |
| Kanban (columns, cards, DnD, live sync) | ✅ Labels, due dates, priority, checklists, card details dialog, column rename/color/delete, filters |
| Context-aware right sidebar | ✅ Document (`text-editor/ui/format-panel`) and canvas (`canvas-formatting-sidebar`). Kanban uses a card dialog instead |
| Comments on text selection / canvas shape / Kanban card | ✅ Flat threads + resolve. ❌ No replies-as-tree, edit or delete. Commenters can reply to text threads but not start new ones (that needs a mark in the document, i.e. edit access) |
| Presence (avatars, cursors) | ✅ Per page. ❌ No workspace-level presence |
| Page links | ✅ "Copy link" (page header / tree menu); pasting a page URL into a document makes a live chip (also `@` / "/Link to page"), into a Kanban description shows linked-page chips, onto the canvas makes a link element. Pages the reader can't open show as "Restricted page" |
| Sharing & permissions (Notion-style) | ✅ Members per space/project/page with Full access / Can edit / Can comment / Can view, inherited down the tree; Share dialog, email invites, "Shared with me" sidebar section, read-only modes. See "Access model" below |
| Deployment (Dockerfiles, Caddy, backups) | ✅ Since 2026-10-28, see "Production" |

## Access model

- Roles, weakest to strongest: `view` < `comment` < `edit` < `full`. A user's role on a node = `full` if they own its space, else the strongest **membership** on the node or any ancestor (page → parent pages → project → space). Access only flows down; there is no "restrict below".
- `edit` can create/rename/move/duplicate/delete inside; `full` can also manage sharing; deleting a space needs `full`. Viewers/commenters get the page read-only; the gateway drops Yjs updates from them, comments need `comment`.
- Inviting: a **confirmed** existing account gets the membership immediately (+ "shared with you" email); anyone else gets a 14-day single-use link (`/invite/<token>`) - accepting it proves inbox access, and also confirms the account's email when it matches. Sign-up sends a confirmation email (`/verify-email?token=`).
- The tree endpoint returns everything the user can see with their role per node; nodes whose parent isn't visible appear under "Shared with me".

## Known problems: read before changing things

1. **Don't bring tldraw back** without a license: v5 hides the canvas on any https, non-localhost domain without a key (http/localhost count as development, so it looks fine in dev).
2. Canvases drawn before 2026-10-28 (tldraw records in `tldraw-records`) are not shown by the Excalidraw canvas; boards from before the sync fix may have stuck Yjs "pending" updates. Only test data existed then.
3. Duplicating a page copies its last *saved* snapshot; edits from the last ~2 s that are still in an active room's memory are not included.
4. **The frontend sends `parentId` on `comment-create`; the backend ignores it.** Threads are flat per anchor, and resolved state lives on the first comment.
5. Email goes through **Mailjet** (same account as udomi-me, credentials in `.env`), sender `proarda <noreply@proarda.com>`. proarda.com must be validated in Mailjet with its DKIM record and an SPF of `v=spf1 include:spf.mailjet.com -all` in Squarespace DNS; until then Mailjet holds/rejects the mail (check the Mailjet dashboard and `docker compose logs backend | grep SmtpMailer`).
6. An open socket keeps the role it joined with until it reconnects, so a downgrade/removal takes effect on the next page load.
7. Memberships point at spaces/projects/pages without a foreign key; rows for deleted nodes are simply ignored.
8. Host Node is v20; build and test inside `node:22-alpine` (the Dockerfiles use it), e.g. `docker build --target build -t arda-backend-build backend && docker run --rm arda-backend-build npm test`.

Testing UI changes: an isolated staging stack (own Postgres/Redis, Vite dev server, Caddy, Playwright on a private network) was used on 2026-10-28; it lived in a session scratchpad, so recreate it if needed rather than testing against production.

Fixed on 2026-10-28 when making it deployable: the missing `HierarchyModule` + `HierarchyController` and `features/profile/update-profile` were recreated (never committed from the Mac); the backend lock file was re-synced; every `@ManyToOne` got a `@JoinColumn` (without it TypeORM queried a non-existent `parentId` column and the whole tree API 500'd); `data-source.ts` now has a single export (the migration CLI rejected two); `tsconfig.build.json` sets `declaration: false` (`.d.ts` files matched the migrations glob); `trust proxy` is on.

## Production (this VPS)

Same layout as the other projects in `/var/www` (see `/var/www/CLAUDE.md`). URL: **https://proarda.com** (bought 2026-10-28, DNS at Squarespace). `www.proarda.com` and the old temporary `arda.217-76-62-35.sslip.io` redirect to it.

- `docker-compose.prod.yml`: `db` (postgres:17, volume `arda_db_data`, no host port), `redis` (pub/sub only, no persistence), `backend` (`arda-backend:3000` on `web`; runs pending migrations on every start), `frontend` (nginx static SPA, `arda-frontend:80`).
- `.env` (chmod 600, gitignored) holds `COMPOSE_FILE=docker-compose.prod.yml`, so **plain `docker compose …` in `/var/www/arda` targets production on the server**. On the Mac (no such `.env`) it stays the dev compose. It also holds `ARDA_DOMAIN`, `DB_PASSWORD` and `JWT_ACCESS_SECRET`.
- `caddy/site.caddy`: `/api/*` and `/socket.io/*` → backend, everything else → frontend.
- `./uploads` (bind-mounted to `/app/uploads`, gitignored, in `backup.conf`) holds images uploaded into documents.
- Deploy: `cd /var/www/arda && git pull && docker compose up -d --build`. DB shell: `docker compose exec db psql -U arda arda`.
- **Changing the domain:** point an A record at `217.76.62.35`, change the site address in `caddy/site.caddy` and `ARDA_DOMAIN` in `.env`, run `docker compose up -d --build` (the WebSocket URL is baked into the frontend build), then reload Caddy.
- Never run the dev `docker-compose.yml` on the server: it publishes Postgres and Redis on all interfaces.

## Conventions

- Backend: strict DDD layering (see `backend/CLAUDE.md`). Every relative import ends in `.js` (ESM). Prettier with single quotes and trailing commas. `oxlint`. Vitest unit tests next to sources (`*.spec.ts`), in-memory fakes in `backend/test/fakes/`.
- Frontend: FSD import direction `app → pages → widgets → features → entities → shared`, each slice exposes `index.ts`. Alias `@/` → `src/`. Prettier: no semicolons, single quotes, width 100.
- Schema changes only through TypeORM migrations (`synchronize: false`).
- Comments in code explain *why* (several long ones on Strict Mode, CRDT seeding and the join-ordering race). Keep that style.
