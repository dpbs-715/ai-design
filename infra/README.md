# Local infrastructure

Local development dependencies live in this directory. The application processes still run
directly on the host through pnpm; Docker Compose only manages infrastructure services.

## PostgreSQL and Redis

Optionally copy the environment template before starting the service:

```bash
cp infra/.env.example infra/.env
```

The Compose file also provides development defaults, so PostgreSQL and Redis can be started without
a local `.env` file:

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
`REDIS_USERNAME` and `REDIS_PASSWORD` in `infra/.env`; use a long random password without
whitespace in shared environments.

`pnpm infra:down` removes the containers and network but preserves the PostgreSQL and Redis named
volumes. To deliberately delete all local infrastructure data, run:

```bash
docker compose -f infra/compose.yaml down --volumes
```
