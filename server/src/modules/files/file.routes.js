const express = require("express");
const multer = require("multer");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const {
  upload,
  listProjectFiles,
  download,
  deleteFile,
  attachFile,
  listAttachments,
  removeAttachmentHandler,
} = require("./file.controller");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const multerUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-dwg", // AutoCAD
      "image/vnd.dwg",
    ];

    if (
      allowedMimes.includes(file.mimetype) ||
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

// Global file routes (download, delete)
const fileRouter = express.Router();
const { requireAuth } = require("../../middleware/auth");
fileRouter.use(requireAuth);
fileRouter.get("/:fileId/download", download);
fileRouter.delete("/:fileId", deleteFile);

module.exports = {
  projectFileRouter,
  rfiAttachmentRouter,
  issueAttachmentRouter,
  dailyLogAttachmentRouter,
  fileRouter,
};
