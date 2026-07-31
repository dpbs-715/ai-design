CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_not_blank CHECK (btrim(email) <> ''),
  CONSTRAINT users_display_name_not_blank CHECK (btrim(display_name) <> ''),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX users_email_uq ON users (lower(email));

CREATE TABLE user_password_credentials (
  user_id uuid PRIMARY KEY,
  password_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_password_credentials_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT user_password_credentials_hash_not_blank CHECK (btrim(password_hash) <> ''),
  CONSTRAINT user_password_credentials_failed_attempts_check CHECK (failed_attempts >= 0)
);

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE workspace_members (
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id),
  CONSTRAINT workspace_members_workspace_fk
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id)
    ON DELETE CASCADE,
  CONSTRAINT workspace_members_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT workspace_members_role_check
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer'))
);

CREATE INDEX workspace_members_user_idx ON workspace_members (user_id, workspace_id);

CREATE TABLE business_systems (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_systems_workspace_fk
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id)
    ON DELETE CASCADE,
  CONSTRAINT business_systems_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT business_systems_icon_not_blank CHECK (btrim(icon) <> ''),
  CONSTRAINT business_systems_workspace_name_uq UNIQUE (workspace_id, name),
  CONSTRAINT business_systems_workspace_id_uq UNIQUE (workspace_id, id)
);

CREATE INDEX business_systems_workspace_sort_idx
  ON business_systems (workspace_id, sort_order, created_at);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  workspace_id uuid NOT NULL,
  system_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_system_fk
    FOREIGN KEY (workspace_id, system_id)
    REFERENCES business_systems (workspace_id, id)
    ON DELETE CASCADE,
  CONSTRAINT projects_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT projects_workspace_id_uq UNIQUE (workspace_id, id)
);

CREATE INDEX projects_system_updated_idx ON projects (system_id, updated_at DESC);

CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  project_id uuid NOT NULL,
  draft_schema jsonb NOT NULL,
  name text GENERATED ALWAYS AS (draft_schema #>> '{root,name}') STORED NOT NULL,
  schema_version integer
    GENERATED ALWAYS AS ((draft_schema ->> 'schemaVersion')::integer) STORED NOT NULL,
  revision bigint NOT NULL DEFAULT 1,
  published_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pages_project_fk
    FOREIGN KEY (project_id)
    REFERENCES projects (id)
    ON DELETE CASCADE,
  CONSTRAINT pages_project_id_uq UNIQUE (project_id, id),
  CONSTRAINT pages_schema_object_check CHECK (jsonb_typeof(draft_schema) = 'object'),
  CONSTRAINT pages_schema_id_check
    CHECK ((draft_schema ->> 'id') IS NOT DISTINCT FROM id::text),
  CONSTRAINT pages_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT pages_revision_check CHECK (revision > 0)
);

CREATE INDEX pages_project_updated_idx ON pages (project_id, updated_at DESC);

CREATE TABLE page_versions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  project_id uuid NOT NULL,
  page_id uuid NOT NULL,
  version_no integer NOT NULL,
  schema jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_versions_page_fk
    FOREIGN KEY (project_id, page_id)
    REFERENCES pages (project_id, id)
    ON DELETE CASCADE,
  CONSTRAINT page_versions_version_check CHECK (version_no > 0),
  CONSTRAINT page_versions_schema_object_check CHECK (jsonb_typeof(schema) = 'object'),
  CONSTRAINT page_versions_schema_id_check
    CHECK ((schema ->> 'id') IS NOT DISTINCT FROM page_id::text),
  CONSTRAINT page_versions_page_version_uq UNIQUE (page_id, version_no),
  CONSTRAINT page_versions_page_id_uq UNIQUE (page_id, id),
  CONSTRAINT page_versions_project_id_uq UNIQUE (project_id, id)
);

CREATE INDEX page_versions_page_version_idx
  ON page_versions (page_id, version_no DESC);

ALTER TABLE pages
  ADD CONSTRAINT pages_published_version_fk
  FOREIGN KEY (id, published_version_id)
  REFERENCES page_versions (page_id, id)
  DEFERRABLE INITIALLY IMMEDIATE;

