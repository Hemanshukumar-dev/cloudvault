/**
 * Email format validation (Google-style).
 * Rejects: @gmmail.com, test@, testgmail.com, test@com, Beast@.gmail.com, etc.
 */
const EMAIL_REGEX = /^[^\s@]+@(?!\.)[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value) {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return EMAIL_REGEX.test(trimmed)
}

export function normalizeEmail(value) {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase()
}

export const EMAIL_ERROR_MESSAGE = "Please enter a valid email address"
export const EMAIL_EXISTS_MESSAGE = "Email already in use"
