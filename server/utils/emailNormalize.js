/**
 * Normalize email for storage and lookup: trim + lowercase (Google-style).
 */
function normalizeEmail(value) {
  if (value == null || typeof value !== "string") return ""
  return value.trim().toLowerCase()
}

export default normalizeEmail
