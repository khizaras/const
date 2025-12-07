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
 * Store file locally
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<Object>} - File metadata
 */
async function storeFile(buffer, originalName, mimetype) {
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
  UPLOAD_DIR,
};
