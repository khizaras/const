const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

/**
 * File Storage Service
 * Supports local filesystem storage (production can use S3)
 */

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");

// File size limits
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50 MB default

// Allowed MIME types - whitelist approach for security
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",
  // Archives (for drawings/plans)
  "application/zip",
  "application/x-zip-compressed",
  // CAD/Drawings
  "application/acad",
  "application/x-acad",
  "application/dwg",
  "image/vnd.dwg",
]);

// Magic bytes for file type verification
const MAGIC_BYTES = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": null, // RIFF header - complex
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "application/zip": [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
  ],
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0]], // OLE compound doc
};

/**
 * Verify file magic bytes match claimed MIME type
 */
function verifyMagicBytes(buffer, claimedMimetype) {
  const signatures = MAGIC_BYTES[claimedMimetype];
  if (!signatures) {
    // No signature defined - allow but log
    return { valid: true, verified: false };
  }

  const header = buffer.slice(0, 16);
  for (const sig of signatures) {
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (header[i] !== sig[i]) {
        match = false;
        break;
      }
    }
    if (match) return { valid: true, verified: true };
  }

  return { valid: false, verified: true };
}

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
}

// Initialize on module load
ensureUploadDir().catch(console.error);

/**
 * Calculate SHA256 hash of file buffer
 */
function calculateHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Get file extension from mimetype or filename
 */
function getExtension(filename, mimetype) {
  // Try filename extension first
  const fileExt = path.extname(filename).toLowerCase();
  if (fileExt) return fileExt;

  // Fallback to mimetype
  const mimeMap = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "text/plain": ".txt",
    "text/csv": ".csv",
  };
  return mimeMap[mimetype] || "";
}

/**
 * Validate file before storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - Claimed MIME type
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFile(buffer, originalName, mimetype) {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${Math.round(
        MAX_FILE_SIZE / 1024 / 1024
      )}MB`,
    };
  }

  // Check MIME type whitelist
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    return {
      valid: false,
      error: `File type "${mimetype}" is not allowed`,
    };
  }

  // Check extension blacklist (prevent executable uploads even with spoofed MIME)
  const ext = path.extname(originalName).toLowerCase();
  const dangerousExtensions = [
    ".exe",
    ".dll",
    ".bat",
    ".cmd",
    ".sh",
    ".ps1",
    ".vbs",
    ".js",
    ".msi",
    ".scr",
    ".pif",
    ".com",
    ".jar",
    ".php",
    ".asp",
    ".aspx",
    ".jsp",
  ];
  if (dangerousExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension "${ext}" is not allowed for security reasons`,
    };
  }

  // Verify magic bytes match claimed MIME type
  const magicResult = verifyMagicBytes(buffer, mimetype);
  if (!magicResult.valid) {
    return {
      valid: false,
      error: "File content does not match claimed file type",
    };
  }

  return { valid: true };
}

/**
 * Store file locally
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<Object>} - File metadata
 * @throws {Error} If file validation fails
 */
async function storeFile(buffer, originalName, mimetype) {
  // Validate file before storing
  const validation = validateFile(buffer, originalName, mimetype);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  await ensureUploadDir();

  const fileId = uuidv4();
  const ext = getExtension(originalName, mimetype);
  const storageKey = `${fileId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storageKey);
  const sha256 = calculateHash(buffer);

  await fs.writeFile(filePath, buffer);

  return {
    storageKey,
    originalName,
    mimetype,
    sizeBytes: buffer.length,
    sha256,
  };
}

/**
 * Get file from storage
 * @param {string} storageKey - Storage key
 * @returns {Promise<Buffer>} - File buffer
 */
async function getFile(storageKey) {
  const filePath = path.join(UPLOAD_DIR, storageKey);
  return await fs.readFile(filePath);
}

/**
 * Delete file from storage
 * @param {string} storageKey - Storage key
 */
async function deleteFile(storageKey) {
  const filePath = path.join(UPLOAD_DIR, storageKey);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

/**
 * Check if file exists
 * @param {string} storageKey - Storage key
 * @returns {Promise<boolean>}
 */
async function fileExists(storageKey) {
  const filePath = path.join(UPLOAD_DIR, storageKey);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  storeFile,
  getFile,
  deleteFile,
  fileExists,
  validateFile,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};
