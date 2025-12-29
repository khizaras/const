const express = require("express");
const multer = require("multer");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const {
  upload,
  listProjectFiles,
  download,
  signedUrl,
  deleteFile,
  attachFile,
  listAttachments,
  removeAttachmentHandler,
} = require("./file.controller");
const {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} = require("../../services/fileStorage");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Use shared allowed MIME types
    if (
      ALLOWED_MIME_TYPES.has(file.mimetype) ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Project-scoped file routes
const projectFileRouter = express.Router({ mergeParams: true });
projectFileRouter.use(requireProjectAccess);
projectFileRouter.get("/", listProjectFiles);
projectFileRouter.post("/", multerUpload.single("file"), upload);

// RFI attachment routes
const rfiAttachmentRouter = express.Router({ mergeParams: true });
rfiAttachmentRouter.use(requireProjectAccess);
rfiAttachmentRouter.get("/", listAttachments);
rfiAttachmentRouter.post("/", attachFile);
rfiAttachmentRouter.delete("/:attachmentId", removeAttachmentHandler);

// Issue attachment routes
const issueAttachmentRouter = express.Router({ mergeParams: true });
issueAttachmentRouter.use(requireProjectAccess);
issueAttachmentRouter.get("/", listAttachments);
issueAttachmentRouter.post("/", attachFile);
issueAttachmentRouter.delete("/:attachmentId", removeAttachmentHandler);

// Daily log attachment routes
const dailyLogAttachmentRouter = express.Router({ mergeParams: true });
dailyLogAttachmentRouter.use(requireProjectAccess);
dailyLogAttachmentRouter.get("/", listAttachments);
dailyLogAttachmentRouter.post("/", attachFile);
dailyLogAttachmentRouter.delete("/:attachmentId", removeAttachmentHandler);

// Global file routes (download, signed URL, delete)
const fileRouter = express.Router();
const { requireAuth } = require("../../middleware/auth");
// Download allows either signed token (public) or auth
fileRouter.get(
  "/:fileId/download",
  (req, res, next) => {
    if (req.query.token) return next(); // public signed access
    return requireAuth(req, res, next);
  },
  download
);
// Signed URL generation requires auth
fileRouter.get("/:fileId/signed-url", requireAuth, signedUrl);
fileRouter.delete("/:fileId", requireAuth, deleteFile);

module.exports = {
  projectFileRouter,
  rfiAttachmentRouter,
  issueAttachmentRouter,
  dailyLogAttachmentRouter,
  fileRouter,
};
