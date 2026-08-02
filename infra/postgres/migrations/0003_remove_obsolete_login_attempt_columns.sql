ALTER TABLE user_password_credentials
  DROP COLUMN IF EXISTS failed_attempts,
  DROP COLUMN IF EXISTS locked_until;

INSERT INTO schema_migrations (version) VALUES (:'migration_version');
