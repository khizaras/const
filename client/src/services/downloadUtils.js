/**
 * Download utility using signed URLs for secure file access
 */
import apiClient from "./apiClient";

/**
 * Download a file using signed URL
 * First requests a signed download URL from the server, then triggers download
 * @param {number} fileId - The file ID
 * @param {string} originalName - Original filename for the download
 * @returns {Promise<void>}
 */
export async function downloadFileWithSignedUrl(fileId, originalName) {
  // Get signed URL from server
  const { data } = await apiClient.get(`/files/${fileId}/signed-url`);
  const signedUrl = data.url;

  // Use anchor click to trigger browser download
  const link = document.createElement("a");
  link.href = signedUrl;
  link.setAttribute("download", originalName || `file-${fileId}`);
  link.setAttribute("target", "_blank"); // fallback for browsers that don't auto-download
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Alternative: fetch blob then download (for cases where we need to process the file)
 */
export async function downloadFileAsBlob(fileId, originalName) {
  const res = await apiClient.get(`/files/${fileId}/download`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = originalName || `file-${fileId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default downloadFileWithSignedUrl;
