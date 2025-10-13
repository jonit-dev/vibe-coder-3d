/**
 * Sanitize a scene name to be a valid camelCase filename
 * Removes special characters, ensures camelCase format
 * @param name - The scene name to sanitize
 * @returns Sanitized camelCase name
 */
export const sanitizeComponentName = (name: string): string => {
  // Remove special characters and spaces, ensure starts with lowercase
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '') // Remove leading numbers
    .replace(/^./, (char) => char.toLowerCase()); // camelCase: lowercase first letter

  // Ensure valid camelCase identifier
  return sanitized || 'scene';
};

/**
 * Sanitize a scene name to be a valid PascalCase filename
 * Removes special characters, ensures PascalCase format
 * @param name - The scene name to sanitize
 * @returns Sanitized PascalCase name
 */
export const sanitizePascalCase = (name: string): string => {
  // Remove special characters and spaces, ensure starts with uppercase
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '') // Remove leading numbers
    .replace(/^./, (char) => char.toUpperCase()); // PascalCase: uppercase first letter

  // Ensure valid PascalCase identifier
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
