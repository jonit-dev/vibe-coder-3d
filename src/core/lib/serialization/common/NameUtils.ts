/**
 * Sanitize a scene name to be a valid React component name
 * Removes special characters, ensures it starts with a capital letter
 * @param name - The scene name to sanitize
 * @returns Sanitized component name
 */
export const sanitizeComponentName = (name: string): string => {
  // Remove special characters and spaces, capitalize first letter
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '') // Remove leading numbers
    .replace(/^./, (char) => char.toUpperCase());

  // Ensure it starts with a capital letter and has at least one character
  return sanitized || 'Scene';
};

/**
 * Sanitize a filename for safe file system storage
 * Removes special characters and ensures proper extension
 * @param name - The filename to sanitize
 * @param ext - Optional extension to ensure (e.g., '.json', '.tsx')
 * @returns Sanitized filename
 */
export const sanitizeFilename = (name: string, ext?: string): string => {
  // Remove any path separators and invalid characters
  const safe = name.replace(/[^a-zA-Z0-9\-_]/g, '_');

  if (ext) {
    return safe.endsWith(ext) ? safe : `${safe}${ext}`;
  }

  return safe;
};
