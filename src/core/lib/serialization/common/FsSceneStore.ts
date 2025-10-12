import { promises as fs } from 'fs';
import path from 'path';
import type { ISceneStore, ISceneFileInfo } from './ISceneStore';

/**
 * File system implementation of ISceneStore
 * Handles scene persistence to local file system
 */
export class FsSceneStore implements ISceneStore {
  constructor(private readonly baseDir: string) {}

  /**
   * Sanitize filename to prevent path traversal and ensure valid format
   */
  sanitizeFilename(name: string, ext: '.json' | '.tsx'): string {
    // Remove any path separators and invalid characters
    const safe = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    return safe.endsWith(ext) ? safe : `${safe}${ext}`;
  }

  /**
   * Read a scene file
   */
  async read(name: string): Promise<{ content: string; modified: string; size: number }> {
    const filepath = path.join(this.baseDir, name);

    // Ensure filepath is within baseDir (prevent path traversal)
    const resolvedPath = path.resolve(filepath);
    const resolvedBase = path.resolve(this.baseDir);
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Invalid file path: path traversal detected');
    }

    const content = await fs.readFile(filepath, 'utf-8');
    const stats = await fs.stat(filepath);

    return {
      content,
      modified: stats.mtime.toISOString(),
      size: stats.size,
    };
  }

  /**
   * Write a scene file
   */
  async write(name: string, content: string): Promise<{ modified: string; size: number }> {
    const filepath = path.join(this.baseDir, name);

    // Ensure filepath is within baseDir (prevent path traversal)
    const resolvedPath = path.resolve(filepath);
    const resolvedBase = path.resolve(this.baseDir);
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Invalid file path: path traversal detected');
    }

    // Ensure directory exists
    await fs.mkdir(this.baseDir, { recursive: true });

    // Write file
    await fs.writeFile(filepath, content, 'utf-8');

    // Get stats
    const stats = await fs.stat(filepath);

    return {
      modified: stats.mtime.toISOString(),
      size: stats.size,
    };
  }

  /**
   * List all scene files and folders in the directory
   * - Single-file scenes: SceneName.tsx
   * - Multi-file scenes: SceneName/ folder with SceneName.index.tsx
   */
  async list(): Promise<ISceneFileInfo[]> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.baseDir, { recursive: true });

      const files = await fs.readdir(this.baseDir);
      const infos: ISceneFileInfo[] = [];

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);

        try {
          const stats = await fs.stat(filepath);

          // Check for directories (multi-file scenes)
          if (stats.isDirectory()) {
            // Check if this folder has a .index.tsx file
            const indexFile = `${file}.index.tsx`;
            const indexPath = path.join(filepath, indexFile);

            try {
              const indexStats = await fs.stat(indexPath);
              if (indexStats.isFile()) {
                infos.push({
                  name: file,
                  modified: stats.mtime.toISOString(),
                  size: stats.size,
                });
              }
            } catch {
              // No .index.tsx file, skip this folder
              continue;
            }
          }
          // Check for single-file scenes (*.tsx)
          else if (stats.isFile() && file.endsWith('.tsx')) {
            // Remove .tsx extension for scene name
            const sceneName = file.replace(/\.tsx$/, '');
            infos.push({
              name: sceneName,
              modified: stats.mtime.toISOString(),
              size: stats.size,
            });
          }
        } catch {
          // Skip files/folders that can't be accessed
          continue;
        }
      }

      // Sort by modification time, newest first
      return infos.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    } catch {
      // Return empty array if directory doesn't exist or can't be read
      return [];
    }
  }

  /**
   * Check if a scene file exists
   */
  async exists(name: string): Promise<boolean> {
    try {
      const filepath = path.join(this.baseDir, name);

      // Ensure filepath is within baseDir (prevent path traversal)
      const resolvedPath = path.resolve(filepath);
      const resolvedBase = path.resolve(this.baseDir);
      if (!resolvedPath.startsWith(resolvedBase)) {
        return false;
      }

      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}
