INSERT INTO business_systems (workspace_id, name, description, icon)
SELECT
  workspaces.id,
  '默认系统',
  '用于组织可视化设计项目',
  'fluent:apps-list-detail-20-regular'
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1
  FROM business_systems
  WHERE business_systems.workspace_id = workspaces.id
);

INSERT INTO schema_migrations (version) VALUES (:'migration_version');
