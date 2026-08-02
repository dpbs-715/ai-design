ALTER TABLE projects ADD COLUMN deleted_at timestamptz;
ALTER TABLE pages ADD COLUMN deleted_at timestamptz;
ALTER TABLE public_modules ADD COLUMN deleted_at timestamptz;

DROP INDEX projects_system_updated_idx;
DROP INDEX pages_project_updated_idx;
DROP INDEX public_modules_project_updated_idx;

CREATE INDEX projects_workspace_active_updated_idx
  ON projects (workspace_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX projects_workspace_trash_idx
  ON projects (workspace_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX pages_project_active_updated_idx
  ON pages (project_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX pages_project_trash_idx
  ON pages (project_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX public_modules_project_active_updated_idx
  ON public_modules (project_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX public_modules_project_trash_idx
  ON public_modules (project_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

INSERT INTO schema_migrations (version) VALUES (:'migration_version');
