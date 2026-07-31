# Local infrastructure

Local development dependencies live in this directory. The application processes still run
directly on the host through pnpm; Docker Compose only manages infrastructure services.

## PostgreSQL and Redis

Create the shared local environment file before starting the service:

```bash
cp env/.env.example env/.env
```

Host applications and Docker Compose both read `env/.env`, keeping database, Redis, and SMTP
configuration in one place:

`TRUST_PROXY_HOPS` must match the number of trusted reverse-proxy hops in front of the server.
Keep the default `0` when clients can connect to the server directly. Set it to `1` only when the
server is reachable exclusively through one trusted reverse proxy, including a trusted Vite proxy.

```bash
pnpm infra:up
```

Useful commands:

```bash
pnpm infra:status
pnpm infra:logs
pnpm infra:down
pnpm db:migrate
```

PostgreSQL migrations are stored in `infra/postgres/migrations/` and applied in filename order.

With the default configuration, host applications connect with:

```text
postgresql://ai_design:ai_design_password@localhost:5432/ai_design
redis://ai_design:ai_design_redis_password@localhost:6379
```

The Redis ACL user can access keys under the `ai-design:*` prefix. Override
`REDIS_USERNAME` and `REDIS_PASSWORD` in `env/.env`; use a long random password without
whitespace in shared environments.

`pnpm infra:down` removes the containers and network but preserves the PostgreSQL and Redis named
volumes. To deliberately delete all local infrastructure data, run:

```bash
docker compose --env-file env/.env -f infra/compose.yaml down --volumes
```
