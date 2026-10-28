# proarda frontend

React 19 · Vite 8 · TypeScript 6 · HeroUI 3 + Tailwind CSS 4 · TanStack Query 5 · React Router 7 · React Hook Form + Yup · Tiptap 3 · Excalidraw 0.18 · dnd-kit · Yjs + y-protocols · socket.io-client · lucide-react icons · Fontsource fonts. Project-wide context: [`../CLAUDE.md`](../CLAUDE.md). Backend contract: [`../backend/CLAUDE.md`](../backend/CLAUDE.md).

```bash
npm run dev          # :5173
npm run build        # tsc -b && vite build
npm run typecheck / lint / format
```

Env: `VITE_API_URL` (default `http://localhost:3000/api`), `VITE_WS_URL` (default `ws://localhost:3000`), `VITE_MOCK_AUTH=true` for the in-memory backend.

## Design system

- Brand: **proarda** (always lowercase). Logo mark + wordmark in `shared/ui/logo.tsx`, the same SVG as `public/favicon.svg`.
- `app/styles/index.css`: overrides HeroUI's CSS variables (`--accent`, `--background`, `--surface*`, `--border`, ...) for light and `.dark`, so every HeroUI component and every Tailwind `bg-accent`/`text-muted`/`border-border` class follows the brand. Fonts: Inter (UI), Plus Jakarta Sans (`.font-display`, headings). Helpers: `.brand-gradient`, `.text-gradient`, `.bg-grid`, `.app-shadow(-lg)`, `.scroll-thin`, `animate-rise`/`animate-fade-in`.
- Dark mode is the `.dark` class on `<html>` (set before paint in `index.html`, key `proarda-theme-preference`). A custom `dark` variant replaces HeroUI's, which also matched the OS setting when the user picked light.
- Icons: `lucide-react` everywhere.
- Copy style: single hyphens (" - "), never em/en dashes.

## Feature-Sliced Design (`src/`)

Imports only flow downwards: `app → pages → widgets → features → entities → shared`. Each slice exposes a public `index.ts`; import from that, not deep paths. `@/` → `src/`. Keep non-component exports out of `.tsx` component files (react-refresh lint).

| Slice | What's there |
|---|---|
| `app/` | Providers (ErrorBoundary → Theme → Query → Router → Auth), router + guards, global CSS |
| `pages/` | `home` (landing + `app-mockup`), `login`, `register`, `forgot-password`, `reset-password`, `profile` (settings), `workspace` (shell + `workspace-home` dashboard) |
| `widgets/` | `app-sidebar` (logo, search, home, tree, user menu), `sidebar-tree`, `page-header` (breadcrumbs + inline rename), `command-palette`, `document-page`, `text-editor`, `canvas-board` (Excalidraw, lazy-loaded), `kanban-board`, `comment-thread`, `page-collaboration` (presence avatars, status pill, `usePresenceUsers`) |
| `features/` | `auth/*`, `hierarchy-tree` (tree query + mutations, `useCreateAndOpen`, context menu, add-page menu, dialogs), `profile/update-profile`, `profile/change-password` |
| `entities/` | `session`, `user` (API, `UserAvatar`, `initials`), `hierarchy-node` (types, API, `PAGE_TYPES` meta, `NodeGlyph`, `getAncestry`) |
| `shared/` | `api/` (http client, token store, mock backend, `errorMessage`), `lib/collaboration`, `lib/comments`, `lib/form`, `lib/theme`, `lib/storage` (safe localStorage, recent pages), `lib/command-palette` (open/close store), `lib/workspace-layout`, `lib/password` (strength), `lib/id` (`uid()`), `ui/` (logo, auth layout, form field, form alert, strength meter, theme toggle) |

## Routes

`/` landing · `/login` `/register` `/forgot-password` `/reset-password?token=` (guest only; logged-in users go to `/workspace`) · `/profile` · `/workspace` (home dashboard / first-run welcome) and `/workspace/:pageId` (auth). The editor for the page's `pageType` renders with `key={pageId}` so each page gets a fresh connection. Unknown page ids show a "doesn't exist" state.

## Auth & HTTP

