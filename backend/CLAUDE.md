# proarda backend

NestJS 12 · TypeScript 6 (ESM, `module: nodenext`) · TypeORM 1 + PostgreSQL · ioredis · Socket.io + `@socket.io/redis-adapter` · Yjs / y-protocols · Passport-JWT · Vitest · oxlint. Project-wide context: [`../CLAUDE.md`](../CLAUDE.md).

```bash
npm run start:dev                 # watch mode, :3000, global prefix /api
npm test                          # vitest unit tests (*.spec.ts)
npm run test:e2e                  # test/*.e2e-spec.ts. Boots AppModule, needs real Postgres + Redis
npm run lint / format / build
npm run migration:generate -- src/infrastructure/database/migrations/<Name>
npm run migration:run | migration:revert
```

## Layers (`src/`)

| Layer | Contains | May import |
|---|---|---|
| `domain/` | Models (`User`, `Session`, `Space`, `Project`, `Page`, `Comment`), errors, **repository ports as abstract classes**, `position.ts`, `shared/crypto.ts` | nothing framework-specific |
| `application/` | Use cases (`@Injectable`, one `execute(input)` each), application ports (`TokenService`, `Mailer`), `RoomManagerService` | `domain` (plus Nest DI / ConfigService) |
| `infrastructure/` | TypeORM `*.entity.ts` + `TypeOrm*Repository` adapters, config, migrations, Redis, bcrypt, JWT, console mailer, `RedisIoAdapter` | `domain`, `application` ports |
| `interface/` | HTTP controllers + DTOs (class-validator), WS gateway, Nest modules that do the wiring | everything |

Patterns:

- **Ports are abstract classes used directly as DI tokens:** `{ provide: UserRepository, useClass: TypeOrmUserRepository }`. Tests swap in the in-memory fakes from `test/fakes/`.
- **Models** are hand-written classes with private `props`, `create()` for new instances (sets timestamps and defaults), `fromProps()` for hydration and `toProps()` for persistence. Repositories map between entity and model.
- **Domain errors** are plain `Error` subclasses. `interface/http/common/domain-exception.filter.ts` maps them to HTTP statuses. **Register every new domain error there**, or it surfaces as a 500.
- Ownership is checked in the repository (`findByIdForOwner` joins page → project → space.owner_id). There are no roles or sharing.
- Every relative import needs the `.js` suffix.

## Modules (`app.module.ts`)

`ConfigModule` (global, `infrastructure/config/configuration.ts`) · `DatabaseModule` (`autoLoadEntities`, `synchronize: false`) · `RedisModule` (global `REDIS_CLIENT`) · `AuthModule` (exports `TokenService`, `UserRepository`) · `HierarchyModule` (exports `PageRepository` for the gateway) · `CollaborationModule` · `HealthController` (`GET /api/health`).

