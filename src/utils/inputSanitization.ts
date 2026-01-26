/**
 * Input sanitization utilities for user-generated content.
 * These provide client-side validation to improve UX - server-side validation
 * via RLS and triggers remains the source of truth.
 */

// Regex patterns for validation
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\uFEFF\u00A0\u2800]/g;
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;

/**
 * Sanitize a display name by removing potentially harmful characters
 */
export function sanitizeDisplayName(name: string): string {
  if (!name) return '';
  
  return name
    // Remove invisible characters that could be used to impersonate
    .replace(INVISIBLE_CHARS_REGEX, '')
    // Remove control characters
    .replace(CONTROL_CHARS_REGEX, '')
    // Remove any HTML tags
    .replace(HTML_TAG_REGEX, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate a display name and return error message if invalid
 */
export function validateDisplayName(name: string): string | null {
  const sanitized = sanitizeDisplayName(name);
  
  if (!sanitized) {
    return 'El nombre no puede estar vacío';
  }
  
  if (sanitized.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (sanitized.length > 50) {
    return 'El nombre no puede superar 50 caracteres';
  }
  
  // Check if name contains only allowed characters (letters, spaces, hyphens, apostrophes)
  const validNameRegex = /^[\p{L}\p{M}\s\-']+$/u;
  if (!validNameRegex.test(sanitized)) {
    return 'El nombre solo puede contener letras, espacios y guiones';
  }
  
  // Check for repeated characters (potential spam)
  if (/(.)\1{4,}/.test(sanitized)) {
    return 'El nombre contiene demasiados caracteres repetidos';
  }
  
  return null;
}

/**
 * Sanitize general text content (bio, messages, etc.)
 */
export function sanitizeTextContent(text: string): string {
  if (!text) return '';
  
  return text
    // Remove script tags completely
    .replace(SCRIPT_TAG_REGEX, '')
    // Remove control characters (keep newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove invisible characters
    .replace(INVISIBLE_CHARS_REGEX, '')
    // Normalize excessive whitespace but preserve intentional line breaks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if text contains potentially dangerous content
 */
export function hasDangerousContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for script injection attempts
  if (SCRIPT_TAG_REGEX.test(text)) return true;
  
  // Check for javascript: URLs
  if (/javascript:/i.test(text)) return true;
  
  // Check for data: URLs with scripts
  if (/data:text\/html/i.test(text)) return true;
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(text)) return true;
  
  return false;
}