- The access token lives **only in memory** (`shared/api/auth-token-store.ts`). On boot, `AuthProvider` calls `POST /auth/refresh` (httpOnly cookie), then `GET /users/me`.
- `shared/api/http-client.ts`: JSON fetch, Bearer header, one deduplicated silent refresh + retry on a 401 from a non-`/auth/` path. `refreshAccessToken` is exported (the socket uses it too).
- Forms: `useAppForm` (RHF + Yup) + `shared/ui/form-field.tsx` (password show/hide, `labelAction`, render-prop slot under the input). Errors through `errorMessage()` + `FormAlert`.
- Register has no "confirm password"; it shows a strength meter instead.

## Workspace shell

- Sidebar is 272px, collapsible (remembered), an overlay on phones. Tree rows: whole row draggable (dnd-kit, 4px activation), double-click to rename, hover actions (`...` menu, `+` to add a typed page / new project). Collapsed node ids are kept in localStorage.
- `useCreateAndOpen` creates and navigates: a new page opens itself, a new project opens its document, and a new space also gets a first project.
- Ctrl/Cmd+K command palette: pages (recent first) plus create/navigate/theme actions.
- Recent pages: `shared/lib/storage/recent-pages.ts` (localStorage, per browser).

## Sharing, roles and links

- Every tree node carries the user's `role` (`entities/hierarchy-node`: `hasRole`, `ROLE_OPTIONS`, `roleLabel`; a missing role counts as `full`, e.g. the mock backend). UI gates on it: tree actions/drag only with `edit`, delete space with `full`; document/canvas/Kanban read-only below `edit` (Tiptap `editable`, Excalidraw `viewModeEnabled`, Kanban dialog fieldsets); comment composers need `comment`.
- `widgets/share-dialog` (opened anywhere via `shareDialog.open({type, id})` from `shared/lib/share-dialog`), `entities/sharing` (API + types), pages `/invite/:token` and `/verify-email`, `widgets/email-verification-banner`. Login/register honour `location.state.from` (back to the invite) and `?email=`.
- Sidebar: `flattenTree` returns `{ spaces, shared }`; nodes whose parent isn't visible go under "Shared with me". Drag and drop uses plain `useDraggable`/`useDroppable` (no sortable shifting) with `pointerWithin`; the before/inside/after indicator is recomputed in `onDragMove` from the pointer position.
- Page links: `pageUrl`, `parsePageLink`, `extractPageLinks` (`entities/hierarchy-node/lib/links.ts`), `PageLinkChip` (features/hierarchy-tree; live title, "Restricted page" without access). Tiptap `PageLink` inline node (paste handler + `PageMention` `@` suggestion + "/Link to page"), Kanban description chips, canvas `onPaste` → text element with `link` and `onLinkOpen` → in-app navigation. Copy via `copyText` (`shared/lib/clipboard`, with a non-https fallback).
- Presence lives in the awareness field `presence` (`useLivePresence` → `{ me, peers, people }`): Tiptap's caret extension owns the `user` field and overwrites it with `{ name, color }`.
- Cursor colors: `CURSOR_COLORS` (12 hex colors - **must be `#RRGGBB`**: Tiptap's caret treats anything else as transparent and appends an alpha suffix for selections). `pickSessionColor` gives each person a distinct color per page (preferred color from the user id; on a clash the client with the higher awareness id moves to the next free color; a person's own tabs share one). Documents push it to the caret via `editor.commands.updateUser`. The canvas draws its own pointers/selection outlines (`canvas-cursors.tsx`) because Excalidraw's collaborator layer ignores given colors. Clicking an avatar jumps to that person's caret/pointer.

## Realtime collaboration (`shared/lib/collaboration`)

- `useCollaboration(pageId)` → `{ doc, awareness, status, synced, awarenessStates, socket }`. Doc, awareness and provider are created **inside the effect** (safe under Strict Mode). Don't move them into `useMemo`.
- **Handshake:** `CollaborationProvider` emits `join` on connect and sends **nothing** until `sync-state` arrives. Then it sends `Y.encodeStateAsUpdate(doc)` (the full local state, so offline edits and anything typed before the join are included) plus the local awareness. Local updates before that point are not queued; the full-state send covers them. Do not reintroduce early sends: one dropped update leaves every later update from that client pending forever.
- `synced` flips true after the first `sync-state`. **Seed default content only after `synced`** (Kanban columns/labels; the canvas mounts only after it); document waits up to 4 s, then renders anyway.
- The socket `auth` is a function (fresh token on every reconnect). On a token `error` it calls `refreshAccessToken` and reconnects.