CREATE TABLE public_modules (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  project_id uuid NOT NULL,
  draft_schema jsonb NOT NULL,
  name text GENERATED ALWAYS AS (draft_schema #>> '{root,name}') STORED NOT NULL,
  schema_version integer
    GENERATED ALWAYS AS ((draft_schema ->> 'schemaVersion')::integer) STORED NOT NULL,
  revision bigint NOT NULL DEFAULT 1,
  published_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_modules_project_fk
    FOREIGN KEY (project_id)
    REFERENCES projects (id)
    ON DELETE CASCADE,
  CONSTRAINT public_modules_project_id_uq UNIQUE (project_id, id),
  CONSTRAINT public_modules_schema_object_check CHECK (jsonb_typeof(draft_schema) = 'object'),
  CONSTRAINT public_modules_schema_id_check
    CHECK ((draft_schema ->> 'moduleId') IS NOT DISTINCT FROM id::text),
  CONSTRAINT public_modules_schema_kind_check
    CHECK ((draft_schema ->> 'kind') IS NOT DISTINCT FROM 'public-module'),
  CONSTRAINT public_modules_schema_draft_check
    CHECK ((draft_schema ->> 'version') IS NOT DISTINCT FROM 'draft'),
  CONSTRAINT public_modules_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT public_modules_revision_check CHECK (revision > 0)
);

CREATE INDEX public_modules_project_updated_idx
  ON public_modules (project_id, updated_at DESC);

CREATE TABLE public_module_versions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  project_id uuid NOT NULL,
  module_id uuid NOT NULL,
  version_no integer NOT NULL,
  schema jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_module_versions_module_fk
    FOREIGN KEY (project_id, module_id)
    REFERENCES public_modules (project_id, id)
    ON DELETE CASCADE,
  CONSTRAINT public_module_versions_version_check CHECK (version_no > 0),
  CONSTRAINT public_module_versions_schema_object_check CHECK (jsonb_typeof(schema) = 'object'),
  CONSTRAINT public_module_versions_schema_id_check
    CHECK ((schema ->> 'moduleId') IS NOT DISTINCT FROM module_id::text),
  CONSTRAINT public_module_versions_schema_kind_check
    CHECK ((schema ->> 'kind') IS NOT DISTINCT FROM 'public-module'),
  CONSTRAINT public_module_versions_schema_version_check
    CHECK ((schema ->> 'version') IS NOT DISTINCT FROM ('v' || version_no::text)),
  CONSTRAINT public_module_versions_module_version_uq UNIQUE (module_id, version_no),
  CONSTRAINT public_module_versions_module_id_uq UNIQUE (module_id, id),
  CONSTRAINT public_module_versions_project_id_uq UNIQUE (project_id, id)
);

CREATE INDEX public_module_versions_module_version_idx
  ON public_module_versions (module_id, version_no DESC);

ALTER TABLE public_modules
  ADD CONSTRAINT public_modules_published_version_fk
  FOREIGN KEY (id, published_version_id)
  REFERENCES public_module_versions (module_id, id)
  DEFERRABLE INITIALLY IMMEDIATE;

CREATE TABLE module_references (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  project_id uuid NOT NULL,
  owner_page_id uuid,
  owner_page_version_id uuid,
  owner_module_id uuid,
  owner_module_version_id uuid,
  node_id text NOT NULL,
  referenced_module_id uuid NOT NULL,
  referenced_version_no integer NOT NULL,
  update_policy text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT module_references_single_owner_check
    CHECK (
      num_nonnulls(
        owner_page_id,
        owner_page_version_id,
        owner_module_id,
        owner_module_version_id
      ) = 1
    ),
  CONSTRAINT module_references_node_id_not_blank CHECK (btrim(node_id) <> ''),
  CONSTRAINT module_references_update_policy_check
    CHECK (update_policy IN ('manual', 'latest')),
  CONSTRAINT module_references_page_owner_fk
    FOREIGN KEY (project_id, owner_page_id)
    REFERENCES pages (project_id, id)
    ON DELETE CASCADE,
  CONSTRAINT module_references_page_version_owner_fk
    FOREIGN KEY (project_id, owner_page_version_id)
    REFERENCES page_versions (project_id, id)
    ON DELETE CASCADE,
  CONSTRAINT module_references_module_owner_fk
    FOREIGN KEY (project_id, owner_module_id)
    REFERENCES public_modules (project_id, id)
    ON DELETE CASCADE,
  CONSTRAINT module_references_module_version_owner_fk
    FOREIGN KEY (project_id, owner_module_version_id)
    REFERENCES public_module_versions (project_id, id)
    ON DELETE CASCADE,
  CONSTRAINT module_references_target_module_fk
    FOREIGN KEY (project_id, referenced_module_id)
    REFERENCES public_modules (project_id, id)
    DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT module_references_target_version_fk
    FOREIGN KEY (referenced_module_id, referenced_version_no)
    REFERENCES public_module_versions (module_id, version_no)
    DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX module_references_page_draft_node_uq
  ON module_references (owner_page_id, node_id)
  WHERE owner_page_id IS NOT NULL;

CREATE UNIQUE INDEX module_references_page_version_node_uq
  ON module_references (owner_page_version_id, node_id)
  WHERE owner_page_version_id IS NOT NULL;

CREATE UNIQUE INDEX module_references_module_draft_node_uq
  ON module_references (owner_module_id, node_id)
  WHERE owner_module_id IS NOT NULL;

CREATE UNIQUE INDEX module_references_module_version_node_uq
  ON module_references (owner_module_version_id, node_id)
  WHERE owner_module_version_id IS NOT NULL;

CREATE INDEX module_references_target_idx
  ON module_references (referenced_module_id, referenced_version_no);

CREATE TABLE user_project_preferences (
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  last_opened_at timestamptz,
  last_edited_page_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id, project_id),
  CONSTRAINT user_project_preferences_member_fk
    FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_members (workspace_id, user_id)
    ON DELETE CASCADE,
  CONSTRAINT user_project_preferences_project_fk
    FOREIGN KEY (workspace_id, project_id)
    REFERENCES projects (workspace_id, id)
    ON DELETE CASCADE,
  CONSTRAINT user_project_preferences_last_page_fk
    FOREIGN KEY (project_id, last_edited_page_id)
    REFERENCES pages (project_id, id)
    ON DELETE SET NULL (last_edited_page_id)
);

CREATE INDEX user_project_preferences_recent_idx
  ON user_project_preferences (user_id, last_opened_at DESC);

CREATE INDEX user_project_preferences_favorite_idx
  ON user_project_preferences (user_id, is_favorite)
  WHERE is_favorite = true;

INSERT INTO schema_migrations (version) VALUES (:'migration_version');
