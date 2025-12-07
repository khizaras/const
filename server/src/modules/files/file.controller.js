const { asyncHandler } = require("../../utils/asyncHandler");
const { AppError } = require("../../utils/appError");
const {
  uploadFile,
  downloadFile,
  deleteFileRecord,
  attachFileToEntity,
  getEntityAttachments,
  removeAttachment,
} = require("./file.service");

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
 * Download file
 * GET /api/files/:fileId/download
 */
const download = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.fileId);
  const { buffer, metadata } = await downloadFile(fileId);

  res.setHeader("Content-Type", metadata.mime_type);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(metadata.original_name)}"`
  );
  res.send(buffer);
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
    req.params.rfiId || req.params.issueId || req.params.entityId
  );
  const entityType = req.params.rfiId
    ? "rfi"
    : req.params.issueId
    ? "issue"
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
    req.params.rfiId || req.params.issueId || req.params.entityId
  );
  const entityType = req.params.rfiId
    ? "rfi"
    : req.params.issueId
    ? "issue"
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
  upload,
  download,
  deleteFile,
  attachFile,
  listAttachments,
  removeAttachmentHandler,
};
