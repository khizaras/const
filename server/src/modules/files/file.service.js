const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");
const {
  storeFile,
  getFile,
  deleteFile,
} = require("../../services/fileStorage");

/**
 * Upload file and store metadata in database
 */
async function uploadFile({
  buffer,
  originalName,
  mimetype,
  uploadedByUserId,
  organizationId,
  projectId = null,
}) {
  // Store file physically
  const { storageKey, sizeBytes, sha256 } = await storeFile(
    buffer,
    originalName,
    mimetype
  );

  // Store metadata in database
  const [result] = await pool.execute(
    `INSERT INTO files (organization_id, project_id, storage_key, original_name, mime_type, size_bytes, sha256, uploaded_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      organizationId,
      projectId,
      storageKey,
      originalName,
      mimetype,
      sizeBytes,
      sha256,
      uploadedByUserId,
    ]
  );

  return {
    id: result.insertId,
    storageKey,
    originalName,
    mimetype,
    sizeBytes,
    sha256,
  };
}

/**
 * List files for a project
 */
async function listProjectFiles(
  projectId,
  { page = 1, pageSize = 25, search } = {}
) {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const where = ["f.project_id = ?"];
  const params = [projectId];

  if (search) {
    where.push("(f.original_name LIKE ? OR f.mime_type LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [rows] = await pool.execute(
    `SELECT f.id, f.project_id, f.original_name, f.mime_type, f.size_bytes, f.created_at,
            u.first_name AS uploaded_by_first_name, u.last_name AS uploaded_by_last_name
     FROM files f
     LEFT JOIN users u ON u.id = f.uploaded_by_user_id
     ${whereSql}
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM files f ${whereSql}`,
    params
  );

  return {
    data: rows,
    meta: {
      total: countRow.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRow.total / pageSize) || 1,
    },
  };
}

/**
 * Get file metadata from database
 */
async function getFileMetadata(fileId) {
  const [rows] = await pool.execute(
    `SELECT id, organization_id, project_id, storage_key, original_name, mime_type, size_bytes, sha256, uploaded_by_user_id, created_at
     FROM files WHERE id = ? LIMIT 1`,
    [fileId]
  );

  if (!rows.length) {
    throw new AppError("File not found", 404);
  }

  return rows[0];
}

/**
 * Download file
 */
async function downloadFile(fileId) {
  const metadata = await getFileMetadata(fileId);
  const buffer = await getFile(metadata.storage_key);

  return {
    buffer,
    metadata,
  };
}

/**
 * Delete file (soft delete - remove from DB but keep file)
 */
async function deleteFileRecord(fileId, userId) {
  const metadata = await getFileMetadata(fileId);

  // Delete from database
  await pool.execute("DELETE FROM files WHERE id = ?", [fileId]);

  // Optionally delete physical file (uncomment if desired)
  // await deleteFile(metadata.storage_key);

  return { success: true };
}

/**
 * Attach file to an entity (RFI, Issue, etc.)
 */
async function attachFileToEntity({
  fileId,
  entityType,
  entityId,
  attachedByUserId,
}) {
  // Verify file exists
  await getFileMetadata(fileId);

  const [result] = await pool.execute(
    `INSERT INTO attachments (entity_type, entity_id, file_id, attached_by_user_id)
     VALUES (?, ?, ?, ?)`,
    [entityType, entityId, fileId, attachedByUserId]
  );

  return {
    id: result.insertId,
    fileId,
    entityType,
    entityId,
  };
}

/**
 * Get attachments for an entity
 */
async function getEntityAttachments(entityType, entityId) {
  const [rows] = await pool.execute(
    `SELECT a.id as attachment_id, a.created_at as attached_at,
            f.id as file_id, f.storage_key, f.original_name, f.mime_type, f.size_bytes,
            u.first_name, u.last_name
     FROM attachments a
     JOIN files f ON a.file_id = f.id
     LEFT JOIN users u ON a.attached_by_user_id = u.id
     WHERE a.entity_type = ? AND a.entity_id = ?
     ORDER BY a.created_at DESC`,
    [entityType, entityId]
  );

  return rows;
}

/**
 * Remove attachment
 */
async function removeAttachment(attachmentId, userId) {
  await pool.execute("DELETE FROM attachments WHERE id = ?", [attachmentId]);
  return { success: true };
}

module.exports = {
  uploadFile,
  listProjectFiles,
  getFileMetadata,
  downloadFile,
  deleteFileRecord,
  attachFileToEntity,
  getEntityAttachments,
  removeAttachment,
};
