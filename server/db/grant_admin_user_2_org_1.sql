-- Grant project admin to user_id=2 for ALL projects in organization_id=1

INSERT INTO project_users (project_id, user_id, role)
SELECT p.id, 2, 'admin'
FROM projects p
WHERE p.organization_id = 1
ON DUPLICATE KEY UPDATE role = VALUES(role);
