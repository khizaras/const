const { asyncHandler } = require("../../utils/asyncHandler");
const { AppError } = require("../../utils/appError");
const {
  uploadFile,
  listProjectFiles,
  downloadFile,
  deleteFileRecord,
  attachFileToEntity,
  getEntityAttachments,
  removeAttachment,
  generateSignedDownloadUrl,
  verifySignedToken,
  getFileMetadata,
} = require("./file.service");

/**
 * List project files
 * GET /api/projects/:projectId/files
 */
const listProjectFilesHandler = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 25);
  const search = req.query.search ? String(req.query.search) : undefined;

  const result = await listProjectFiles(req.project.id, {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 25,
    search,
  });

  res.json(result);
});

/**
 * Upload file
 * POST /api/projects/:projectId/files
 */
const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file provided", 400);
  }

  const file = await uploadFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    uploadedByUserId: req.user.id,
    organizationId: req.user.organizationId,
    projectId: req.project.id,
  });

  res.status(201).json(file);
});

/**
 * Download file (with optional signed URL verification)
 * GET /api/files/:fileId/download
 */
const download = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.fileId);
  const { expires, token } = req.query;

  // If signed URL params provided, verify them (allows unauthenticated access for valid tokens)
  if (expires && token) {
    if (!verifySignedToken(fileId, Number(expires), token)) {
      throw new AppError("Invalid or expired download link", 403);
    }
  } else if (!req.user) {
    // If no signed params and no authenticated user, reject
    throw new AppError("Authentication required or use signed link", 401);
  }

  const { buffer, metadata } = await downloadFile(fileId);

  res.setHeader("Content-Type", metadata.mime_type);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(metadata.original_name)}"`
  );
  res.send(buffer);
});

/**
 * Generate signed download URL
 * GET /api/files/:fileId/signed-url
 */
const signedUrl = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.fileId);
  await getFileMetadata(fileId); // ensure file exists
  const baseUrl = process.env.APP_URL || "";
  const url = generateSignedDownloadUrl(fileId, baseUrl);
  res.json({ url });
});

/**
 * Delete file
 * DELETE /api/files/:fileId
 */
const deleteFile = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.fileId);
  await deleteFileRecord(fileId, req.user.id);
  res.json({ success: true });
});

/**
 * Attach file to entity
 * POST /api/projects/:projectId/rfis/:rfiId/attachments
 */
const attachFile = asyncHandler(async (req, res) => {
  const { fileId } = req.body;
  const entityId = Number(
    req.params.rfiId ||
      req.params.issueId ||
      req.params.logId ||
      req.params.entityId
  );
  const entityType = req.params.rfiId
    ? "rfi"
    : req.params.issueId
    ? "issue"
    : req.params.logId
    ? "daily_log"
    : req.body.entityType;

  if (!fileId) {
    throw new AppError("fileId is required", 400);
  }

  const attachment = await attachFileToEntity({
    fileId,
    entityType,
    entityId,
    attachedByUserId: req.user.id,
  });

  res.status(201).json(attachment);
});

/**
 * Get entity attachments
 * GET /api/projects/:projectId/rfis/:rfiId/attachments
 */
const listAttachments = asyncHandler(async (req, res) => {
  const entityId = Number(
    req.params.rfiId ||
      req.params.issueId ||
      req.params.logId ||
      req.params.entityId
  );
  const entityType = req.params.rfiId
    ? "rfi"
    : req.params.issueId
    ? "issue"
    : req.params.logId
    ? "daily_log"
    : req.query.entityType;

  const attachments = await getEntityAttachments(entityType, entityId);
  res.json({ data: attachments });
});

/**
 * Remove attachment
 * DELETE /api/projects/:projectId/rfis/:rfiId/attachments/:attachmentId
 */
const removeAttachmentHandler = asyncHandler(async (req, res) => {
  const attachmentId = Number(req.params.attachmentId);
  await removeAttachment(attachmentId, req.user.id);
  res.json({ success: true });
});

module.exports = {
  listProjectFiles: listProjectFilesHandler,
  upload,
  download,
  signedUrl,
  deleteFile,
  attachFile,
  listAttachments,
  removeAttachmentHandler,
};
