SELECT f.id, f.original_name, f.storage_key, f.created_at,
       a.id as attachment_id, a.entity_type, a.entity_id
FROM files f
LEFT JOIN attachments a ON f.id = a.file_id
ORDER BY f.created_at DESC
LIMIT 5;
