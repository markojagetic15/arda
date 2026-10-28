# Arda backend

NestJS + TypeORM (PostgreSQL) + Redis + Socket.io/Yjs API for Arda. The REST API is served under `/api`, and realtime collaboration runs on the socket.io namespace `/collaboration`.

```bash
cp .env.example .env          # Postgres/Redis from the root docker-compose.yml
npm install
npm run migration:run
npm run start:dev             # http://localhost:3000/api/health
npm test                      # unit tests; npm run test:e2e needs Postgres + Redis
```

Architecture, API contract, socket protocol, schema and known issues: see [`CLAUDE.md`](CLAUDE.md).
