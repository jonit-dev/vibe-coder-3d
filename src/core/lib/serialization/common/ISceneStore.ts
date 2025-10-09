/**
 * Scene file information returned by the store
 */
export interface ISceneFileInfo {
  name: string;
  modified: string;
  size: number;
  type?: string;
}

/**
 * Interface for scene storage operations
 * Abstracts file system operations to allow different storage backends
 */
export interface ISceneStore {
  /**
   * Read a scene file by name
   * @param name - The scene filename
   * @returns File content, modification time, and size
   */
  read(name: string): Promise<{ content: string; modified: string; size: number }>;

  /**
   * Write a scene file
   * @param name - The scene filename
   * @param content - The file content
   * @returns Modification time and size of written file
   */
  write(name: string, content: string): Promise<{ modified: string; size: number }>;

  /**
   * List all scene files
   * @returns Array of scene file information
   */
  list(): Promise<ISceneFileInfo[]>;

  /**
   * Check if a scene file exists
   * @param name - The scene filename
   * @returns True if file exists
   */
  exists(name: string): Promise<boolean>;

  /**
   * Sanitize a filename for safe storage
   * @param name - The desired filename
   * @param ext - The file extension (.json or .tsx)
   * @returns Sanitized filename with extension
   */
  sanitizeFilename(name: string, ext: '.json' | '.tsx'): string;
}
