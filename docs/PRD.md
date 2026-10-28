# Product Requirements Document (PRD) & Tech Stack Architecture

## Application Concept
A unified workspace combining Notion-style documents, Miro-style interactive canvases, and Trello-style Kanban task boards.
**Core Requirement:** Full real-time live collaboration across all three editors (Text Editor, Canvas, and Task Board) and tree navigation structure.

---

## Tech Stack & Architecture Standards

### Front-End:
- **Framework & Build:** React + TypeScript + Vite
- **Architecture:** Feature-Sliced Design (FSD) (`app/`, `processes/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`)
- **UI Components & Styling:** HeroUI (https://heroui.com/) + Tailwind CSS
- **Data Fetching & Caching:** TanStack Query (React Query)
- **Form Management & Validation:** React Hook Form + Yup
- **Code Quality:** ESLint + Prettier
- **Live Collaboration Engines:**
    - Yjs (CRDT core for real-time state synchronization)
    - Y-WebRTC / Y-WebSocket for transport
    - Tiptap with `@tiptap/extension-collaboration` & `@tiptap/extension-collaboration-cursor` (Text Editor)
    - Tldraw or React Flow with Yjs binding (Canvas)

### Back-End:
- **Framework:** NestJS + TypeScript
- **Architecture:** Domain-Driven Design (DDD) layered architecture (Domain, Application, Infrastructure, Interface)
- **ORM & Database:** TypeORM + PostgreSQL (Primary Relational Store) + Redis (Pub/Sub & Websocket Gateway Scaling / Caching)
- **Real-Time Communication:** NestJS WebSockets (`@nestjs/websockets` / Socket.io or native WebSockets for Yjs provider)

---

## Core Functional Requirements

### 1. Authentication & User Management
- User Registration, Login, Password Reset, Profile Management.
- Real-time multiplayer presence (showing active user avatars, cursor positions, and current active status per workspace).

### 2. Data Hierarchy & Structure
- **Landing Page:** Public promotional page for non-authenticated users.
- **Spaces:** Top-level containers owned by users or teams.
- **Projects:** Groupings inside Spaces.
- **Pages:** Individual documents inside Projects.
- **Default Pages:** Every newly created Project automatically initializes with 3 default collaborative pages:
    1. Collaborative Rich Text Editor
    2. Collaborative Infinite Canvas
    3. Collaborative Task Manager (Kanban)
- **Nested Tree Navigation:** Unlimited nesting depth for Pages and Sub-pages.

### 3. Left Navigation Sidebar
- Tree view rendering Space -> Project -> Page hierarchy.
- Smooth Drag-and-Drop tree reordering (optimistic updates via TanStack Query, saved back to NestJS backend).
- Complete CRUD operations: Create, Rename, Delete, Duplicate, Move to another Space/Project.

### 4. Main Collaborative Workspace
- **Central Area:**
    - **Text Editor:** Rich text editing built on Tiptap + Yjs, showing live multi-user cursors, highlights, and formatting.
    - **Canvas:** Infinite whiteboard built on Tldraw/React Flow + Yjs, supporting freehand drawing, shapes, arrows, connectors, and real-time multiplayer cursors.
    - **Task Manager:** Kanban board supporting custom columns, drag-and-drop cards, custom labels, and live task status synchronization across clients.
- **Contextual Right Sidebar:**
    - Context-aware panel that changes dynamically depending on the active page tool and selected element (e.g., text formatting options for selected headings, style/color pickers for selected canvas nodes/shapes).

### 5. Universal Live Commenting System
- Ability to attach threadable comments to any entity:
    - Text selection in Editor
    - Nodes/shapes on Canvas
    - Task cards in Kanban
- Visual indicator (collapsible floating badge/icon) showing comment count and active status with expand-to-thread popover.

---

## Phased Implementation Roadmap

Follow these 8 steps sequentially to construct the project without context overload.
_(The 8 roadmap steps were never written down - this section ends here in the original.)_