`main.ts` sets up the `RedisIoAdapter` (waits for Redis to be ready, so the app won't start without Redis), prefix `api`, `cookie-parser`, CORS with credentials, `ValidationPipe({ whitelist, transform })` and the domain exception filter.

## Auth

- `POST /api/auth/register | login | refresh | logout`, `POST /api/auth/password-reset/request | confirm`. All four session endpoints return `{ user, accessToken }`; `logout` returns `{ success: true }`.
- `GET | PATCH /api/users/me` (JWT guard; `PATCH` only changes `name`).
- `POST /api/users/me/password` `{ currentPassword, newPassword }`: re-checks the current password (wrong → 400), changes it, and revokes every other session (the caller's refresh cookie is kept, via `SessionRepository.revokeAllForUserExcept`).
- **Access token:** a JWT (`sub`, `email`) signed with `JWT_ACCESS_SECRET`, TTL `JWT_ACCESS_TTL` (15m). Sent as `Authorization: Bearer` and as the socket.io handshake `auth.token`.
- **Refresh token:** an opaque random token in the httpOnly cookie `refresh_token`, path `/api/auth`, `sameSite=lax`. Only its SHA-256 hash is stored (`sessions.refresh_token_hash`). It is **rotated on every refresh**. Logout revokes the session.
- **Password reset:** the token is hashed onto `users`, TTL 15 min, and the link is `${FRONTEND_URL}/reset-password?token=…`, delivered through `Mailer` (only `ConsoleMailer` exists, so the link only appears in the backend log). Requesting a reset for an unknown email silently succeeds.

## Hierarchy

Domain: `Space(ownerId)` → `Project(spaceId)` → `Page(projectId, parentId → page | null, type: document|canvas|kanban)`. `Page.projectId` is **denormalised** onto every descendant, so `MovePageUseCase` cascades it level by level when a subtree changes project. The page-nesting cycle check walks ancestors.

Ordering: `domain/hierarchy/position.ts` + `application/hierarchy/position-planner.ts`. Integer positions with gap 65536. An insert at an index takes the midpoint. If no integer room is left, the siblings are rebalanced (the caller saves them first) and the insert retried.

Use cases (all exist, with specs): create / rename / delete / move for space, project and page; duplicate for project and page (`clone-page-tree.ts`, root gets the " (copy)" suffix; `copy-snapshots.ts` copies each page's saved Yjs snapshot onto its clone, so duplicates keep their content); `GetHierarchyTreeUseCase` returns `{ spaces, projects, pages }`. `CreateProjectUseCase` seeds the pages **Document**, **Canvas** and **Board**. `MovePageUseCase.targetParentId` may be a project id (the page becomes a root page) or a page id (nested).

### REST API: `interface/http/hierarchy/hierarchy.controller.ts`

Node-level routes take the node's `kind` and dispatch to the matching use case. All routes are behind the JWT guard. The frontend (`frontend/src/entities/hierarchy-node/api/hierarchy.api.ts`) and its mock use this contract:

| Method & path | Body / query | Returns |
|---|---|---|
| `GET /hierarchy/tree` | - | `{ nodes: HierarchyNodeDto[] }` (flatten spaces + projects + pages via presenters) |
| `POST /hierarchy/spaces` | `CreateSpaceDto { name }` | node |
| `POST /hierarchy/projects` | `CreateProjectDto { spaceId, name }` | `{ project: node, pages: node[] }` |
| `POST /hierarchy/pages` | `CreatePageDto { parentId (project or page id), title?, type? }` | node |
| `PATCH /hierarchy/nodes/:id/rename` | `RenameNodeDto { kind, label }` | node |
| `PATCH /hierarchy/nodes/:id/move` | `MoveNodeDto { kind, targetParentId, index }` | node |
| `POST /hierarchy/nodes/:id/duplicate` | `DuplicateNodeDto { kind: project\|page }` | `{ nodes: node[] }` (every created node) |
| `DELETE /hierarchy/nodes/:id?kind=` | `DeleteNodeQueryDto` | 204 |

`HierarchyNodeDto = { id, kind, label, parentId, position, pageType? }`. A project's `parentId` is its space id, and a root page's `parentId` is its project id, so the frontend sees one uniform tree.

## Access & sharing

- `application/access/access.service.ts`: role resolution (`spaceFor` / `projectFor` / `pageFor(userId, id, minRole)` return the entity, `null` when the user has no access - report "not found" - or throw `AccessDeniedError` (403) when the role is too weak), `roleForPage`, `scopeChain`, and `accessibleTree` (the per-user tree with roles). Every hierarchy use case goes through it; their `ownerId` input is the acting user. `findByIdForOwner` is no longer used for authorization.
- `application/access/sharing.service.ts`: sharing info, invite, accept, change role, remove/leave, revoke. Domain in `domain/access/` (`Role`, `Membership`, `Invitation`); tables `memberships` (unique scope+user, polymorphic `scope_id`, no FK) and `invitations` (token hash, 14-day expiry). Migration `1790300000000-AddSharing` also adds `users.email_verified_at` + verification token columns.
- REST (JWT): `GET /sharing/:type/:id`, `POST /sharing/:type/:id/invite {email, role}`, `PATCH|DELETE /sharing/:type/:id/members/:userId`, `DELETE /sharing/invitations/:id`, `POST /invitations/accept {token}`; public `GET /invitations/:token` (preview). Auth: `POST /auth/verify-email {token}` (public), `POST /users/me/verify-email` (resend). User responses include `emailVerified`; tree nodes include `role`.
- Mail: `Mailer.send({to, subject, html, text})`; templates in `application/notifications/emails.ts`; `infrastructure/mail/mail.module.ts` (global) picks `SmtpMailer` (nodemailer; port 465 = TLS) when `SMTP_HOST` and `MAIL_FROM` are set, else `ConsoleMailer`. Send failures are logged, never thrown.

## Image uploads

`POST /api/uploads` (JWT, multipart: `pageId`, `file`) needs edit access to the page; the type is detected from the file's bytes (PNG/JPEG/GIF/WebP, max 10 MB; SVG rejected), the file is stored as `<uuid>.<ext>` in `UPLOAD_DIR` (`FileStorage` port → `LocalFileStorage`) and the URL `/api/uploads/<name>` is returned. `GET /api/uploads/:name` is public (so `<img>` works without auth) with immutable caching, `nosniff` and a `default-src 'none'` CSP. Anyone holding a URL can load that image. No uploads table: files deleted from documents stay on disk.

## Realtime collaboration (`interface/websocket/collaboration/`)

Socket.io namespace **`/collaboration`** (default path `/socket.io`). One socket per open page.

| Direction | Event | Payload |
|---|---|---|
| C→S handshake | `auth: { token }` | access JWT. Invalid → `error` + disconnect (the client refreshes and reconnects) |
| C→S | `join` | `{ pageId }`, needs at least `view`; the role is stored on the socket. A socket is in one page room at a time |
| S→C on join | `sync-state`, `awareness-state` | binary Yjs full state / awareness. **The client sends nothing before `sync-state`** (updates arriving before the async join completes are dropped), then sends its full state once |
| S→C on join | `comments-state` | `CommentDto[]` |
| both | `sync-update` | binary Yjs update (relayed to the room + applied to the server doc) |
| both | `awareness-update` | binary awareness update |
| C→S | `comment-create` | `{ anchorType, anchorId, body }` → room gets `comment-created` |
| C→S | `comment-resolve` | `{ commentId, resolved }` → room gets `comment-resolved { id, resolved }` |
| S→C | `error` | `{ message }` |

`RoomManagerService` (application layer):

- Keeps one `Y.Doc` + `Awareness` per active page, hydrated from `document_snapshots`.
- Persists debounced (2 s) as `Y.encodeStateAsUpdate`. Evicts a room 10 s after its last local socket leaves (flushing first), and flushes all rooms on shutdown.
- Multi-instance: local updates are published on Redis `yjs-update:<pageId>` / `yjs-awareness:<pageId>`. Every instance holding that room applies them, so each instance's persisted copy stays complete. Socket broadcast across instances goes through the Redis adapter.
- Tracks which awareness client IDs each socket introduced, so disconnects remove the right cursors.

The server never interprets document content. Its structure is defined entirely by the frontend widgets.

## Database (migrations in `infrastructure/database/migrations/`)

`users` (unique email, reset-token hash index) · `sessions` (FK users, cascade) · `spaces` / `projects` / `pages` (self-referencing `parent_id`, cascade deletes down the tree, `(parent, …, position)` indexes, enum `pages_type_enum`) · `document_snapshots (page_id PK → pages, state bytea)` · `comments (page_id → pages, anchor_type enum text|canvas-shape|kanban-card, anchor_id varchar, author_name denormalised, resolved)`.

The TypeORM CLI uses `infrastructure/database/data-source.ts` (reads `.env` via `dotenv`).

## Env (`.env.example`)

`NODE_ENV PORT CORS_ORIGIN FRONTEND_URL DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_DATABASE REDIS_HOST REDIS_PORT JWT_ACCESS_SECRET JWT_ACCESS_TTL JWT_REFRESH_TTL_MS PASSWORD_RESET_TTL_MS`. Everything has a dev default in `configuration.ts`. **Change `JWT_ACCESS_SECRET` anywhere non-local.** The gateway's CORS reads `process.env.CORS_ORIGIN` at import time, not through ConfigService.

## Tests

Unit specs cover the auth use cases, the user/session models, position math, the hierarchy use cases (space/project/page specs), the comment use cases and `RoomManagerService` (with `test/fakes/fake-redis-client.ts`). The only e2e test is `/api/health` (it boots the whole `AppModule`).

TypeORM entities: every `@ManyToOne`/`@OneToOne` needs an explicit `@JoinColumn({ name: '<snake>_id' })`. Without it TypeORM adds its own camelCase FK column, which the hand-written migrations don't have.

## Production

`Dockerfile`: a node:22 build stage, then a runtime with prod deps + `dist/`. CMD runs `typeorm migration:run -d dist/infrastructure/database/data-source.js`, then `node dist/main`. `data-source.ts` must keep **exactly one** export (the CLI rejects more), and `tsconfig.build.json` keeps `declaration: false` (otherwise `.d.ts` files land in `dist/.../migrations` and match the migrations glob). `trust proxy` is on (Caddy in front). Compose and env: see `../CLAUDE.md` → Production.
