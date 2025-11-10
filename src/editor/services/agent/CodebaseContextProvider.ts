/**
 * Codebase Context Provider
 * Assembles codebase context for the AI agent including CLAUDE.md files,
 * scene state, selected entities, and project structure
 * Following PRD: docs/PRDs/editor/claude-agent-sdk-integration-prd.md
 */

import { Logger } from '@core/lib/logger';
import { useEditorStore } from '@editor/store/editorStore';
import type { ICodebaseContext } from './types';

const logger = Logger.create('CodebaseContextProvider');

const SCAN_CACHE_TTL = 60000; // 1 minute

export class CodebaseContextProvider {
  private memoryCache: Map<string, string> = new Map();
  private lastScanTime = 0;
  private projectStructureCache: string | null = null;

  /**
   * Get full codebase context including all available information
   */
  async getFullContext(): Promise<ICodebaseContext> {
    logger.debug('Assembling full context');

    try {
      const claudeMemory = await this.getMemoryFiles();

      const context: ICodebaseContext = {
        projectRoot: '/home/joao/projects/vibe-coder-3d',
        currentScene: this.getCurrentSceneName(),
        selectedEntities: this.getSelectedEntities(),
        recentFiles: this.getRecentFiles(),
        claudeMemory,
      };

      logger.debug('Context assembled', {
        memoryFileCount: claudeMemory.length,
        selectedEntityCount: context.selectedEntities.length,
      });

      return context;
    } catch (error) {
      logger.error('Failed to assemble context', { error });
      // Return empty context on error
      return {
        projectRoot: '/home/joao/projects/vibe-coder-3d',
        currentScene: null,
        selectedEntities: [],
        recentFiles: [],
        claudeMemory: [],
      };
    }
  }

  /**
   * Get context for a specific scene
   */
  async getSceneContext(sceneName: string): Promise<string> {
    logger.debug('Getting scene context', { sceneName });

    // TODO: In future, read scene file and extract entities/components
    return `Scene: ${sceneName}
Status: Context extraction not yet implemented
Note: Will include entity hierarchy, components, and relationships`;
  }

  /**
   * Get context for specific entities
   */
  async getEntityContext(entityIds: number[]): Promise<string> {
    logger.debug('Getting entity context', { entityIds });

    if (entityIds.length === 0) {
      return 'No entities selected';
    }

    // TODO: In future, extract entity details from ECS
    return `Selected Entities: ${entityIds.join(', ')}
Status: Entity context extraction not yet implemented
Note: Will include components, properties, and relationships`;
  }

  /**
   * Get all CLAUDE.md memory files from the project
   * Scans recursively and caches results
   */
  async getMemoryFiles(): Promise<string[]> {
    // Check cache
    if (Date.now() - this.lastScanTime < SCAN_CACHE_TTL && this.memoryCache.size > 0) {
      logger.debug('Using cached memory files', { count: this.memoryCache.size });
      return Array.from(this.memoryCache.values());
    }

    // For now, return known CLAUDE.md files
    // In a full implementation, this would scan the filesystem
    const knownClaudeFiles = [
      '/home/joao/projects/vibe-coder-3d/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/editor/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/editor/components/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/core/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/game/scenes/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/game/materials/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/game/prefabs/CLAUDE.md',
      '/home/joao/projects/vibe-coder-3d/src/game/inputs/CLAUDE.md',
    ];

    const memoryContents: string[] = [];

    // Simulate reading files (in production, would use actual file I/O)
    for (const filePath of knownClaudeFiles) {
      try {
        // TODO: Implement actual file reading via Vite plugin or API
        const content = await this.readClaudeFile(filePath);
        if (content) {
          this.memoryCache.set(filePath, content);
          memoryContents.push(`# Memory from ${filePath}\n\n${content}`);
        }
      } catch (error) {
        logger.warn('Failed to read CLAUDE.md file', { filePath, error });
      }
    }

    this.lastScanTime = Date.now();
    logger.info('Memory files scanned', { count: memoryContents.length });

    return memoryContents;
  }

  /**
   * Read a single CLAUDE.md file
   * TODO: Implement actual file reading
   */
  private async readClaudeFile(filePath: string): Promise<string | null> {
    // Placeholder: In production, use Vite plugin or API endpoint
    logger.debug('Reading CLAUDE.md file', { filePath });

    // For now, return null (files not accessible from browser context)
    // This would need to be implemented via:
    // 1. Vite plugin to expose files
    // 2. API endpoint to serve file contents
    // 3. Build-time processing to bundle CLAUDE.md files

    return null;
  }

  /**
   * Get current scene name from editor state or localStorage
   */
  private getCurrentSceneName(): string | null {
    try {
      // Try to get from localStorage
      const sceneData = localStorage.getItem('vibe-coder-3d-scene');
      if (sceneData) {
        const parsed = JSON.parse(sceneData);
        return parsed.metadata?.name || null;
      }
    } catch (error) {
      logger.warn('Failed to get current scene name', { error });
    }

    return null;
  }

  /**
   * Get selected entity IDs from editor store
   */
  private getSelectedEntities(): number[] {
    try {
      const state = useEditorStore.getState();
      return state.selectedIds || [];
    } catch (error) {
      logger.warn('Failed to get selected entities', { error });
      return [];
    }
  }

  /**
   * Get recently edited files
   * TODO: Implement file tracking
   */
  private getRecentFiles(): string[] {
    // Placeholder: Would track recently opened/edited files
    return [];
  }

  /**
   * Get project structure tree
   * TODO: Implement directory tree generation
   */
  async getProjectStructure(): Promise<string> {
    if (this.projectStructureCache) {
      return this.projectStructureCache;
    }

    // Placeholder: Would generate actual directory tree
    const structure = `
/vibe-coder-3d/
├── src/
│   ├── core/           # Core game engine
│   ├── editor/         # Unity-like editor
│   ├── game/           # Game assets & scenes
│   └── plugins/        # Vite plugins
├── rust/               # Rust engine
├── docs/               # Documentation
└── scripts/            # Build scripts
`;

    this.projectStructureCache = structure;
    return structure;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.projectStructureCache = null;
    this.lastScanTime = 0;
    logger.info('Context cache cleared');
  }
}