## What each page type stores in the Y.Doc

| Page | Widget | Y.Doc structure |
|---|---|---|
| document | `document-page` + `text-editor` | Tiptap `Collaboration` default fragment. Extensions: StarterKit (undo/redo off; link, underline), TextStyleKit (color, background, font family, size, line height), `TextStyleExtras` (letter spacing, weight, case on the `textStyle` mark), TextAlign, multicolor Highlight, Sub/Superscript, TaskList/TaskItem, TableKit, Image + `ImageUpload` (file picker for the toolbar and "/image", paste and drop; uploads via `shared/api/uploads.ts`, progress/errors in `UploadStatusBar`), Placeholder, CharacterCount, `SlashCommand` (`/` menu), `CommentMark`, CollaborationCaret |
| canvas | `canvas-board` | `Y.Map 'excalidraw-elements'` (one Excalidraw element per key, soft-deleted ones included) + `Y.Map 'excalidraw-files'` (images). Binding in `model/excalidraw-yjs.ts`: writes elements whose `version`/`versionNonce` changed, merges remote ones with `reconcileElements` and `CaptureUpdateAction.NEVER`. **Elements are `structuredClone`d into and out of Yjs**: Excalidraw mutates elements in place, and a Y.Map returns the stored object itself. Mounted only after `synced` (content is passed once, as `initialData`). Cursors/selections via awareness `excalidrawPointer`/`excalidrawSelection`. Excalidraw's own panel handles styling. Fonts are self-hosted in production (`EXCALIDRAW_ASSET_PATH=/`, copied in the Dockerfile) |
| kanban | `kanban-board` | `Y.Map`s `kanban-columns` `{id,title,position,color}`, `kanban-cards` `{id,columnId,title,description,position,labelIds,dueDate,priority,checklist,createdAt}`, `kanban-labels` `{id,name,color}`. Defaults use **fixed IDs** (`col-todo`..., `lbl-feature`...) so concurrent first loads converge. Old cards are filled with defaults by `normalizeCard` |

Changing these keys or record shapes breaks existing saved pages: the backend stores the doc as an opaque blob.

## Text editor UI (`widgets/text-editor`)

- `model/format.ts`: `useSelectionFormat(editor)` (everything about the current selection), `BLOCK_TYPES`, `ALIGNMENTS`, `setBlockType`, `stepFontSize`. Catalogues in `model/fonts.ts` (fonts, sizes, weights, line heights, palettes).
- `ui/editor-toolbar.tsx` (top bar), `ui/format-panel.tsx` (right panel; toggle remembered), `ui/selection-bubble.tsx` (bubble menu incl. "Comment"), `ui/slash-menu.tsx`, `ui/controls.tsx` (ToolButton/ToolPopover/ColorGrid; buttons `preventDefault` on mousedown to keep the selection).
- No Typography extension on purpose: it turns `--` into em dashes.

## Comments

Documents: commented text has a `CommentMark`; `useCommentRanges` (document-page/model) lists them. Threads are reachable three ways - the badge in the right margin (positions recomputed on resize/fonts/next frame, stacked per line), clicking the highlighted text, and the header's Comments button (count of open threads) which opens `CommentsPanel` (all threads in document order, replies, resolve, resolved section, threads whose text was deleted). `useComments` emits `comments-request` once its listener is attached, because the copy sent with the join reply can arrive before the page UI mounts.

`useComments(socket)` + `CommentThreadTrigger` (popover with avatars, relative time, resolve/reopen). Anchors: text → `CommentMark` id, canvas → shape id, Kanban → card id (shown inline in the card dialog). Threads are flat; resolved state lives on the first comment.

## Style

Prettier: no semicolons, single quotes, trailing commas, width 100. ESLint flat config with react-hooks (incl. `set-state-in-effect`: use the "adjust state during render" pattern, see `document-title.tsx`) and react-refresh. Use `uid()` from `shared/lib/id`, not `crypto.randomUUID` (missing on plain http).
