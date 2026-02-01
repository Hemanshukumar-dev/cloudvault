export const PENDING_SHARED_FILE_ID_KEY = "pendingSharedFileId"

export function getPendingSharedFileId() {
  return localStorage.getItem(PENDING_SHARED_FILE_ID_KEY)
}

export function setPendingSharedFileId(fileId) {
  if (fileId) localStorage.setItem(PENDING_SHARED_FILE_ID_KEY, fileId)
}

export function clearPendingSharedFileId() {
  localStorage.removeItem(PENDING_SHARED_FILE_ID_KEY)
}
