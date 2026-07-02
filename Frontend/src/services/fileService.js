import axiosInstance from '../api/axiosInstance';

/**
 * Upload a file to the backend.
 * Returns: { id, session_id, filename, file_type, rows_count, columns_count, expires_at }
 */
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Derive file_type from extension
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  formData.append('file_type', ext);
  return axiosInstance.post('/ai/upload/file/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min for large files
  });
};

/**
 * Get a preview of the uploaded data.
 */
export const getUploadPreview = (sessionId) =>
  axiosInstance.get(`/ai/upload/preview/?session_id=${sessionId}`);

/**
 * Delete/clear an upload session.
 */
export const clearUpload = (sessionId) =>
  axiosInstance.delete(`/ai/upload/clear/?session_id=${sessionId}`);

/**
 * Run an AI query against an uploaded dataset.
 * query_type: 'SEARCH' or 'IDENTIFY'
 */
export const runAIQuery = (sessionId, prompt, queryType = 'SEARCH') =>
  axiosInstance.post('/ai/upload/query/', {
    session_id: sessionId,
    prompt,
    query_type: queryType,
  });