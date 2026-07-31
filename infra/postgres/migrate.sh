#!/bin/sh

set -eu

migration_dir=/opt/ai-design/postgres/migrations

run_psql() {
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

run_psql -c "
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  );
"

for migration in "$migration_dir"/*.sql; do
  [ -f "$migration" ] || continue

  version="$(basename "$migration" .sql)"
  case "$version" in
    *[!a-zA-Z0-9_.-]*)
      echo "Invalid migration version: $version" >&2
      exit 1
      ;;
  esac

  applied="$(run_psql -Atc "SELECT 1 FROM schema_migrations WHERE version = '$version'")"
  if [ "$applied" = "1" ]; then
    echo "Already applied: $version"
    continue
  fi

  echo "Applying: $version"
  run_psql \
    --single-transaction \
    --set=migration_version="$version" \
    --file="$migration"
done
