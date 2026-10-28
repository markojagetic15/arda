# Arda

Real-time collaborative workspace (Notion + Miro + Trello). See `CLAUDE.md`
for the full product/tech spec.

## Structure

```
frontend/   React + TypeScript + Vite, Feature-Sliced Design
backend/    NestJS + TypeScript, Domain-Driven Design
docker-compose.yml   Postgres + Redis for local development
```

## Getting started

```bash
cp .env.example .env               # Postgres/Redis credentials for docker compose
docker compose up -d               # starts Postgres + Redis

cp backend/.env.example backend/.env
cd backend && npm install && npm run start:dev

cp frontend/.env.example frontend/.env
cd frontend && npm install && npm run dev
```

## Frontend (`frontend/`)

- **Stack:** React 19, TypeScript, Vite, HeroUI, Tailwind CSS v4, TanStack Query, React Hook Form + Yup.
- **Architecture:** Feature-Sliced Design — `app/`, `processes/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`. See each slice's `README.md`.
- `npm run dev` / `build` / `lint` / `format` / `typecheck`.

## Backend (`backend/`)

- **Stack:** NestJS, TypeScript, TypeORM + PostgreSQL, Redis (ioredis).
- **Architecture:** Domain-Driven Design — `domain/`, `application/`, `infrastructure/`, `interface/` under `src/`. See each layer's `README.md`.
- `npm run start:dev` / `build` / `lint` / `test`.
- Migrations: `npm run migration:generate -- src/infrastructure/database/migrations/<Name>`, `npm run migration:run`, `npm run migration:revert`.
