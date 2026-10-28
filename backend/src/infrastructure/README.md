# infrastructure

Implementations of the ports declared in `domain` (TypeORM repositories,
Redis clients, external services) plus cross-cutting config (`config/`,
`database/`, `redis/`). Wired into `application`/`interface` via Nest DI.
